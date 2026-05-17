// src/utils/generalCalculator.js — 일반계정 월간 수입/지출 계산

/**
 * 일반계정 월간 계산
 * @param {number} year
 * @param {number} month
 * @param {{ cells: Object }} calendar — loadCalendarMonth 결과
 * @param {Object} holidays — { "YYYY-MM-DD": "공휴일명" }
 * @returns {{ totalIncome, totalExpense, balance, days, categoryBreakdown }}
 */
export function calculateGeneralMonthly(year, month, calendar, holidays = {}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekdayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryBreakdown = new Map(); // category → { income, expense }
  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const dateKey = `${year}-${mm}-${dd}`;
    const dateObj = new Date(year, month - 1, d);
    const weekday = weekdayNames[dateObj.getDay()];
    const holidayInfo = holidays[dateKey];
    const holidayName = holidayInfo?.name ?? null;
    // 일요일만 공휴일 취급 (토요일은 평일로 처리 — 일반 계정 정책)
    const isHoliday = !!holidayInfo || weekday === "sun";

    const cell = calendar?.cells?.[dateKey];
    const items = cell?.extra_items || [];
    const memo = cell?.memo || "";

    let dayIncome = 0;
    let dayExpense = 0;

    for (const item of items) {
      const amount = Math.abs(item.amount || 0);
      if (item.type === "income") {
        dayIncome += amount;
        totalIncome += amount;
      } else {
        // type이 없거나 "expense"면 지출
        dayExpense += amount;
        totalExpense += amount;
      }

      // 카테고리별 집계
      if (item.category && amount > 0) {
        const existing = categoryBreakdown.get(item.category) || { income: 0, expense: 0 };
        if (item.type === "income") {
          existing.income += amount;
        } else {
          existing.expense += amount;
        }
        categoryBreakdown.set(item.category, existing);
      }
    }

    days.push({
      date: dateKey,
      day: d,
      weekday,
      is_holiday: isHoliday,
      holiday_name: holidayName,
      income: dayIncome,
      expense: dayExpense,
      total: dayIncome - dayExpense,
      items,
      memo,
      extra_items: items,
    });
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    days,
    cells: days, // CalendarGrid 호환용
    categoryBreakdown,
  };
}
