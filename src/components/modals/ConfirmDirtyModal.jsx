// src/components/modals/ConfirmDirtyModal.jsx — S-106 변경 확인
import { useModalBase } from "../../hooks/useModalBase";

export default function ConfirmDirtyModal({ onContinueEdit, onDiscard }) {
  const contentRef = useModalBase(onContinueEdit);

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-3)" }}
      onClick={onContinueEdit}
    >
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 360, width: "90%", textAlign: "center" }}
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-label="저장��지 않은 변경 사항"
        aria-modal="true"
        aria-describedby="modal-desc"
      >
        <div className="text-2xl mb-3">⚠️</div>
        <p id="modal-desc" className="font-medium mb-1">저장하지 않은 변경 사항이 있습니다.</p>
        <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
          닫으면 변경 사항이 사라집니다.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onContinueEdit}
            className="px-4 py-2 rounded-md text-white"
            style={{ background: "var(--color-primary)" }}
          >
            계속 편집
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-md border"
            style={{ color: "var(--color-text-secondary)" }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
