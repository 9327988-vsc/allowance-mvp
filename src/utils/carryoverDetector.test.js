// src/utils/carryoverDetector.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectCarryover, getUnclaimedForMonth } from "./carryoverDetector";

import { loadCalendarMonth } from "./storage";
import { loadSubmittedClaims } from "./submittedClaims";

vi.mock("./storage", () => ({
  loadCalendarMonth: vi.fn(() => null),
}));

vi.mock("./submittedClaims", () => ({
  loadSubmittedClaims: vi.fn(() => []),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("detectCarryover", () => {
  it("이전 달 캘린더가 없으면 found=false", () => {
    loadCalendarMonth.mockReturnValue(null);
    const result = detectCarryover(2026, 5);
    expect(result.found).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.year).toBe(2026);
    expect(result.month).toBe(4);
  });

  it("이전 달 cells가 없으면 found=false", () => {
    loadCalendarMonth.mockReturnValue({});
    const result = detectCarryover(2026, 5);
    expect(result.found).toBe(false);
  });

  it("extra_items가 없으면 found=false", () => {
    loadCalendarMonth.mockReturnValue({ cells: { "2026-04-10": {} } });
    const result = detectCarryover(2026, 5);
    expect(result.found).toBe(false);
  });

  it("1월에서 이전 달 계산 시 12월로 넘어감", () => {
    loadCalendarMonth.mockReturnValue(null);
    const result = detectCarryover(2026, 1);
    expect(result.year).toBe(2025);
    expect(result.month).toBe(12);
  });

  it("청구가 없으면 모든 extra_items가 미청구", () => {
    loadCalendarMonth.mockReturnValue({
      cells: {
        "2026-04-10": {
          extra_items: [
            { amount: 3000, category: "간식", created_at: "2026-04-10T10:00:00Z" },
            { amount: 2000, category: "문구", created_at: "2026-04-11T10:00:00Z" },
          ],
        },
      },
    });
    loadSubmittedClaims.mockReturnValue([]);
    const result = detectCarryover(2026, 5);
    expect(result.found).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(5000);
  });

  it("거절된 청구가 있으면 모든 항목이 미청구", () => {
    loadCalendarMonth.mockReturnValue({
      cells: {
        "2026-04-05": {
          extra_items: [{ amount: 1000, created_at: "2026-04-05T10:00:00Z" }],
        },
      },
    });
    loadSubmittedClaims.mockReturnValue([
      { year: 2026, month: 4, is_extra: false, status: "rejected", submitted_at: "2026-04-20T10:00:00Z" },
    ]);
    const result = detectCarryover(2026, 5);
    expect(result.found).toBe(true);
    expect(result.items).toHaveLength(1);
  });

  it("승인된 청구 이후에 추가된 항목만 미청구", () => {
    loadCalendarMonth.mockReturnValue({
      cells: {
        "2026-04-05": {
          extra_items: [
            { amount: 1000, created_at: "2026-04-05T10:00:00Z" },
          ],
        },
        "2026-04-25": {
          extra_items: [
            { amount: 2000, created_at: "2026-04-25T10:00:00Z" },
          ],
        },
      },
    });
    loadSubmittedClaims.mockReturnValue([
      { year: 2026, month: 4, is_extra: false, status: "approved", submitted_at: "2026-04-20T00:00:00Z" },
    ]);
    const result = detectCarryover(2026, 5);
    expect(result.found).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(2000);
  });

  it("청구 이후 추가 항목이 없으면 found=false", () => {
    loadCalendarMonth.mockReturnValue({
      cells: {
        "2026-04-05": {
          extra_items: [
            { amount: 1000, created_at: "2026-04-05T10:00:00Z" },
          ],
        },
      },
    });
    loadSubmittedClaims.mockReturnValue([
      { year: 2026, month: 4, is_extra: false, status: "approved", submitted_at: "2026-04-20T00:00:00Z" },
    ]);
    const result = detectCarryover(2026, 5);
    expect(result.found).toBe(false);
  });

  it("created_at이 없는 항목은 청구 후 미청구에서 제외", () => {
    loadCalendarMonth.mockReturnValue({
      cells: {
        "2026-04-25": {
          extra_items: [
            { amount: 1000 }, // created_at 없음
          ],
        },
      },
    });
    loadSubmittedClaims.mockReturnValue([
      { year: 2026, month: 4, is_extra: false, status: "approved", submitted_at: "2026-04-20T00:00:00Z" },
    ]);
    const result = detectCarryover(2026, 5);
    expect(result.found).toBe(false);
  });

  it("금액이 유효하지 않은 항목은 total 계산에서 0 처리", () => {
    loadCalendarMonth.mockReturnValue({
      cells: {
        "2026-04-10": {
          extra_items: [
            { amount: "invalid", created_at: "2026-04-10T10:00:00Z" },
            { amount: null, created_at: "2026-04-10T10:00:00Z" },
            { amount: 3000, created_at: "2026-04-10T10:00:00Z" },
          ],
        },
      },
    });
    loadSubmittedClaims.mockReturnValue([]);
    const result = detectCarryover(2026, 5);
    expect(result.total).toBe(3000);
  });
});

describe("getUnclaimedForMonth", () => {
  it("캘린더가 없으면 빈 결과 반환", () => {
    loadCalendarMonth.mockReturnValue(null);
    const result = getUnclaimedForMonth(2026, 4);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("extra_items가 없으면 빈 결과 반환", () => {
    loadCalendarMonth.mockReturnValue({ cells: {} });
    const result = getUnclaimedForMonth(2026, 4);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("청구 없을 때 모든 항목 반환", () => {
    loadCalendarMonth.mockReturnValue({
      cells: {
        "2026-04-10": {
          extra_items: [{ amount: 5000, created_at: "2026-04-10T10:00:00Z" }],
        },
      },
    });
    loadSubmittedClaims.mockReturnValue([]);
    const result = getUnclaimedForMonth(2026, 4);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(5000);
  });

  it("승인된 청구 이후 항목만 반환", () => {
    loadCalendarMonth.mockReturnValue({
      cells: {
        "2026-04-05": {
          extra_items: [{ amount: 1000, created_at: "2026-04-05T10:00:00Z" }],
        },
        "2026-04-25": {
          extra_items: [{ amount: 2000, created_at: "2026-04-25T10:00:00Z" }],
        },
      },
    });
    loadSubmittedClaims.mockReturnValue([
      { year: 2026, month: 4, is_extra: false, status: "approved", submitted_at: "2026-04-20T00:00:00Z" },
    ]);
    const result = getUnclaimedForMonth(2026, 4);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(2000);
  });
});
