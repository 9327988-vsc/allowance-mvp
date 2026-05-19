// src/utils/calculator.test.js
import { describe, it, expect } from "vitest";
import { calculateMonthlyAllowance, formatDate, getWeekday, getWeekdayKor, validateCalculation } from "./calculator";

const TEST_SETTINGS = {
  child_name: "자녀A",
  school: { days: ["mon", "tue", "wed", "thu", "fri"], fare: 1160, round_trip: true, holiday_attend: false },
  academy: { days: ["wed", "fri"], fare: 1160, round_trip: true, holiday_attend: true },
  base_allowance: 80000,
  created_at: "2026-04-01T00:00:00.000Z",
  updated_at: "2026-04-01T00:00:00.000Z",
  version: 1
};

const TEST_HOLIDAYS_2026_05 = {
  "2026-05-01": { name: "노동절", type: "legal" },
  "2026-05-05": { name: "어린이날", type: "legal" },
  "2026-05-24": { name: "부처님오신날", type: "legal" },
  "2026-05-25": { name: "부처님오신날 대체공휴일", type: "alternative" }
};

describe("calculateMonthlyAllowance", () => {
  it("기본 케이스: 2026년 5월 (Hex 자녀A 기준)", () => {
    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, { cells: {} }, TEST_HOLIDAYS_2026_05);
    expect(calc.school_days_count).toBe(18);
    expect(calc.school_total).toBe(1160 * 2 * 18);
    expect(calc.academy_days_count).toBe(9);
    expect(calc.academy_total).toBe(1160 * 2 * 9);
    expect(calc.base_allowance).toBe(80000);
    expect(calc.extra_items_total).toBe(0);
    expect(calc.total).toBe(80000 + 41760 + 20880);
  });

  it("임시 항목이 있는 케이스", () => {
    const calendar = {
      year: 2026, month: 5,
      cells: {
        "2026-05-14": {
          extra_items: [{ id: "ex_001", category: "체험학습", name: "박물관", amount: 8000, created_at: "2026-05-10T00:00:00.000Z" }],
          memo: "박물관 단체 관람"
        }
      },
      created_at: "2026-05-01T00:00:00.000Z",
      updated_at: "2026-05-10T00:00:00.000Z",
      version: 1
    };

    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, calendar, TEST_HOLIDAYS_2026_05);
    expect(calc.extra_items_total).toBe(8000);
    expect(calc.total).toBe(142640 + 8000);
  });

  it("학원 없는 가정", () => {
    const settings = { ...TEST_SETTINGS, academy: { days: [], fare: 0, round_trip: true, holiday_attend: false } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, TEST_HOLIDAYS_2026_05);
    expect(calc.academy_total).toBe(0);
    expect(calc.academy_days_count).toBe(0);
    expect(calc.total).toBe(80000 + 41760);
  });

  it("공휴일 등교 설정", () => {
    const settings = { ...TEST_SETTINGS, school: { ...TEST_SETTINGS.school, holiday_attend: true } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, TEST_HOLIDAYS_2026_05);
    expect(calc.school_days_count).toBe(21);
  });

  it("편도 설정", () => {
    const settings = { ...TEST_SETTINGS, school: { ...TEST_SETTINGS.school, round_trip: false } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, TEST_HOLIDAYS_2026_05);
    expect(calc.school_total).toBe(1160 * 1 * 18);
  });

  it("윤년 2월 29일", () => {
    const calc = calculateMonthlyAllowance(2028, 2, TEST_SETTINGS, { cells: {} }, {});
    expect(calc.cells.length).toBe(29);
  });

  it("31일 짜리 달", () => {
    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, { cells: {} }, TEST_HOLIDAYS_2026_05);
    expect(calc.cells.length).toBe(31);
  });

  it("존재하지 않는 settings → 에러", () => {
    expect(() => calculateMonthlyAllowance(2026, 5, null, { cells: {} }, {})).toThrow();
  });

  it("범위 외 month → 에러", () => {
    expect(() => calculateMonthlyAllowance(2026, 13, TEST_SETTINGS, { cells: {} }, {})).toThrow();
    expect(() => calculateMonthlyAllowance(2026, 0, TEST_SETTINGS, { cells: {} }, {})).toThrow();
  });

  it("validateCalculation 정상", () => {
    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, { cells: {} }, TEST_HOLIDAYS_2026_05);
    const v = validateCalculation(calc);
    expect(v.valid).toBe(true);
  });
});

