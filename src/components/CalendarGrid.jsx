// src/components/CalendarGrid.jsx — 월간 달력 그리드
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import CalendarCell from "./CalendarCell";
import CellTooltip from "./widgets/CellTooltip";
import { formatDate } from "../utils/calculator";

const WEEKDAY_LABELS_SUN = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAY_LABELS_MON = ["월", "화", "수", "목", "금", "토", "일"];
const WEEKDAY_COLORS_SUN = [
  "var(--color-holiday)", null, null, null, null, null, "var(--color-saturday)"
];
const WEEKDAY_COLORS_MON = [
  null, null, null, null, null, "var(--color-saturday)", "var(--color-holiday)"
];

export default function CalendarGrid({ year, month, calc, todayY, todayM, onCellClick, settings, startDay = 0, mode = "child" }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const rawFirstDay = new Date(year, month - 1, 1).getDay(); // 0=일
  const firstDayOfWeek = (rawFirstDay - startDay + 7) % 7;
  const WEEKDAY_LABELS = startDay === 1 ? WEEKDAY_LABELS_MON : WEEKDAY_LABELS_SUN;
  const WEEKDAY_COLORS = startDay === 1 ? WEEKDAY_COLORS_MON : WEEKDAY_COLORS_SUN;

  // calc.cells를 date 기반 맵으로 변환
  const cellMap = useMemo(() => {
    const map = {};
    if (calc?.cells) {
      for (const c of calc.cells) {
        map[c.date] = c;
      }
    }
    return map;
  }, [calc]);

  const todayStr = formatDate(todayY, todayM, new Date().getDate());

  // S-402 툴팁 상태
  const [tooltipCell, setTooltipCell] = useState(null);
  const [tooltipRect, setTooltipRect] = useState(null);
  const hoverTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const tooltipDismissRef = useRef(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (tooltipDismissRef.current) clearTimeout(tooltipDismissRef.current);
    };
  }, []);

  const showTooltip = useCallback((cell, rect) => {
    setTooltipCell(cell);
    setTooltipRect(rect);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipCell(null);
    setTooltipRect(null);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);

  const handleCellMouseEnter = useCallback((cell, e) => {
    const rect = e.currentTarget.getBoundingClientRect(); // capture immediately before timeout
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      showTooltip(cell, rect);
    }, 200);
  }, [showTooltip]);

  const handleCellMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  const handleCellTouchStart = useCallback((cell, e) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    longPressTimerRef.current = setTimeout(() => {
      showTooltip(cell, rect);
    }, 500);
  }, [showTooltip]);

  const handleCellTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (tooltipDismissRef.current) clearTimeout(tooltipDismissRef.current);
    // 툴팁은 잠시 후 숨기기 (탭으로 셀 클릭 시 자연스럽게)
    tooltipDismissRef.current = setTimeout(hideTooltip, 1500);
  }, [hideTooltip]);

  // 그리드 생성: placeholder + 실제 날짜 (메모이제이션으로 CalendarCell memo 유효화)
  const gridCells = useMemo(() => {
    const cells = [];
    // 첫 주 앞 빈 셀
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    // 실제 날짜 셀
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(year, month, day);
      cells.push(cellMap[date] || null);
    }
    // 마지막 주 뒤 빈 셀
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [firstDayOfWeek, daysInMonth, year, month, cellMap]);

  return (
    <div className="calendar-grid" role="grid" aria-label={`${year}년 ${month}월 캘린더`}>
      {/* 요일 헤더 */}
      <div className="calendar-grid__header" role="row">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className="calendar-grid__weekday"
            role="columnheader"
            style={WEEKDAY_COLORS[i] ? { color: WEEKDAY_COLORS[i] } : undefined}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div className="calendar-grid__body">
        {gridCells.map((cell, i) => {
          if (!cell) {
            return <CalendarCell key={`empty-${i}`} cell={null} />;
          }
          const isToday = cell.date === todayStr;
          return (
            <CalendarCell
              key={cell.date}
              cell={cell}
              isToday={isToday}
              mode={mode}
              onClick={onCellClick}
              onMouseEnter={handleCellMouseEnter}
              onMouseLeave={handleCellMouseLeave}
              onTouchStart={handleCellTouchStart}
              onTouchEnd={handleCellTouchEnd}
            />
          );
        })}
      </div>

      {/* S-402 툴팁 */}
      {tooltipCell && tooltipRect && (
        <CellTooltip cell={tooltipCell} anchorRect={tooltipRect} settings={settings} />
      )}
    </div>
  );
}
