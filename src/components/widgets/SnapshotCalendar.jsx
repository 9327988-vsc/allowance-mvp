import { useState, useMemo } from "react";
import { formatAmountShort } from "../../utils/formatAmount";
import CellDetailPopup from "./CellDetailPopup";

const DAY_HEADERS_SUN = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_HEADERS_MON = ["월", "화", "수", "목", "금", "토", "일"];

export default function SnapshotCalendar({ year, month, cells, customCategories, startDay = 0 }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const rawFirstDay = new Date(year, month - 1, 1).getDay();
  const firstDay = (rawFirstDay - startDay + 7) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const DAY_HEADERS = startDay === 1 ? DAY_HEADERS_MON : DAY_HEADERS_SUN;
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  // date 문자열 → cell 매핑
  const cellMap = useMemo(() => {
    const map = {};
    if (cells) {
      cells.forEach((c) => { map[c.date] = c; });
    }
    return map;
  }, [cells]);

  function formatDate(d) {
    return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // 그리드 빈칸 + 날짜
  const gridItems = [];
  for (let i = 0; i < firstDay; i++) gridItems.push(null);
  for (let d = 1; d <= daysInMonth; d++) gridItems.push(d);
  while (gridItems.length % 7 !== 0) gridItems.push(null);

  return (
    <>
      <div className="snapshot-calendar">
        {/* 요일 헤더 */}
        <div className="snapshot-calendar__header">
          {DAY_HEADERS.map((label, i) => (
            <div key={label} className="snapshot-calendar__weekday" style={{
              color: (startDay === 1 ? i === 6 : i === 0) ? "var(--color-holiday)" : (startDay === 1 ? i === 5 : i === 6) ? "var(--color-saturday)" : undefined,
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="snapshot-calendar__body">
          {gridItems.map((day, i) => {
            if (day === null) {
              return <div key={`blank-${i}`} className="snapshot-calendar__cell snapshot-calendar__cell--empty" />;
            }

            const dateStr = formatDate(day);
            const cell = cellMap[dateStr];
            const isToday = isCurrentMonth && day === today.getDate();
            const hasSchool = cell?.school_fee > 0;
            const hasAcademy = cell?.academy_fee > 0;
            const hasExtra = cell?.extra_items?.length > 0;
            const hasData = hasSchool || hasAcademy || hasExtra;
            const cellTotal = cell?.total || 0;
            const gridCol = (firstDay + day - 1) % 7;
            const actualDow = (gridCol + startDay) % 7; // 0=일
            const isHoliday = cell?.is_holiday || actualDow === 0;
            const isSaturday = actualDow === 6;

            return (
              <button
                key={day}
                className={`snapshot-calendar__cell${isToday ? " snapshot-calendar__cell--today" : ""}${hasData ? " snapshot-calendar__cell--has-data" : ""}`}
                onClick={() => cell && setSelectedCell(cell)}
                disabled={!cell}
              >
                <span className="snapshot-calendar__date" style={{
                  color: isHoliday ? "var(--color-holiday)" : isSaturday ? "var(--color-saturday)" : undefined,
                }}>
                  {day}
                </span>
                {hasData && (
                  <div className="snapshot-calendar__icons">
                    {hasSchool && <span>🏫</span>}
                    {hasAcademy && <span>✏️</span>}
                    {hasExtra && <span>🎒</span>}
                  </div>
                )}
                {cellTotal > 0 && (
                  <span className="snapshot-calendar__amount">
                    {formatAmountShort(cellTotal)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="snapshot-calendar__legend">
          <span><span className="snapshot-calendar__legend-dot" style={{ background: "var(--color-school)" }} />학교</span>
          <span><span className="snapshot-calendar__legend-dot" style={{ background: "var(--color-academy)" }} />학원</span>
          <span><span className="snapshot-calendar__legend-dot" style={{ background: "var(--color-extra)" }} />추가</span>
        </div>
      </div>

      {/* 셀 상세 팝업 */}
      {selectedCell && (
        <CellDetailPopup
          cell={selectedCell}
          customCategories={customCategories}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </>
  );
}
