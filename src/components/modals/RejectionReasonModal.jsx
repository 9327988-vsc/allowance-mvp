// src/components/modals/RejectionReasonModal.jsx — S-2-003 거절 사유 입력

import { useState, useEffect } from "react";

const MAX_REASON_LENGTH = 200;

/**
 * @param {{
 *   onSubmit: (reason: string) => void,
 *   onClose: () => void,
 *   loading: boolean
 * }} props
 */
export default function RejectionReasonModal({ onSubmit, onClose, loading }) {
  const [reason, setReason] = useState("");

  const trimmed = reason.trim();
  const isValid = trimmed.length >= 1 && trimmed.length <= MAX_REASON_LENGTH;

  // ESC 키로 모달 닫기
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !loading) {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || loading) return;
    onSubmit(trimmed);
  }

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-2)" }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reject-title"
    >
      <div
        className="modal-content"
        style={{ maxWidth: 400, padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header modal-header--danger">
          <h2 id="reject-title" className="modal-title">거절 사유</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="modal-close"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-hint" style={{ marginBottom: "var(--space-4)" }}>
              <span>📝</span>
              <span>자녀에게 전달할 거절 사유를 입력해주세요.</span>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={MAX_REASON_LENGTH}
              placeholder="예: 이번 달은 용돈을 이미 드렸어요"
              disabled={loading}
              autoFocus
              rows={3}
              className="rejection-textarea"
              aria-label="거절 사유"
            />
            <div className="comment-form__count" style={{ marginTop: "var(--space-1)" }}>
              <span className={trimmed.length > MAX_REASON_LENGTH ? "comment-form__count--over" : ""}>
                {trimmed.length}/{MAX_REASON_LENGTH}
              </span>
            </div>
          </div>

          <div className="modal-footer modal-footer--stretch">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn--secondary"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="btn btn--danger"
            >
              {loading ? (
                <><span className="spinner spinner--sm spinner--on-danger" /> 처리 중</>
              ) : "거절 확인"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
