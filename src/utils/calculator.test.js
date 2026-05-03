// src/utils/calculator.test.js
import { describe, it, expect } from "vitest";
import { calculateMonthlyAllowance, getWeekday, validateCalculation } from "./calculator";

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
