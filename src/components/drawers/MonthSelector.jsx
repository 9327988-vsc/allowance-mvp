// src/components/drawers/MonthSelector.jsx — S-202 월 선택
import { useState } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { isAtFutureLimit } from "../../utils/dateLimit";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";

export default function MonthSelector({ currentYear, currentMonth, todayY, todayM, onSelect, onClose }) {
  const contentRef = useModalBase(onClose);
  const swipeHandlers = useSwipeToClose(onClose);
  const [displayYear, setDisplayYear] = useState(currentYear);

  // 연도 이동 시 모든 월이 비활성이면 ▶ 비활성
  const allDisabledInYear = Array.from({ length: 12 }, (_, i) => isAtFutureLimit(displayYear + 1, i + 1))
    .every(Boolean);

  function handleMonthClick(month) {
    if (isAtFutureLimit(displayYear, month)) return;
    onSelect(displayYear, month);
    onClose();
  }

  // 모바일: 바텀시트 / 데스크톱: 팝오버 (여기서는 공용 모달로 구현)
  return (
    <div
      className="month-selector-backdrop"
    >
      <div
        ref={contentRef}
        className="month-selector"
        role="dialog"
        aria-label="월 선택"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        {...swipeHandlers}
      >
        {/* 드래그 핸들 (모바일) */}
        <div className="month-selector__handle" />

        {/* 연도 탭 */}
        <div className="flex items-center justify-between mb-4" style={{ height: 44 }}>
          <button
            onClick={() => setDisplayYear(y => y - 1)}
            aria-label="이전 연도"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:opacity-80"
          >
            ◀
          </button>
          <span className="text-lg font-bold">{displayYear}년</span>
          <button
            onClick={() => !allDisabledInYear && setDisplayYear(y => y + 1)}
            disabled={allDisabledInYear}
            aria-label="다음 연도"
            className={`w-11 h-11 flex items-center justify-center rounded-full
              ${allDisabledInYear ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"}`}
          >
            ▶
          </button>
        </div>

        {/* 4×3 월 그리드 */}
        <div
          className="month-selector__grid"
          role="grid"
          aria-label={`${displayYear}년 월 선택`}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const disabled = isAtFutureLimit(displayYear, month);
            const isCurrent = displayYear === currentYear && month === currentMonth;
            const isToday = displayYear === todayY && month === todayM;

            return (
              <button
                key={month}
                role="gridcell"
                aria-label={`${month}월`}
                aria-current={isCurrent ? "true" : undefined}
                aria-disabled={disabled ? "true" : undefined}
                disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleMonthClick(month)}
                className="month-selector__cell"
                style={{
                  background: isCurrent ? "var(--color-primary)" : disabled ? "var(--color-bg-secondary)" : "var(--color-bg)",
                  color: isCurrent ? "white" : disabled ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
                  fontWeight: isCurrent ? "var(--font-weight-bold)" : "normal",
                  opacity: disabled ? 0.4 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                  position: "relative",
                }}
              >
                {month}월
                {isToday && (
                  <span
                    style={{
                      position: "absolute", bottom: 4, right: 6,
                      width: 6, height: 6, borderRadius: "50%",
                      background: isCurrent ? "white" : "var(--color-primary)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
