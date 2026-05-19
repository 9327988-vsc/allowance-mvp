// src/components/modals/CleanupConfirmModal.jsx — S-116 오래된 데이터 정리 확인
import { useState, useEffect } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { cleanupOldCalendars } from "../../utils/storage";
import { showToast } from "../../utils/toastManager";

export default function CleanupConfirmModal({ onClose, onCleaned }) {
  const contentRef = useModalBase(onClose);
  const [targets, setTargets] = useState([]);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    const result = cleanupOldCalendars(6, { dryRun: true });
    setTargets(result.deletedKeys);
  }, []);


  function handleCleanup() {
    setCleaning(true);
    try {
      const result = cleanupOldCalendars(6);
      showToast({ type: "success", message: `✅ ${result.deletedCount}개월 캘린더가 정리되었습니다` });
      if (onCleaned) onCleaned();
      onClose();
    } catch (err) {
      showToast({ type: "error", message: "정리 중 오류가 발생했습니다: " + (err.message || "알 수 없는 오류") });
      setCleaning(false);
    }
  }

  // 각 키에서 연-월 추출 + 항목수
  function getKeyInfo(key) {
    const match = key.match(/calendar_v1_(\d{4})_(\d{2})/);
    if (!match) return { label: key, detail: "" };
    const ym = `${match[1]}-${match[2]}`;
    const raw = localStorage.getItem(key);
    let detail = "";
    if (raw) {
      try {
        const data = JSON.parse(raw);
        const cells = Object.values(data.cells || {});
        const extraCount = cells.reduce((s, c) => s + (c.extra_items?.length || 0), 0);
        const memoCount = cells.filter(c => c.memo).length;
        const parts = [];
        if (extraCount > 0) parts.push(`${extraCount}개 임시 항목`);
        if (memoCount > 0) parts.push(`메모 ${memoCount}건`);
        detail = parts.length > 0 ? ` (${parts.join(", ")})` : "";
      } catch { /* ignore */ }
    }
    return { label: ym, detail };
  }

  // 총 크기 계산
  const totalBytes = targets.reduce((sum, key) => {
    const raw = localStorage.getItem(key);
    return sum + (raw ? raw.length : 0);
  }, 0);

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-3)" }}
      onClick={() => { if (!cleaning) onClose(); }}
    >
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 440, width: "95%" }}
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-label="오래된 데이터 정리"
        aria-modal="true"
        aria-describedby="modal-desc"
      >
        <h2 className="modal-title mb-3">🧹 오래된 데이터 정리</h2>

        <p id="modal-desc" className="mb-2">다음 캘린더가 삭제됩니다 (오늘 - 6개월 이전):</p>

        <ul className="text-sm mb-3" style={{ paddingLeft: "1.2em", listStyle: "disc" }}>
          {targets.map(key => {
            const info = getKeyInfo(key);
            return <li key={key}>{info.label}{info.detail}</li>;
          })}
          <li style={{ color: "var(--color-text-secondary)" }}>
            (총 {targets.length}개월, 총 {totalBytes.toLocaleString("ko-KR")} bytes)
          </li>
        </ul>

        <p className="text-sm mb-1" style={{ color: "var(--color-success)" }}>
          ✅ 미래 캘린더는 보호됩니다.
        </p>

        <p className="text-sm mb-4" style={{ color: "var(--color-danger)" }}>
          ⚠ 이 작업은 되돌릴 수 없습니다. 필요하면 📤 내보내기로 미리 백업하세요.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={cleaning}
            className="px-4 py-2 rounded-md border"
          >
            취소
          </button>
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="px-4 py-2 rounded-md text-white"
            style={{ background: "var(--color-danger)" }}
          >
            {cleaning ? "정리 중..." : "정리하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
