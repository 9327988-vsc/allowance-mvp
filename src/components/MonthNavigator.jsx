// src/components/MonthNavigator.jsx — S-001 헤더 월 이동
export default function MonthNavigator({
  year, month, nextDisabled,
  onPrev, onNext, onMonthClick,
}) {
  return (
    <div className="flex items-center justify-between" style={{ height: 64, padding: "0 var(--space-2)" }}>
      <button
        onClick={onPrev}
        aria-label="이전 달"
        className="header-btn"
      >
        ◀
      </button>

      <button
        onClick={onMonthClick}
        className="month-nav__title"
        aria-label={`${year}년 ${month}월, 클릭하여 월 선택`}
      >
        <span className="month-nav__year">{year}년</span>
        <span className="month-nav__month">{month}월</span>
      </button>


      <button
        onClick={onNext}
        disabled={nextDisabled}
        aria-label="다음 달"
        className={`header-btn${nextDisabled ? " header-btn--disabled" : ""}`}
      >
        ▶
      </button>
    </div>
  );
}
