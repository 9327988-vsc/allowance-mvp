// src/components/modals/ChildClaimDetailModal.jsx — S-2-102 자녀 청구 상세 + [받았어요]

import { useState, useEffect, useCallback } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useClaim } from "../../hooks/useClaim";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useToast } from "../../hooks/useToast";
import { getKVAdapter } from "../../utils/kvAdapter";

import { isOnline } from "../../utils/onlineStatus";
import { getMessageForError } from "../../constants/errorMessages";
import { getCategoryIcon } from "../../constants/categories";
import StatusBadge from "../widgets/StatusBadge";
import CommentSection from "../widgets/CommentSection";
import { formatAmountShort } from "../../utils/formatAmount";

/**
 * @param {{
 *   claimSummary: { claim_id },
 *   onClose: () => void
 * }} props
 */
export default function ChildClaimDetailModal({ claimSummary, onClose }) {
  const { claim, fetchClaim } = useClaim(claimSummary.claim_id);
  const { showToast } = useToast();
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

  // 수령 확인
  const receiveAction = useAsyncAction(useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    await adapter.receiveClaim(claim.claim_id, {
      expected_updated_at: claim.updated_at,
    });
    showToast({ type: "success", message: "수령 확인 완료!" });
    onClose();
  }, [claim, showToast, onClose]));

  // ESC 키 핸들러
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && !receiveAction.loading) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, receiveAction.loading]);

  // 30초 폴링 — 부모가 승인/거절/지급했을 때 반영 (터미널 상태에서는 중지)
  useEffect(() => {
    const terminalStates = ["received", "rejected"];
    if (claim && terminalStates.includes(claim.status)) return;
    const interval = setInterval(() => {
      fetchClaim();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchClaim, claim]);

  function handleReceive() {
    receiveAction.run().catch((err) => {
      if (err.code === "CONFLICT") {
        showToast({ type: "error", message: "이미 처리되었습니다. 새로고침 해주세요." });
        onClose();
      } else if (err.code === "ALREADY_RECEIVED") {
        showToast({ type: "info", message: "이미 수령 확인했어요" });
        onClose();
      } else {
        showToast({ type: "error", message: getMessageForError(err) });
      }
    });
  }

  if (!claim) {
    return (
      <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-2)" }}>
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

  const canReceive = claim && (
    (claim.status === "paid" && !claim.received_at) ||
    (claim.type === "grant" && claim.status === "granted")
  );

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-2)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="child-detail-title"
    >
      <div
        ref={trapRef}
        className="modal-content"
        style={{ maxWidth: 440, maxHeight: "90vh", overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="child-detail-title" className="modal-title">
            {claim.type === "grant"
              ? `💝 ${claim.name || "추가 보너스"}`
              : `${claim.month}월 ${claim.is_extra ? "추가" : "정기"} 청구`}
          </h2>
          <button
            onClick={onClose}
            disabled={receiveAction.loading}
            className="modal-close"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "var(--space-5)" }}>
          {/* 상태 */}
          <div style={{ marginBottom: "var(--space-4)" }}>
            <StatusBadge status={claim.status} size="md" />
            {claim.received_at && (
              <span style={{ marginLeft: 8, fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                📥 {new Date(claim.received_at).toLocaleDateString("ko-KR")} 수령
              </span>
            )}
          </div>

          {/* 보너스(grant) 상세 */}
          {claim.type === "grant" && (
            <div className="detail-card">
              <div className="detail-card__body">
                <div className="detail-row">
                  <span className="detail-row__label">💝 보너스</span>
                  <span className="detail-row__amount">{formatAmountShort(claim.amount)}<span className="amount-unit">원</span></span>
                </div>
                {claim.reason && (
                  <div className="detail-row">
                    <span className="detail-row__label">📝 사유</span>
                    <span className="detail-row__amount" style={{ fontWeight: "normal", fontSize: "var(--font-size-sm)" }}>{claim.reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 스냅샷 */}
          {calc && (
            <div className="detail-card">
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
            </div>
          )}

          {/* 이월 금액 */}
          {claim.snapshot?.carryover && claim.snapshot.carryover.total > 0 && (
            <div className="carryover-section">
              <div className="carryover-toggle__title" style={{ marginBottom: "var(--space-2)" }}>
                📦 이월 청구 포함 (+{formatAmountShort(claim.snapshot.carryover.total)}<span className="amount-unit">원</span>)
              </div>
              {claim.snapshot.carryover.auto && (
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                  {claim.snapshot.carryover.auto.month}월 미청구분 {claim.snapshot.carryover.auto.items.length}건
                </div>
              )}
              {claim.snapshot.carryover.manual && (
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                  수동: {claim.snapshot.carryover.manual.note} ({formatAmountShort(claim.snapshot.carryover.manual.amount)}<span className="amount-unit">원</span>)
                </div>
              )}
            </div>
          )}

          {/* 거절 사유 */}
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
                  <div className="timeline__label">💰 지급</div>
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

        {/* 액션 */}
        {canReceive && (
          <div className="modal-footer modal-footer--end">
            <button
              onClick={handleReceive}
              disabled={receiveAction.loading}
              className="btn btn--success btn--lg"
            >
              {receiveAction.loading ? (
                <><span className="spinner spinner--sm spinner--on-primary" /> 처리 중...</>
              ) : "📥 받았어요!"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
