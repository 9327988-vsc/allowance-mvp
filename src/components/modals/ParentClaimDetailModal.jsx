// src/components/modals/ParentClaimDetailModal.jsx — S-2-002 부모 청구 상세
import { useState, useEffect, useMemo, useRef } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { useClaim } from "../../hooks/useClaim";
import { useToast } from "../../hooks/useToast";
import { useClaimActions } from "../../hooks/useClaimActions";
import { isOnline } from "../../utils/onlineStatus";
import { getMessageForError } from "../../constants/errorMessages";
import { getCategoryIcon } from "../../constants/categories";
import StatusBadge from "../widgets/StatusBadge";
import CommentSection from "../widgets/CommentSection";
import SnapshotCalendar from "../widgets/SnapshotCalendar";
import RejectionReasonModal from "./RejectionReasonModal";
import { formatAmountShort } from "../../utils/formatAmount";
import { loadUserPrefs } from "../../utils/userPrefs";
import { getActiveUser } from "../../utils/authStore";

/**
 * @param {{
 *   claimSummary: { claim_id, status },
 *   familyContext: import("../../utils/familyContext").FamilyContextData,
 *   onClose: () => void
 * }} props
 */
export default function ParentClaimDetailModal({ claimSummary, familyContext, onClose }) {
  const contentRef = useModalBase(onClose);
  const startDay = useMemo(() => { const uid = getActiveUser(); const p = uid ? loadUserPrefs(uid) : {}; return p.calendar_start === "monday" ? 1 : 0; }, []);
  const { claim, fetchClaim } = useClaim(claimSummary.claim_id);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showUndoRejectConfirm, setShowUndoRejectConfirm] = useState(false);
  const [showPartialPay, setShowPartialPay] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const { showToast } = useToast();

  const {
    approveAction,
    payAction,
    handleReject: handleRejectAction,
    handleAction,
    undoRejectAction,
    isActing,
  } = useClaimActions({ claim, familyContext, showToast, onClose, fetchClaim });

  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

  // 30초 폴링 — 다른 부모가 처리했을 때 반영 (ref로 최신 fetchClaim 참조)
  const fetchClaimRef = useRef(fetchClaim);
  fetchClaimRef.current = fetchClaim;

  useEffect(() => {
    const interval = setInterval(() => {
      fetchClaimRef.current();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleReject(reason) {
    const result = await handleRejectAction(reason);
    if (result && result.success) {
      setShowRejectModal(false);
      onClose();
    }
  }

  if (!claim) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" style={{ maxWidth: 440, padding: 0 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">청구 상세</h2>
            <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
          </div>
          <div className="modal-body">
            <div className="modal-empty">
              <span className="spinner spinner--md" style={{ display: "block", margin: "0 auto var(--space-3)" }} />
              <p className="modal-empty__text">불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const calc = claim.snapshot?.calculation;
  const customCategories = claim.snapshot?.custom_categories || [];

  // 카테고리별 그룹
  const extraGroups = {};
  if (calc?.cells) {
    calc.cells.forEach((c) => {
      (c.extra_items || []).forEach((item) => {
        const cat = item.category;
        if (!extraGroups[cat]) {
          extraGroups[cat] = { count: 0, total: 0, icon: getCategoryIcon(cat, customCategories) };
        }
        extraGroups[cat].count++;
        extraGroups[cat].total += item.amount;
      });
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 460, maxHeight: "90vh", overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-detail-title"
      >
        {/* 헤더 */}
        <div className="modal-header">
          <h2 id="claim-detail-title" className="modal-title">
            {claim.month}월 {claim.is_extra ? "추가" : "정기"} 청구
          </h2>
          <button
            onClick={onClose}
            disabled={isActing}
            className="modal-close"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "var(--space-5)" }}>
          {/* 상태 배지 */}
          <div style={{ marginBottom: "var(--space-4)" }}>
            <StatusBadge status={claim.status} size="md" />
          </div>

          {/* 스냅샷 미리보기 */}
          {!claim.snapshot && (
            <div className="detail-card">
              <div className="detail-card__body" style={{ textAlign: "center", padding: "var(--space-4)", color: "var(--color-text-tertiary)" }}>
                📄 스냅샷 데이터가 없습니다
              </div>
            </div>
          )}
          {calc && (
            <div className="detail-card">
              <div className="detail-card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>청구 내역 ({claim.snapshot?.snapshot_taken_at ? new Date(claim.snapshot.snapshot_taken_at).toLocaleDateString("ko-KR") : "날짜 없음"} 기준)</span>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="btn btn--ghost"
                  style={{ padding: "2px 8px", minHeight: "auto", fontSize: "var(--font-size-xs)" }}
                >
                  {showCalendar ? "📋 내역" : "📅 달력"}
                </button>
              </div>

              {showCalendar ? (
                <div style={{ padding: "var(--space-3) var(--space-4)" }}>
                  <SnapshotCalendar
                    year={claim.year}
                    month={claim.month}
                    cells={calc.cells}
                    customCategories={customCategories}
                    startDay={startDay}
                  />
                </div>
              ) : (
                <>
                  <div className="detail-card__body">
                    {calc.base_allowance > 0 && (
                      <div className="detail-row">
                        <span className="detail-row__label">💰 기본 용돈</span>
                        <span className="detail-row__amount">{formatAmountShort(calc.base_allowance)}<span className="amount-unit">원</span></span>
                      </div>
                    )}
                    {calc.school_total > 0 && (
                      <div className="detail-row">
                        <span className="detail-row__label">🏫 학교 버스</span>
                        <span className="detail-row__amount">{formatAmountShort(calc.school_total)}<span className="amount-unit">원</span></span>
                      </div>
                    )}
                    {calc.academy_total > 0 && (
                      <div className="detail-row">
                        <span className="detail-row__label">✏️ 학원 버스</span>
                        <span className="detail-row__amount">{formatAmountShort(calc.academy_total)}<span className="amount-unit">원</span></span>
                      </div>
                    )}
                    {Object.entries(extraGroups).map(([cat, g]) => (
                      <div key={cat} className="detail-row">
                        <span className="detail-row__label">{g.icon} {g.count > 1 ? `${cat} ${g.count}건` : cat}</span>
                        <span className="detail-row__amount">{formatAmountShort(g.total)}<span className="amount-unit">원</span></span>
                      </div>
                    ))}
                  </div>
                  <div className="detail-total">
                    <span>합계</span>
                    <span className="detail-total__amount">{formatAmountShort(calc.total)}<span className="amount-unit" style={{ color: "var(--color-primary)" }}>원</span></span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 이월 금액 (있을 경우) */}
          {claim.snapshot?.carryover && claim.snapshot.carryover.total > 0 && (
            <div className="carryover-section">
              <div className="carryover-toggle__title" style={{ marginBottom: "var(--space-2)" }}>
                📦 이월 청구 포함 (+{formatAmountShort(claim.snapshot.carryover.total)}<span className="amount-unit">원</span>)
              </div>
              {claim.snapshot.carryover.auto && (
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                  {claim.snapshot.carryover.auto.month}월 미청구분 {claim.snapshot.carryover.auto.items.length}건
                </div>
              )}
              {claim.snapshot.carryover.manual && (
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                  수동 입력: {claim.snapshot.carryover.manual.note} ({formatAmountShort(claim.snapshot.carryover.manual.amount)}<span className="amount-unit">원</span>)
                </div>
              )}
            </div>
          )}

          {/* 거절 사유 (rejected 일 때) */}
          {claim.status === "rejected" && claim.rejection_reason && (
            <div className="rejection-box">
              <div className="rejection-box__label">거절 사유</div>
              <p className="rejection-box__text">{claim.rejection_reason}</p>
            </div>
          )}

          {/* 타임라인 */}
          <div className="timeline">
            <div className="timeline__item">
              <div className="timeline__dot timeline__dot--active" />
              <div className="timeline__content">
                <div className="timeline__label">📤 제출</div>
                <div className="timeline__date">{new Date(claim.submitted_at).toLocaleString("ko-KR")}</div>
              </div>
            </div>
            {claim.decided_at && (
              <div className="timeline__item">
                <div className={`timeline__dot ${claim.status === "rejected" ? "timeline__dot--error" : "timeline__dot--success"}`} />
                <div className="timeline__content">
                  <div className="timeline__label">{claim.status === "rejected" ? "❌ 거절" : "✅ 승인"}</div>
                  <div className="timeline__date">{new Date(claim.decided_at).toLocaleString("ko-KR")}</div>
                </div>
              </div>
            )}
            {claim.paid_at && (
              <div className="timeline__item">
                <div className="timeline__dot timeline__dot--success" />
                <div className="timeline__content">
                  <div className="timeline__label">
                    💰 지급{claim.paid_amount ? ` (${claim.paid_amount.toLocaleString("ko-KR")}원 / ${(claim.snapshot?.calculation?.total || 0).toLocaleString("ko-KR")}원)` : ""}
                  </div>
                  <div className="timeline__date">{new Date(claim.paid_at).toLocaleString("ko-KR")}</div>
                </div>
              </div>
            )}
            {claim.received_at && (
              <div className="timeline__item">
                <div className="timeline__dot timeline__dot--success" />
                <div className="timeline__content">
                  <div className="timeline__label">📥 수령 확인</div>
                  <div className="timeline__date">{new Date(claim.received_at).toLocaleString("ko-KR")}</div>
                </div>
              </div>
            )}
          </div>

          {/* 댓글 */}
          <CommentSection
            claimId={claim.claim_id}
            comments={claim.comments}
            reactions={claim.reactions}
            claimUpdatedAt={claim.updated_at}
            onCommentAdded={fetchClaim}
          />
        </div>

        {/* 액션 버튼 */}
        {(claim.status === "pending" || claim.status === "approved" || claim.status === "rejected") && (
          <div className="modal-footer modal-footer--stretch">
            {claim.status === "pending" && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isActing}
                  className="btn btn--danger"
                >
                  {isActing ? "..." : "❌ 거절"}
                </button>
                <button
                  onClick={() => handleAction(approveAction)}
                  disabled={isActing}
                  className="btn btn--primary"
                >
                  {approveAction.loading ? (
                    <><span className="spinner spinner--sm spinner--on-primary" /> 처리 중</>
                  ) : "✅ 승인"}
                </button>
              </>
            )}

            {claim.status === "approved" && !showPartialPay && (
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button
                  onClick={() => handleAction(payAction)}
                  disabled={isActing}
                  className="btn btn--success btn--lg"
                  style={{ flex: 1 }}
                >
                  {payAction.loading ? (
                    <><span className="spinner spinner--sm spinner--on-primary" /> 처리 중</>
                  ) : "💸 전액 지급"}
                </button>
                <button
                  onClick={() => setShowPartialPay(true)}
                  disabled={isActing}
                  className="btn btn--secondary btn--lg"
                >
                  부분 지급
                </button>
              </div>
            )}

            {claim.status === "approved" && showPartialPay && (
              <div className="partial-pay-form" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                  지급 금액 (청구액: {(claim.snapshot?.calculation?.total || 0).toLocaleString("ko-KR")}원)
                </label>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <input
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="금액 입력"
                    className="input"
                    style={{ flex: 1 }}
                    min="1"
                    max={claim.snapshot?.calculation?.total || 999999}
                  />
                  <span style={{ display: "flex", alignItems: "center", color: "var(--color-text-secondary)" }}>원</span>
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button
                    onClick={() => {
                      const amt = parseInt(partialAmount, 10);
                      const total = claim.snapshot?.calculation?.total || 0;
                      if (!amt || amt < 1) {
                        showToast({ type: "error", message: "1원 이상 입력해주세요" });
                        return;
                      }
                      if (amt > total) {
                        showToast({ type: "error", message: "청구액을 초과할 수 없어요" });
                        return;
                      }
                      payAction.run(amt).catch((err) => {
                        if (err.code === "CONFLICT") {
                          showToast({ type: "error", message: "이미 처리된 청구입니다" });
                          onClose();
                        } else {
                          showToast({ type: "error", message: getMessageForError(err) });
                        }
                      });
                    }}
                    disabled={isActing}
                    className="btn btn--success"
                    style={{ flex: 1 }}
                  >
                    {payAction.loading ? "처리 중..." : "💸 부분 지급"}
                  </button>
                  <button
                    onClick={() => { setShowPartialPay(false); setPartialAmount(""); }}
                    className="btn btn--secondary"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {claim.status === "rejected" && (
              <button
                onClick={() => {
                  if (!isOnline()) {
                    showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
                    return;
                  }
                  setShowUndoRejectConfirm(true);
                }}
                disabled={isActing}
                className="btn btn--secondary btn--full"
              >
                {undoRejectAction.loading ? (
                  <><span className="spinner spinner--sm" /> 처리 중</>
                ) : "↩️ 거절 취소"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 거절 취소 확인 */}
      {showUndoRejectConfirm && (
        <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-3)" }} onClick={() => setShowUndoRejectConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: 360, width: "90%" }} onClick={e => e.stopPropagation()}>
            <p className="mb-3">거절을 취소하고 다시 대기 상태로 되돌릴까요?</p>
            <div className="flex justify-end gap-2">
              <button className="btn btn--secondary" onClick={() => setShowUndoRejectConfirm(false)}>취소</button>
              <button className="btn btn--primary" onClick={() => { setShowUndoRejectConfirm(false); handleAction(undoRejectAction); }}>확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 거절 사유 모달 */}
      {showRejectModal && (
        <RejectionReasonModal
          onSubmit={handleReject}
          onClose={() => setShowRejectModal(false)}
          loading={isActing}
        />
      )}
    </div>
  );
}
