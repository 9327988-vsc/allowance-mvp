// src/components/modals/StorageFullModal.jsx — S-108 스토리지 부족 안내
import { useState, useEffect } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { cleanupOldCalendars } from "../../utils/storage";
import { exportData, downloadJSON, defaultExportFilename } from "../../utils/exportImport";
import { showToast } from "../../utils/toastManager";

export default function StorageFullModal({ pendingSave, onClose, onRetrySuccess }) {
  const contentRef = useModalBase(onClose);
  const [targets, setTargets] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const result = cleanupOldCalendars(6, { dryRun: true });
    setTargets(result.deletedKeys);
  }, []);

  // 정리 후 자동 재시도
  function retryPendingSave() {
    if (!pendingSave) return;
    try {
      const result = pendingSave.fn(...pendingSave.args);
      if (result.success) {
        showToast({ type: "success", message: "✅ 저장되었습니다" });
        if (onRetrySuccess) onRetrySuccess();
        onClose();
      } else {
        showToast({ type: "error", message: "정리 후에도 저장 실패. 관리자에게 문의하세요" });
      }
    } catch {
      showToast({ type: "error", message: "정리 후에도 저장 실패. 관리자에게 문의하세요" });
    }
  }

  // [지금 정리]
  function handleCleanupNow() {
    setProcessing(true);
    try {
      cleanupOldCalendars(6);
      showToast({ type: "success", message: `✅ ${targets.length}개월 캘린더 정리 완료` });
      retryPendingSave();
    } catch {
      showToast({ type: "error", message: "정리 중 오류가 발생했습니다" });
    } finally {
      setProcessing(false);
    }
  }

  // [내보내기 후 정리]
  async function handleExportThenCleanup() {
    setProcessing(true);
    try {
      const data = await exportData();
      downloadJSON(data, defaultExportFilename());
      showToast({ type: "success", message: "✅ 내보내기 완료" });
      cleanupOldCalendars(6);
      retryPendingSave();
    } catch {
      showToast({ type: "error", message: "내보내기 실패" });
    }
    setProcessing(false);
  }

  // 키에서 연-월 추출
  function formatKey(key) {
    const match = key.match(/calendar_v1_(\d{4})_(\d{2})/);
    return match ? `${match[1]}-${match[2]}` : key;
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-1)" }} onClick={processing ? undefined : onClose}>
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 440, width: "90%" }}
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label="저장 공간 부족"
      >
        <h2 className="modal-title mb-3">⚠ 저장 공간이 부족합니다</h2>

        <p className="mb-3">
          저장 공간이 가득 차서 데이터를 저장할 수 없습니다.
          오래된 캘린더 데이터를 정리하면 공간을 확보할 수 있어요.
        </p>

        {targets.length > 0 ? (
          <div className="mb-4">
            <p className="font-medium mb-1 text-sm">정리 대상 (6개월 이전):</p>
            <ul className="text-sm" style={{ paddingLeft: "1.2em", listStyle: "disc" }}>
              {targets.map(k => (
                <li key={k}>{formatKey(k)}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            정리할 오래된 데이터가 없습니다. 관리자에게 문의하세요.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {targets.length > 0 && (
            <>
              <button
                onClick={handleExportThenCleanup}
                disabled={processing}
                className="px-4 py-2 rounded-md border text-sm"
                style={{ color: "var(--color-primary)" }}
              >
                {processing ? "처리 중..." : "📤 내보내기 후 정리"}
              </button>
              <button
                onClick={handleCleanupNow}
                disabled={processing}
                className="px-4 py-2 rounded-md text-white text-sm"
                style={{ background: "var(--color-primary)" }}
              >
                {processing ? "처리 중..." : "🧹 지금 정리"}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 rounded-md border text-sm"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
