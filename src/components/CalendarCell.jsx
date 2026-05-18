// src/components/CalendarCell.jsx — 캘린더 개별 셀
import { memo, useCallback } from "react";
import { formatAmount, formatAmountShort } from "../utils/formatAmount";
import { getMoodEmoji } from "../constants/moods";

// 인라인 스타일 상수 (렌더마다 재생성 방지)
const SKIP_STYLE = { opacity: 0.6, fontSize: "0.7em" };

export default memo(function CalendarCell({ cell, onClick, isToday, mode = "child", onMouseEnter, onMouseLeave, onTouchStart, onTouchEnd }) {
  if (!cell) {
    // placeholder 셀 (이전/다음 달)
    return <div className="calendar-cell placeholder" aria-hidden="true" />;
  }

  const { date, weekday, is_holiday, holiday_name, school_fee, academy_fee, extra_items, skip_school, skip_academy } = cell;
  const day = parseInt(date.split("-")[2], 10);

  // 날짜 색상
  let dateColor = "var(--color-text-primary)";
  if (is_holiday || weekday === "sun") dateColor = "var(--color-holiday)";
  else if (weekday === "sat") dateColor = "var(--color-saturday)";

  const hasExtra = extra_items && extra_items.length > 0;
  const isGeneral = mode === "general";

  // 일반계정: income/expense 분리 표시
  const income = cell.income || 0;
  const expense = cell.expense || 0;

  // 자녀계정: 기존 로직
  const cellTotal = cell.total || 0;
  const hasData = isGeneral
    ? (income > 0 || expense > 0 || hasExtra || cell.memo)
    : (school_fee > 0 || academy_fee > 0 || hasExtra);

  const ariaLabel = isGeneral
    ? `${date}${holiday_name ? ` ${holiday_name}` : ""}${income > 0 ? ` 수입 ${formatAmount(income)}` : ""}${expense > 0 ? ` 지출 ${formatAmount(expense)}` : ""}`
    : `${date}${holiday_name ? ` ${holiday_name}` : ""}${cellTotal > 0 ? ` ${formatAmount(cellTotal)}` : ""}`;

  const handleClick = useCallback(() => onClick && onClick(cell), [onClick, cell]);
  const handleMouseEnter = useCallback((e) => onMouseEnter && onMouseEnter(cell, e), [onMouseEnter, cell]);
  const handleTouchStart = useCallback((e) => onTouchStart && onTouchStart(cell, e), [onTouchStart, cell]);

  return (
    <button
      className={`calendar-cell${isToday ? " calendar-cell--today" : ""}${hasData ? " calendar-cell--has-data" : ""}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label={ariaLabel}
    >
      {/* 날짜 + 기분 */}
      <span className="calendar-cell__date" style={{ color: dateColor }}>
        {day}
        {cell.mood && <span className="calendar-cell__mood">{getMoodEmoji(cell.mood)}</span>}
      </span>

      {/* 공휴일명 */}
      {holiday_name && (
        <span className="calendar-cell__holiday">{holiday_name}</span>
      )}

      {isGeneral ? (
        <>
          {/* 일반계정: 수입/지출 금액 */}
          <div className="calendar-cell__general-amounts">
            {income > 0 && (
              <span className="calendar-cell__income">+{formatAmountShort(income)}</span>
            )}
            {expense > 0 && (
              <span className="calendar-cell__expense">-{formatAmountShort(expense)}</span>
            )}
          </div>

          {/* 데이터 dot */}
          {hasData && (
            <div className="calendar-cell__dots">
              {income > 0 && <span className="calendar-cell__dot calendar-cell__dot--income" />}
              {expense > 0 && <span className="calendar-cell__dot calendar-cell__dot--expense" />}
              {cell.memo && <span className="calendar-cell__dot calendar-cell__dot--memo" />}
            </div>
          )}
        </>
      ) : (
        <>
          {/* 자녀계정: 아이콘 표시 */}
          <div className="calendar-cell__icons">
            {school_fee > 0 && <span title="학교 등교">🏫</span>}
            {skip_school === "full" && <span title="학교 결석" style={SKIP_STYLE}>🚫</span>}
            {skip_school === "half" && <span title="학교 편도" style={SKIP_STYLE}>½</span>}
            {academy_fee > 0 && <span title="학원 등원">✏️</span>}
            {skip_academy === "full" && <span title="학원 결석" style={SKIP_STYLE}>🚫</span>}
            {skip_academy === "half" && <span title="학원 편도" style={SKIP_STYLE}>½</span>}
            {hasExtra && <span title="임시 항목">🎒</span>}
          </div>

          {/* 합계 금액 */}
          {cellTotal > 0 && (
            <span className="calendar-cell__amount">
              {formatAmountShort(cellTotal)}
            </span>
          )}

          {/* 데이터 유무 점(dot) */}
          {(school_fee > 0 || academy_fee > 0 || hasExtra || cell.memo) && (
            <div className="calendar-cell__dots">
              {school_fee > 0 && <span className="calendar-cell__dot calendar-cell__dot--school" />}
              {academy_fee > 0 && <span className="calendar-cell__dot calendar-cell__dot--academy" />}
              {hasExtra && <span className="calendar-cell__dot calendar-cell__dot--extra" />}
              {cell.memo && <span className="calendar-cell__dot calendar-cell__dot--memo" />}
            </div>
          )}
        </>
      )}
    </button>
  );
});
