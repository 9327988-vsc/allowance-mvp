// src/components/widgets/ClaimCard.jsx — 청구 카드 (부모/자녀 공용)
import StatusBadge from "./StatusBadge";
import { formatAmountShort } from "../../utils/formatAmount";


/**
 * @param {{
 *   claim: { claim_id, year, month, is_extra, status, total, submitted_at, child_member_id, comment_count },
 *   childName?: string,
 *   onClick: (claim) => void,
 *   onQuickApprove?: (claim) => void,
 *   onQuickReject?: (claim) => void,
 *   onQuickUndoReject?: (claim) => void,
 *   onReceiveGrant?: (claim) => void,
 *   quickLoading?: boolean,
 *   style?: object
 * }} props
 */
export default function ClaimCard({ claim, childName, onClick, onQuickApprove, onQuickReject, onQuickUndoReject, onReceiveGrant, quickLoading, style }) {
  const isGrant = claim.type === "grant";
  const rawDate = isGrant ? (claim.granted_at || claim.updated_at) : claim.submitted_at;
  const dateStr = rawDate ? new Date(rawDate).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  }) : "";

  const showQuickActions = claim.status === "pending" && (onQuickApprove || onQuickReject);
  const showUndoAction = claim.status === "rejected" && onQuickUndoReject;
  const showReceiveGrant = isGrant && claim.status === "granted" && onReceiveGrant;

  return (
    <div
      className={`claim-card fade-in claim-card--${claim.status}`}
      style={style}
    >
      <button
        className="claim-card__body"
        onClick={() => onClick(claim)}
        aria-label={isGrant ? `추가 보너스: ${claim.name}` : `${claim.year}년 ${claim.month}월 ${claim.is_extra ? "추가" : "정기"} 청구`}
      >
        <div className="claim-card__header">
          <div>
            <span className="claim-card__title">
              {isGrant ? `💝 추가 보너스` : `${claim.month}월 ${claim.is_extra ? "추가" : "정기"} 청구`}
            </span>
            {isGrant && claim.name && (
              <span className="claim-card__child">{claim.name}</span>
            )}
            {!isGrant && childName && (
              <span className="claim-card__child">{childName}</span>
            )}
          </div>
          <StatusBadge status={claim.status} />
        </div>

        <div className="claim-card__footer">
          <span className="claim-card__date">{dateStr} {isGrant ? "지급" : "제출"}</span>
          <span className="claim-card__amount">
            {formatAmountShort(isGrant ? claim.amount : (claim.total || 0))}<span className="amount-unit">원</span>
          </span>
        </div>

        {isGrant && claim.reason && (
          <div className="claim-card__comments">
            💬 {claim.reason}
          </div>
        )}

        {!isGrant && (claim.comment_count || 0) > 0 && (
          <div className="claim-card__comments">
            💬 댓글 {claim.comment_count}개
          </div>
        )}
      </button>

      {showQuickActions && (
        <div className="claim-card__quick-actions">
          {onQuickReject && (
            <button
              className="quick-action-btn quick-action-btn--reject"
              onClick={(e) => { e.stopPropagation(); onQuickReject(claim); }}
              disabled={quickLoading}
              aria-label="거절"
            >
              ❌ 거절
            </button>
          )}
          {onQuickApprove && (
            <button
              className="quick-action-btn quick-action-btn--approve"
              onClick={(e) => { e.stopPropagation(); onQuickApprove(claim); }}
              disabled={quickLoading}
              aria-label="승인"
            >
              ✅ 승인
            </button>
          )}
        </div>
      )}

      {showUndoAction && (
        <div className="claim-card__quick-actions">
          <button
            className="quick-action-btn quick-action-btn--undo"
            onClick={(e) => { e.stopPropagation(); onQuickUndoReject(claim); }}
            disabled={quickLoading}
            aria-label="거절 취소"
          >
            ↩️ 거절 취소
          </button>
        </div>
      )}

      {showReceiveGrant && (
        <div className="claim-card__quick-actions">
          <button
            className="quick-action-btn quick-action-btn--approve"
            onClick={(e) => { e.stopPropagation(); onReceiveGrant(claim); }}
            disabled={quickLoading}
            aria-label="수령 확인"
          >
            💝 받았어요
          </button>
        </div>
      )}
    </div>
  );
}
