// src/utils/badges.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BADGE_DEFINITIONS,
  loadEarnedBadges,
  checkAndAwardBadges,
  getBadgeSummary,
} from "./badges";

import { getActiveUser } from "./authStore";

vi.mock("./authStore", () => ({
  getActiveUser: vi.fn(() => "user_test1"),
}));

beforeEach(() => {
  localStorage.clear();
});

describe("BADGE_DEFINITIONS", () => {
  it("배지 정의가 배열이고 비어있지 않음", () => {
    expect(Array.isArray(BADGE_DEFINITIONS)).toBe(true);
    expect(BADGE_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it("각 배지에 필수 필드 존재", () => {
    for (const badge of BADGE_DEFINITIONS) {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.category).toBeTruthy();
      expect(typeof badge.condition).toBe("function");
    }
  });

  it("배지 ID가 모두 고유함", () => {
    const ids = BADGE_DEFINITIONS.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("loadEarnedBadges", () => {
  it("빈 상태에서 빈 배열 반환", () => {
    expect(loadEarnedBadges()).toEqual([]);
  });

  it("저장된 배지 로드", () => {
    const data = [{ id: "first_claim", earned_at: "2026-01-01T00:00:00.000Z" }];
    localStorage.setItem("badges_earned_v1_u_user_test1", JSON.stringify(data));
    expect(loadEarnedBadges()).toEqual(data);
  });

  it("잘못된 JSON일 때 빈 배열 반환", () => {
    localStorage.setItem("badges_earned_v1_u_user_test1", "not-json");
    expect(loadEarnedBadges()).toEqual([]);
  });

  it("배열이 아닌 값이 저장되었을 때 빈 배열 반환", () => {
    localStorage.setItem("badges_earned_v1_u_user_test1", JSON.stringify({ id: "test" }));
    expect(loadEarnedBadges()).toEqual([]);
  });
});

describe("checkAndAwardBadges", () => {
  it("null/undefined stats일 때 빈 배열 반환", () => {
    expect(checkAndAwardBadges(null)).toEqual({ newBadges: [] });
    expect(checkAndAwardBadges(undefined)).toEqual({ newBadges: [] });
  });

  it("stats가 객체가 아닐 때 빈 배열 반환", () => {
    expect(checkAndAwardBadges("string")).toEqual({ newBadges: [] });
    expect(checkAndAwardBadges(42)).toEqual({ newBadges: [] });
  });

  it("첫 청구 배지 획득", () => {
    const result = checkAndAwardBadges({ totalClaims: 1, totalChores: 0, monthsUnderLimit: 0, maxStreak: 0, consecutiveApprovals: 0 });
    expect(result.newBadges.some(b => b.id === "first_claim")).toBe(true);
  });

  it("이미 획득한 배지는 중복 부여하지 않음", () => {
    const stats = { totalClaims: 1, totalChores: 0, monthsUnderLimit: 0, maxStreak: 0, consecutiveApprovals: 0 };
    const result1 = checkAndAwardBadges(stats);
    expect(result1.newBadges.some(b => b.id === "first_claim")).toBe(true);
    const result2 = checkAndAwardBadges(stats);
    expect(result2.newBadges.some(b => b.id === "first_claim")).toBe(false);
  });

  it("여러 배지 동시 획득", () => {
    const stats = { totalClaims: 5, totalChores: 1, monthsUnderLimit: 0, maxStreak: 0, consecutiveApprovals: 0 };
    const result = checkAndAwardBadges(stats);
    const ids = result.newBadges.map(b => b.id);
    expect(ids).toContain("first_claim");
    expect(ids).toContain("claim_5");
    expect(ids).toContain("chore_first");
  });

  it("조건 미달 시 배지 미부여", () => {
    const stats = { totalClaims: 0, totalChores: 0, monthsUnderLimit: 0, maxStreak: 0, consecutiveApprovals: 0 };
    const result = checkAndAwardBadges(stats);
    expect(result.newBadges).toHaveLength(0);
  });

  it("localStorage에 배지 영구 저장", () => {
    checkAndAwardBadges({ totalClaims: 1, totalChores: 0, monthsUnderLimit: 0, maxStreak: 0, consecutiveApprovals: 0 });
    const saved = JSON.parse(localStorage.getItem("badges_earned_v1_u_user_test1"));
    expect(saved.length).toBeGreaterThan(0);
    expect(saved[0].id).toBe("first_claim");
    expect(saved[0].earned_at).toBeTruthy();
  });
});

describe("getBadgeSummary", () => {
  it("빈 상태에서 요약 반환", () => {
    const summary = getBadgeSummary();
    expect(summary.total).toBe(BADGE_DEFINITIONS.length);
    expect(summary.earned).toBe(0);
    expect(summary.percent).toBe(0);
    expect(summary.badges).toHaveLength(BADGE_DEFINITIONS.length);
    expect(summary.badges[0].earned).toBe(false);
    expect(summary.badges[0].earned_at).toBe(null);
  });

  it("배지 획득 후 요약에 반영", () => {
    checkAndAwardBadges({ totalClaims: 1, totalChores: 0, monthsUnderLimit: 0, maxStreak: 0, consecutiveApprovals: 0 });
    const summary = getBadgeSummary();
    expect(summary.earned).toBeGreaterThan(0);
    expect(summary.percent).toBeGreaterThan(0);
    const firstClaim = summary.badges.find(b => b.id === "first_claim");
    expect(firstClaim.earned).toBe(true);
    expect(firstClaim.earned_at).toBeTruthy();
  });
});

describe("activeUser 없을 때", () => {
  beforeEach(() => {
    getActiveUser.mockReturnValue(null);
  });

  it("loadEarnedBadges는 빈 배열 반환", () => {
    expect(loadEarnedBadges()).toEqual([]);
  });

  it("checkAndAwardBadges는 빈 배열 반환", () => {
    const result = checkAndAwardBadges({ totalClaims: 10 });
    expect(result).toEqual({ newBadges: [] });
  });

  it("getBadgeSummary는 전체 미획득 상태 반환", () => {
    const summary = getBadgeSummary();
    expect(summary.earned).toBe(0);
    expect(summary.badges.every(b => !b.earned)).toBe(true);
  });
});
