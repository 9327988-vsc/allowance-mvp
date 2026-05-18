// src/components/modals/ConfirmOverwriteModal.jsx — S-115 가져오기 덮어쓰기 확인
import { useState } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { showToast } from "../../utils/toastManager";

export default function ConfirmOverwriteModal({ onCancel, onConfirm }) {
  const contentRef = useModalBase(onCancel);
  const [processing, setProcessing] = useState(false);

  async function handleConfirm() {
    setProcessing(true);
    try {
      await onConfirm();
    } catch (err) {
      showToast({ type: "error", message: "처리 중 오류가 발생했어요" });
      setProcessing(false);
    }
  }

  // 기존 데이터 카운트 (초기 1회만 계산)
  const [calendarCount] = useState(() =>
    Object.keys(localStorage).filter(k =>
      k.startsWith("calendar_v1_") && !k.includes("_corrupted_")
    ).length
  );
  const [categoryCount] = useState(() => {
    try {
      const categoryData = localStorage.getItem("custom_categories_v1");
      return JSON.parse(categoryData)?.categories?.length || 0;
    } catch { return 0; }
  });

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-3)" }}
      onClick={() => { if (!processing) onCancel(); }}
    >
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 440, width: "95%" }}
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-label="덮어쓰기 확인"
        aria-modal="true"
        aria-describedby="modal-desc"
      >
        <h2 className="modal-title mb-3">⚠ 덮어쓰기 확인</h2>

        <p id="modal-desc" className="mb-3">
          현재 저장된 데이터가 모두 삭제되고, 백업 파일의 내용으로 완전히 대체됩니다.
        </p>

        <div className="mb-3">
          <p className="font-medium mb-1">▸ 삭제 대상</p>
          <ul className="text-sm" style={{ paddingLeft: "1.2em", listStyle: "disc" }}>
            <li>자녀 설정</li>
            <li>캘린더 데이터 ({calendarCount}개월 분)</li>
            <li>사용자 정의 카테고리 ({categoryCount}개)</li>
            <li>손상 백업 파일</li>
          </ul>
        </div>

        <p className="text-sm mb-4" style={{ color: "var(--color-danger)" }}>
          ⚠ 이 작업은 되돌릴 수 없습니다. 미리 📤 내보내기로 백업하셨나요?
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-2 rounded-md border"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="px-4 py-2 rounded-md text-white"
            style={{ background: "var(--color-danger)" }}
          >
            {processing ? "처리 중..." : "삭제 후 가져오기"}
          </button>
        </div>
      </div>
    </div>
  );
}
