// src/components/MonthNavigator.jsx — S-001 헤더 월 이동
export default function MonthNavigator({
  year, month, nextDisabled,
  onPrev, onNext, onMonthClick,
}) {
  return (
    <div className="flex items-center justify-between" style={{ height: 56 }}>
      <button
        onClick={onPrev}
        aria-label="이전 달"
        className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 text-lg"
      >
        ◀
      </button>

      <button
        onClick={onMonthClick}
        className="text-lg font-bold hover:underline"
        aria-label={`${year}년 ${month}월, 클릭하여 월 선택`}
      >
        {year}년 {month}월
      </button>

      <button
        onClick={onNext}
        disabled={nextDisabled}
        aria-label="다음 달"
        className={`w-11 h-11 flex items-center justify-center rounded-full text-lg
          ${nextDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"}`}
      >
        ▶
      </button>
    </div>
  );
}
