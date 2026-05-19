// src/utils/generalCalculator.test.js
import { describe, it, expect } from "vitest";
import { calculateGeneralMonthly } from "./generalCalculator";

describe("calculateGeneralMonthly", () => {
  it("빈 캘린더일 때 기본값 반환", () => {
    const result = calculateGeneralMonthly(2026, 5, { cells: {} });
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(0);
    expect(result.balance).toBe(0);
    expect(result.days).toHaveLength(31); // 5월은 31일
  });

  it("null 캘린더일 때 에러 없이 동작", () => {
    const result = calculateGeneralMonthly(2026, 5, null);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(0);
    expect(result.days).toHaveLength(31);
  });

  it("undefined 캘린더일 때 에러 없이 동작", () => {
    const result = calculateGeneralMonthly(2026, 5, undefined);
    expect(result.totalIncome).toBe(0);
    expect(result.days).toHaveLength(31);
  });

  it("수입 항목 합산", () => {
    const calendar = {
      cells: {
        "2026-05-10": {
          extra_items: [
            { amount: 50000, type: "income", category: "용돈" },
            { amount: 10000, type: "income", category: "보너스" },
          ],
        },
      },
    };
    const result = calculateGeneralMonthly(2026, 5, calendar);
    expect(result.totalIncome).toBe(60000);
    expect(result.totalExpense).toBe(0);
    expect(result.balance).toBe(60000);
  });

  it("지출 항목 합산", () => {
    const calendar = {
      cells: {
        "2026-05-15": {
          extra_items: [
            { amount: 3000, type: "expense", category: "간식" },
            { amount: 5000, type: "expense", category: "문구" },
          ],
        },
      },
    };
    const result = calculateGeneralMonthly(2026, 5, calendar);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(8000);
    expect(result.balance).toBe(-8000);
  });

  it("type이 없으면 지출로 처리", () => {
    const calendar = {
      cells: {
        "2026-05-01": {
          extra_items: [{ amount: 2000, category: "기타" }],
        },
      },
    };
    const result = calculateGeneralMonthly(2026, 5, calendar);
    expect(result.totalExpense).toBe(2000);
    expect(result.totalIncome).toBe(0);
  });

  it("음수 금액은 절댓값으로 처리", () => {
    const calendar = {
      cells: {
        "2026-05-01": {
          extra_items: [{ amount: -3000, type: "expense", category: "기타" }],
        },
      },
    };
    const result = calculateGeneralMonthly(2026, 5, calendar);
    expect(result.totalExpense).toBe(3000);
  });

  it("카테고리별 집계 (categoryBreakdown)", () => {
    const calendar = {
      cells: {
        "2026-05-01": {
          extra_items: [
            { amount: 3000, type: "expense", category: "간식" },
            { amount: 2000, type: "expense", category: "간식" },
            { amount: 10000, type: "income", category: "용돈" },
          ],
        },
      },
    };
    const result = calculateGeneralMonthly(2026, 5, calendar);
    expect(result.categoryBreakdown.get("간식")).toEqual({ income: 0, expense: 5000 });
    expect(result.categoryBreakdown.get("용돈")).toEqual({ income: 10000, expense: 0 });
  });

  it("카테고리 없는 항목은 categoryBreakdown에 포함되지 않음", () => {
    const calendar = {
      cells: {
        "2026-05-01": {
          extra_items: [{ amount: 1000, type: "expense" }],
        },
      },
    };
    const result = calculateGeneralMonthly(2026, 5, calendar);
    expect(result.categoryBreakdown.size).toBe(0);
  });

  it("금액이 0인 항목은 카테고리 집계에서 제외", () => {
    const calendar = {
      cells: {
        "2026-05-01": {
          extra_items: [{ amount: 0, type: "expense", category: "간식" }],
        },
      },
    };
    const result = calculateGeneralMonthly(2026, 5, calendar);
    expect(result.categoryBreakdown.has("간식")).toBe(false);
  });

  it("일별 데이터에 올바른 날짜/요일 정보", () => {
    const result = calculateGeneralMonthly(2026, 5, { cells: {} });
    const day1 = result.days[0];
    expect(day1.date).toBe("2026-05-01");
    expect(day1.day).toBe(1);
    expect(day1.weekday).toBeTruthy();
  });

  it("일요일은 is_holiday=true", () => {
    // 2026-05-03은 일요일
    const result = calculateGeneralMonthly(2026, 5, { cells: {} });
    const sunday = result.days.find(d => d.date === "2026-05-03");
    expect(sunday.is_holiday).toBe(true);
  });

  it("공휴일 정보 반영", () => {
    const holidays = {
      "2026-05-05": { name: "어린이날" },
    };
    const result = calculateGeneralMonthly(2026, 5, { cells: {} }, holidays);
    const holiday = result.days.find(d => d.date === "2026-05-05");
    expect(holiday.is_holiday).toBe(true);
    expect(holiday.holiday_name).toBe("어린이날");
  });

  it("공휴일이 아닌 평일은 is_holiday=false", () => {
    // 2026-05-04는 월요일
    const result = calculateGeneralMonthly(2026, 5, { cells: {} });
    const monday = result.days.find(d => d.date === "2026-05-04");
    expect(monday.is_holiday).toBe(false);
  });

  it("2월 윤년 28/29일 처리", () => {
    // 2024년은 윤년
    const result2024 = calculateGeneralMonthly(2024, 2, { cells: {} });
    expect(result2024.days).toHaveLength(29);
    // 2025년은 평년
    const result2025 = calculateGeneralMonthly(2025, 2, { cells: {} });
    expect(result2025.days).toHaveLength(28);
  });

  it("cells 호환 별칭 존재", () => {
    const result = calculateGeneralMonthly(2026, 5, { cells: {} });
    expect(result.cells).toBe(result.days);
  });

  it("메모 정보 포함", () => {
    const calendar = {
      cells: {
        "2026-05-01": { memo: "오늘 기분 좋음", extra_items: [] },
      },
    };
    const result = calculateGeneralMonthly(2026, 5, calendar);
    const day1 = result.days[0];
    expect(day1.memo).toBe("오늘 기분 좋음");
  });

  it("여러 날에 걸친 수입/지출 합산", () => {
    const calendar = {
      cells: {
        "2026-05-01": { extra_items: [{ amount: 10000, type: "income" }] },
        "2026-05-15": { extra_items: [{ amount: 3000, type: "expense" }] },
        "2026-05-30": { extra_items: [{ amount: 5000, type: "income" }] },
      },
    };
    const result = calculateGeneralMonthly(2026, 5, calendar);
    expect(result.totalIncome).toBe(15000);
    expect(result.totalExpense).toBe(3000);
    expect(result.balance).toBe(12000);
  });
});
