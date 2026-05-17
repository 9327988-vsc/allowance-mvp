// src/utils/calculator.js

/**
 * 한 달치 청구액 계산
 */
export function calculateMonthlyAllowance(year, month, settings, calendar, holidays) {
  if (!settings) {
    throw new Error("settings is required");
  }
  if (year < 2024 || year > 2099) {
    throw new Error(`Invalid year: ${year}`);
  }
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }

  let school_total = 0;
  let school_days_count = 0;
  let academy_total = 0;
  let academy_days_count = 0;
  let extra_items_total = 0;
  const cells = [];

  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(year, month, day);
    const weekday = getWeekday(year, month, day);
    const holidayInfo = holidays?.[date];
    const is_holiday = holidayInfo !== undefined;
    const holiday_name = holidayInfo?.name ?? null;

    // 학교
    let school_fee = 0;
    if (settings.school?.days?.includes(weekday)) {
      if (!is_holiday || settings.school.holiday_attend) {
        const multiplier = settings.school.round_trip ? 2 : 1;
        school_fee = settings.school.fare * multiplier;
        school_total += school_fee;
        school_days_count++;
      }
    }

    // 학원
    let academy_fee = 0;
    if (settings.academy?.days?.includes(weekday)) {
      if (!is_holiday || settings.academy.holiday_attend) {
        const multiplier = settings.academy.round_trip ? 2 : 1;
        academy_fee = settings.academy.fare * multiplier;
        academy_total += academy_fee;
        academy_days_count++;
      }
    }

    // 임시 항목
    const cellData = calendar?.cells?.[date];
    const extra_items = cellData?.extra_items ?? [];
    const memo = cellData?.memo ?? "";
    const cell_extra_total = extra_items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    extra_items_total += cell_extra_total;

    cells.push({
      date,
      weekday,
      is_holiday,
      holiday_name,
      school_fee,
      academy_fee,
      extra_items,
      memo,
      total: school_fee + academy_fee + cell_extra_total
    });
  }

  // 정기 추가 용돈
  const recurring_extras = settings.recurring_extras ?? [];
  const recurring_extras_total = recurring_extras.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const baseAllowance = Number(settings.base_allowance) || 0;
  const total = baseAllowance + school_total + academy_total + extra_items_total + recurring_extras_total;

  return {
    base_allowance: baseAllowance,
    recurring_extras,
    recurring_extras_total,
    school_total,
    school_days_count,
    academy_total,
    academy_days_count,
    extra_items_total,
    total,
    cells
  };
}

export function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getWeekday(year, month, day) {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date(year, month - 1, day).getDay()];
}

export function getWeekdayKor(weekday) {
  const map = { sun: "일", mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토" };
  return map[weekday] || weekday;
}

export function validateCalculation(calc) {
  const errors = [];
  if (calc.total < 0) errors.push("합계가 음수");
  if (calc.school_days_count > 31) errors.push("학교 등교일 비정상");
  if (calc.academy_days_count > 31) errors.push("학원 등원일 비정상");
  const computed = calc.base_allowance + calc.school_total + calc.academy_total + calc.extra_items_total + (calc.recurring_extras_total || 0);
  if (computed !== calc.total) errors.push(`합계 불일치: ${computed} !== ${calc.total}`);
  return { valid: errors.length === 0, errors };
}
