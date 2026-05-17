// src/components/modals/PinResetModal.jsx — 관리자용 PIN 초기화 요청 관리
import { useState, useEffect } from "react";
import { loadPinResetRequests, approvePinReset, rejectPinReset, clearResolvedPinResets } from "../../utils/authStore";

export default function PinResetModal({ onClose }) {
  const [requests, setRequests] = useState(() => loadPinResetRequests());

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const [confirmApproveId, setConfirmApproveId] = useState(null);

  function handleApprove(userId) {
    setConfirmApproveId(userId);
  }

  function executeApprove() {
    try {
      approvePinReset(confirmApproveId);
      setRequests(loadPinResetRequests());
    } catch (err) {
      console.error("PIN reset approve failed:", err);
    }
    setConfirmApproveId(null);
  }

  function handleReject(userId) {
    try {
      rejectPinReset(userId);
      setRequests(loadPinResetRequests());
    } catch (err) {
      console.error("PIN reset reject failed:", err);
    }
  }

  function handleClearResolved() {
    clearResolvedPinResets();
    setRequests(loadPinResetRequests());
  }

  const pending = requests.filter(r => r.status === "pending");
  const resolved = requests.filter(r => r.status !== "pending");

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🔑 비밀번호 관리</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>
        <div className="modal-body">
          {pending.length === 0 && resolved.length === 0 && (
            <div style={{ textAlign: "center", padding: "var(--space-6) 0", color: "var(--color-text-tertiary)" }}>
              비밀번호 초기화 요청이 없습니다
            </div>
          )}

          {pending.length > 0 && (
            <div>
              <h3 style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-2)" }}>
                대기 중 ({pending.length})
              </h3>
              {pending.map(r => (
                <div key={r.user_id} className="pin-reset-card pin-reset-card--pending">
                  <div className="pin-reset-card__info">
                    <span className="pin-reset-card__name">{r.display_name}</span>
                    <span className="pin-reset-card__role">{r.role === "parent" ? "부모" : "자녀"}</span>
                    <span className="pin-reset-card__date">
                      {new Date(r.requested_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="pin-reset-card__actions">
                    <button className="btn btn--sm btn--primary" onClick={() => handleApprove(r.user_id)}>
                      승인
                    </button>
                    <button className="btn btn--sm btn--ghost" onClick={() => handleReject(r.user_id)}>
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div style={{ marginTop: pending.length > 0 ? "var(--space-4)" : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                <h3 style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)" }}>
                  처리 완료 ({resolved.length})
                </h3>
                <button className="btn btn--ghost btn--sm" onClick={handleClearResolved} style={{ fontSize: "var(--font-size-xs)" }}>
                  기록 삭제
                </button>
              </div>
              {resolved.map((r, i) => (
                <div key={`${r.user_id}-${i}`} className="pin-reset-card pin-reset-card--resolved">
                  <div className="pin-reset-card__info">
                    <span className="pin-reset-card__name">{r.display_name}</span>
                    <span className={`pin-reset-card__status pin-reset-card__status--${r.status}`}>
                      {r.status === "approved" ? "승인됨" : "거절됨"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer modal-footer--stretch">
          <button onClick={onClose} className="btn btn--secondary" style={{ width: "100%" }}>닫기</button>
        </div>
      </div>

      {confirmApproveId && (
        <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-3)" }} onClick={() => setConfirmApproveId(null)}>
          <div className="modal-content" style={{ maxWidth: 360, width: "90%" }} onClick={e => e.stopPropagation()}>
            <p className="mb-3">이 계정의 비밀번호를 초기화할까요?<br />다음 로그인 시 새 PIN을 설정하게 됩니다.</p>
            <div className="flex justify-end gap-2">
              <button className="btn btn--secondary" onClick={() => setConfirmApproveId(null)}>취소</button>
              <button className="btn btn--primary" onClick={executeApprove}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
