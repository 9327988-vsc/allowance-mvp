// src/utils/dateLimit.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isAtFutureLimit, isNextMonthDisabled } from "./dateLimit";

describe("isAtFutureLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 15)); // 2026-05-15
  });
  afterEach(() => vi.useRealTimers());

  it("오늘 2026-05 + 12개월 → 2027-05까지 허용", () => {
    expect(isAtFutureLimit(2027, 5)).toBe(false); // 2027-05 OK
    expect(isAtFutureLimit(2027, 6)).toBe(true);  // 2027-06 NG
  });

  it("현재 월은 항상 허용", () => {
    expect(isAtFutureLimit(2026, 5)).toBe(false);
  });

  it("과거는 항상 허용 (한도는 미래만)", () => {
    expect(isAtFutureLimit(2020, 1)).toBe(false);
    expect(isAtFutureLimit(2025, 12)).toBe(false);
  });

  it("연도 경계 (오늘 2026-12 → 2027-12까지 허용)", () => {
    vi.setSystemTime(new Date(2026, 11, 1)); // 2026-12
    expect(isAtFutureLimit(2027, 12)).toBe(false);
    expect(isAtFutureLimit(2028, 1)).toBe(true);
  });

  it("today 파라미터 명시 주입", () => {
    const fixed = new Date(2026, 0, 15); // 2026-01
    expect(isAtFutureLimit(2027, 1, fixed)).toBe(false);
    expect(isAtFutureLimit(2027, 2, fixed)).toBe(true);
  });
});

describe("isNextMonthDisabled", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 15)); // 2026-05
  });
  afterEach(() => vi.useRealTimers());

  it("현재 2027-04 → 다음(2027-05) 허용 → 비활성 false", () => {
    expect(isNextMonthDisabled(2027, 4)).toBe(false);
  });

  it("현재 2027-05 → 다음(2027-06) 한도 초과 → 비활성 true", () => {
    expect(isNextMonthDisabled(2027, 5)).toBe(true);
  });

  it("12월 → 1월 연도 경계", () => {
    expect(isNextMonthDisabled(2027, 4)).toBe(false); // 2027-05 OK
    expect(isNextMonthDisabled(2026, 12)).toBe(false); // 2027-01 OK
  });
});