describe("결석 처리", () => {
  it("skip_school='full' → 교통비 0, 등교일 미카운트", () => {
    const settings = { ...TEST_SETTINGS, school: { ...TEST_SETTINGS.school, days: ["mon"] }, academy: { days: [] }, base_allowance: 0 };
    // 2026-05-04 (월) 결석
    const calendar = { cells: { "2026-05-04": { skip_school: "full" } } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, calendar, {});
    // 5월 월요일: 4,11,18,25 = 4일 중 1일 결석 = 3일
    expect(calc.school_days_count).toBe(3);
  });

  it("skip_school='half' → 편도만 청구, 등교일 카운트", () => {
    const settings = { ...TEST_SETTINGS, school: { ...TEST_SETTINGS.school, days: ["mon"], fare: 1000, round_trip: true }, academy: { days: [] }, base_allowance: 0 };
    const calendar = { cells: { "2026-05-04": { skip_school: "half" } } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, calendar, {});
    // 3일 왕복(6000) + 1일 편도(1000) = 7000
    expect(calc.school_total).toBe(7000);
    expect(calc.school_days_count).toBe(4);
  });

  it("skip_academy='full' → 학원 교통비 0", () => {
    const settings = { ...TEST_SETTINGS, school: { days: [] }, academy: { ...TEST_SETTINGS.academy, days: ["fri"] }, base_allowance: 0 };
    // 2026-05-01 (금) 결석
    const calendar = { cells: { "2026-05-01": { skip_academy: "full" } } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, calendar, {});
    // 5월 금요일: 1,8,15,22,29 = 5일 중 1일 결석 = 4일
    expect(calc.academy_days_count).toBe(4);
  });
});

describe("정기 추가 용돈", () => {
  it("recurring_extras 합산", () => {
    const settings = {
      ...TEST_SETTINGS,
      school: { days: [] }, academy: { days: [] }, base_allowance: 0,
      recurring_extras: [{ name: "도서비", amount: 10000 }, { name: "간식비", amount: 5000 }],
    };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, {});
    expect(calc.recurring_extras_total).toBe(15000);
    expect(calc.total).toBe(15000);
  });

  it("recurring_extras 없으면 0", () => {
    const settings = { ...TEST_SETTINGS, school: { days: [] }, academy: { days: [] }, base_allowance: 0 };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, {});
    expect(calc.recurring_extras_total).toBe(0);
  });
});

describe("calendar/holidays null 안전성", () => {
  it("calendar null → 정상 동작", () => {
    const settings = { ...TEST_SETTINGS, base_allowance: 10000, school: { days: [] }, academy: { days: [] } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, null, null);
    expect(calc.total).toBe(10000);
  });
});

describe("formatDate", () => {
  it("YYYY-MM-DD 형식", () => {
    expect(formatDate(2026, 1, 5)).toBe("2026-01-05");
    expect(formatDate(2025, 12, 31)).toBe("2025-12-31");
  });
});

describe("getWeekday", () => {
  it("2026-05-04는 월요일", () => {
    expect(getWeekday(2026, 5, 4)).toBe("mon");
  });
  it("2026-05-01는 금요일", () => {
    expect(getWeekday(2026, 5, 1)).toBe("fri");
  });
  it("2026-05-03은 일요일", () => {
    expect(getWeekday(2026, 5, 3)).toBe("sun");
  });
});

describe("getWeekdayKor", () => {
  it("영문 → 한글 변환", () => {
    expect(getWeekdayKor("mon")).toBe("월");
    expect(getWeekdayKor("sun")).toBe("일");
    expect(getWeekdayKor("sat")).toBe("토");
  });
  it("매핑 없는 값은 그대로", () => {
    expect(getWeekdayKor("xyz")).toBe("xyz");
  });
});

describe("validateCalculation", () => {
  it("합계 불일치 감지", () => {
    const calc = {
      base_allowance: 50000, school_total: 8000, academy_total: 10000,
      extra_items_total: 3000, recurring_extras_total: 5000,
      total: 99999, school_days_count: 4, academy_days_count: 5,
    };
    const v = validateCalculation(calc);
    expect(v.valid).toBe(false);
    expect(v.errors[0]).toContain("합계 불일치");
  });

  it("등교일 31 초과 감지", () => {
    const calc = {
      base_allowance: 0, school_total: 0, academy_total: 0,
      extra_items_total: 0, recurring_extras_total: 0, total: 0,
      school_days_count: 32, academy_days_count: 0,
    };
    expect(validateCalculation(calc).valid).toBe(false);
  });

  it("음수 합계 감지", () => {
    const calc = {
      base_allowance: 0, school_total: 0, academy_total: 0,
      extra_items_total: -100, recurring_extras_total: 0, total: -100,
      school_days_count: 0, academy_days_count: 0,
    };
    expect(validateCalculation(calc).valid).toBe(false);
  });
});
