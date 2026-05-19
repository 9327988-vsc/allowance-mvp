import { formatAmountShort } from "../../utils/formatAmount";
import { getCategoryIcon } from "../../constants/categories";

const WEEKDAY_KOR = { sun: "일", mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토" };

export default function CellDetailPopup({ cell, customCategories, onClose }) {
  if (!cell) return null;
  const day = parseInt(cell.date.split("-")[2], 10);
  const weekdayKor = WEEKDAY_KOR[cell.weekday] || "";
  const hasExtra = cell.extra_items && cell.extra_items.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${day}일 (${weekdayKor}) 상세 정보`}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      style={{
        position: "fixed", inset: 0, zIndex: "var(--z-modal-1, 200)",
        background: "rgba(15,23,42,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--space-4)",
        animation: "backdrop-fade 0.15s ease-out",
      }}
    >
      <div
        style={{
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-xl)",
          padding: 0,
          maxWidth: 340,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "modal-enter 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          padding: "var(--space-3) var(--space-4)",
          background: "linear-gradient(135deg, var(--gradient-primary-start) 0%, var(--gradient-primary-end) 100%)",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontWeight: 700, fontSize: "var(--font-size-base)" }}>
            {day}일 ({weekdayKor})
            {cell.is_holiday && cell.holiday_name && (
              <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.8, marginLeft: 6 }}>{cell.holiday_name}</span>
            )}
          </span>
          <button
            onClick={onClose}
            className="cell-popup-close"
          >
            ×
          </button>
        </div>

        <div style={{ padding: "var(--space-4)" }}>
          {/* 등교/학원 */}
          {cell.school_fee > 0 && (
            <div className="detail-row">
              <span className="detail-row__label">🏫 학교 버스</span>
              <span className="detail-row__amount">{formatAmountShort(cell.school_fee)}<span className="amount-unit">원</span></span>
            </div>
          )}
          {cell.academy_fee > 0 && (
            <div className="detail-row">
              <span className="detail-row__label">✏️ 학원 버스</span>
              <span className="detail-row__amount">{formatAmountShort(cell.academy_fee)}<span className="amount-unit">원</span></span>
            </div>
          )}

          {/* 임시 항목 */}
          {hasExtra && cell.extra_items.map((item, idx) => (
            <div key={idx} className="detail-row">
              <span className="detail-row__label">
                {getCategoryIcon(item.category, customCategories)} {item.category}
              </span>
              <span className="detail-row__amount">{formatAmountShort(item.amount)}<span className="amount-unit">원</span></span>
            </div>
          ))}

          {/* 메모 */}
          {cell.memo && (
            <div style={{
              marginTop: "var(--space-2)",
              padding: "var(--space-2) var(--space-3)",
              background: "var(--color-bg-secondary)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-secondary)",
            }}>
              📝 {cell.memo}
            </div>
          )}

          {/* 빈 상태 */}
          {!cell.school_fee && !cell.academy_fee && !hasExtra && (
            <div style={{
              textAlign: "center",
              padding: "var(--space-4)",
              color: "var(--color-text-tertiary)",
              fontSize: "var(--font-size-sm)",
            }}>
              {cell.is_holiday ? "🎉 공휴일 — 데이터 없음" : "데이터 없음"}
            </div>
          )}

          {/* 합계 */}
          {cell.total > 0 && (
            <div style={{
              borderTop: "2px solid var(--color-primary)",
              marginTop: "var(--space-3)",
              paddingTop: "var(--space-3)",
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              color: "var(--color-primary)",
            }}>
              <span>합계</span>
              <span>{formatAmountShort(cell.total)}<span className="amount-unit" style={{ color: "var(--color-primary)" }}>원</span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
