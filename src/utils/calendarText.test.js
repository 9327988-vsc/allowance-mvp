// src/utils/calendarText.test.js
import { describe, it, expect, vi } from "vitest";

vi.mock("./calculator", () => ({
  getWeekdayKor: vi.fn((wd) => ["일", "월", "화", "수", "목", "금", "토"][wd] || "?"),
}));

import { generateCalendarText } from "./calendarText";

describe("generateCalendarText", () => {
  it("calc가 null이면 빈 문자열 반환", () => {
    expect(generateCalendarText(2026, 5, null, {}, {})).toBe("");
  });

  it("calc가 undefined이면 빈 문자열 반환", () => {
    expect(generateCalendarText(2026, 5, undefined, {}, {})).toBe("");
  });

  it("아이 이름 있으면 헤더에 포함", () => {
    const calc = {
      cells: [],
      base_allowance: 0,
      school_total: 0,
      academy_total: 0,
      extra_items_total: 0,
      total: 0,
    };
    const result = generateCalendarText(2026, 5, calc, { child_name: "꼬마" }, {});
    expect(result).toContain("꼬마 2026년 5월 캘린더");
  });

  it("아이 이름 없으면 기본 헤더", () => {
    const calc = {
      cells: [],
      base_allowance: 0,
      school_total: 0,
      academy_total: 0,
      extra_items_total: 0,
      total: 0,
    };
    const result = generateCalendarText(2026, 5, calc, {}, {});
    expect(result).toContain("2026년 5월 캘린더");
    expect(result).not.toContain("undefined");
  });

  it("공휴일 셀 표시", () => {
    const calc = {
      cells: [
        {
          date: "2026-05-05",
          weekday: 2,
          is_holiday: true,
          holiday_name: "어린이날",
          school_fee: 0,
          academy_fee: 0,
          extra_items: [],
        },
      ],
      base_allowance: 0,
      school_total: 0,
      academy_total: 0,
      extra_items_total: 0,
      total: 0,
    };
    const result = generateCalendarText(2026, 5, calc, {}, {});
    expect(result).toContain("어린이날");
  });

  it("학교비/학원비/기타 항목 표시", () => {
    const calc = {
      cells: [
        {
          date: "2026-05-01",
          weekday: 5,
          is_holiday: false,
          school_fee: 3000,
          academy_fee: 5000,
          extra_items: [{ name: "교통비", amount: 1500 }],
        },
      ],
      base_allowance: 10000,
      school_total: 3000,
      academy_total: 5000,
      extra_items_total: 1500,
      total: 19500,
    };
    const result = generateCalendarText(2026, 5, calc, {}, {});
    expect(result).toContain("3,000원");
    expect(result).toContain("5,000원");
    expect(result).toContain("교통비");
    expect(result).toContain("1,500원");
    expect(result).toContain("19,500원");
  });

  it("아무 항목 없는 셀은 건너뜀", () => {
    const calc = {
      cells: [
        {
          date: "2026-05-02",
          weekday: 6,
          is_holiday: false,
          school_fee: 0,
          academy_fee: 0,
          extra_items: [],
        },
      ],
      base_allowance: 0,
      school_total: 0,
      academy_total: 0,
      extra_items_total: 0,
      total: 0,
    };
    const result = generateCalendarText(2026, 5, calc, {}, {});
    // 날짜 라인이 출력되지 않아야 함
    expect(result).not.toContain("2일");
  });

  it("하단 요약에 기본 용돈 포함", () => {
    const calc = {
      cells: [],
      base_allowance: 50000,
      school_total: 0,
      academy_total: 0,
      extra_items_total: 0,
      recurring_extras_total: 10000,
      total: 60000,
    };
    const result = generateCalendarText(2026, 5, calc, {}, {});
    expect(result).toContain("50,000원");
    expect(result).toContain("정기");
    expect(result).toContain("60,000원");
  });

  it("child_name이 공백만이면 기본 헤더", () => {
    const calc = {
      cells: [],
      base_allowance: 0,
      school_total: 0,
      academy_total: 0,
      extra_items_total: 0,
      total: 0,
    };
    const result = generateCalendarText(2026, 5, calc, { child_name: "   " }, {});
    expect(result).not.toContain("   2026년");
    expect(result).toContain("2026년 5월 캘린더");
  });
});
