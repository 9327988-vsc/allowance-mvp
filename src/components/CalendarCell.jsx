// src/components/CalendarCell.jsx — 캘린더 개별 셀
import { getCategoryIcon } from "../constants/categories";

export default function CalendarCell({ cell, onClick, isToday, onMouseEnter, onMouseLeave, onTouchStart, onTouchEnd }) {
  if (!cell) {
    // placeholder 셀 (이전/다음 달)
    return <div className="calendar-cell placeholder" aria-hidden="true" />;
  }

  const { date, weekday, is_holiday, holiday_name, school_fee, academy_fee, extra_items } = cell;
  const day = parseInt(date.split("-")[2], 10);

  // 날짜 색상
  let dateColor = "var(--color-text-primary)";
  if (is_holiday || weekday === "sun") dateColor = "var(--color-holiday)";
  else if (weekday === "sat") dateColor = "var(--color-saturday)";

  const hasExtra = extra_items && extra_items.length > 0;
  const cellTotal = cell.total || 0;

  return (
    <button
      className={`calendar-cell${isToday ? " calendar-cell--today" : ""}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label={`${date}${holiday_name ? ` ${holiday_name}` : ""}${cellTotal > 0 ? ` ${cellTotal.toLocaleString()}원` : ""}`}
    >
      {/* 날짜 */}
      <span className="calendar-cell__date" style={{ color: dateColor }}>
        {day}
      </span>

      {/* 공휴일명 */}
      {holiday_name && (
        <span className="calendar-cell__holiday">{holiday_name}</span>
      )}

      {/* 아이콘 표시 */}
      <div className="calendar-cell__icons">
        {school_fee > 0 && <span title="학교 등교">🏫</span>}
        {academy_fee > 0 && <span title="학원 등원">📚</span>}
        {hasExtra && <span title="임시 항목">🎒</span>}
      </div>

      {/* 합계 금액 */}
      {cellTotal > 0 && (
        <span className="calendar-cell__amount">
          {cellTotal.toLocaleString()}
        </span>
      )}
    </button>
  );
}
