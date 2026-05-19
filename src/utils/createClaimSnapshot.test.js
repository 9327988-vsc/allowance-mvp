// src/utils/createClaimSnapshot.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClaimSnapshot } from "./createClaimSnapshot";

import { loadSettings, loadSettingsForUser, loadCalendarMonth } from "./storage";
import { getActiveUser } from "./authStore";
import { calculateMonthlyAllowance } from "./calculator";

vi.mock("./storage", () => ({
  loadSettings: vi.fn(() => ({ base_amount: 50000, child_name: "꼬마" })),
  loadSettingsForUser: vi.fn(() => ({ base_amount: 50000, child_name: "꼬마" })),
  loadCalendarMonth: vi.fn(() => ({ cells: {} })),
  loadCustomCategories: vi.fn(() => []),
}));

vi.mock("./authStore", () => ({
  getActiveUser: vi.fn(() => "user_test1"),
}));

vi.mock("./calculator", () => ({
  calculateMonthlyAllowance: vi.fn(() => ({
    total: 50000,
    base: 50000,
    deductions: 0,
    extras: 0,
    days: [],
  })),
}));

vi.mock("./messageTemplate", () => ({
  generateMessage: vi.fn(() => "테스트 메시지"),
}));

vi.mock("./holidays", () => ({
  getHolidays: vi.fn(() => ({})),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // 기본 mock 리셋
  loadSettingsForUser.mockReturnValue({ base_amount: 50000, child_name: "꼬마" });
  loadSettings.mockReturnValue({ base_amount: 50000, child_name: "꼬마" });
  loadCalendarMonth.mockReturnValue({ cells: {} });
  getActiveUser.mockReturnValue("user_test1");
  calculateMonthlyAllowance.mockReturnValue({
    total: 50000, base: 50000, deductions: 0, extras: 0, days: [],
  });
});

describe("createClaimSnapshot", () => {
  it("정상적으로 스냅샷 생성", () => {
    const snapshot = createClaimSnapshot(2026, 5);
    expect(snapshot).toBeTruthy();
    expect(snapshot.settings).toEqual({ base_amount: 50000, child_name: "꼬마" });
    expect(snapshot.cells).toEqual({});
    expect(snapshot.custom_categories).toEqual([]);
    expect(snapshot.calculation).toBeTruthy();
    expect(snapshot.message_text).toBe("테스트 메시지");
    expect(snapshot.snapshot_taken_at).toBeTruthy();
  });

  it("activeUser가 있으면 loadSettingsForUser 사용", () => {
    createClaimSnapshot(2026, 5);
    expect(loadSettingsForUser).toHaveBeenCalledWith("user_test1");
  });

  it("activeUser가 없으면 loadSettings 사용", () => {
    getActiveUser.mockReturnValue(null);
    createClaimSnapshot(2026, 5);
    expect(loadSettings).toHaveBeenCalled();
  });

  it("settings가 null이면 MIGRATION_REQUIRED 에러", () => {
    loadSettingsForUser.mockReturnValue(null);
    expect(() => createClaimSnapshot(2026, 5)).toThrow("MIGRATION_REQUIRED");
  });

  it("calendarData.cells가 없으면 빈 객체 사용", () => {
    loadCalendarMonth.mockReturnValue({});
    const snapshot = createClaimSnapshot(2026, 5);
    expect(snapshot.cells).toEqual({});
  });

  it("100KB 초과 시 에러", () => {
    // 거대한 calculation 데이터로 100KB 초과 유도
    const bigData = "x".repeat(120000);
    calculateMonthlyAllowance.mockReturnValue({
      total: 50000, base: 50000, deductions: 0, extras: 0, days: [], bigData,
    });
    expect(() => createClaimSnapshot(2026, 5)).toThrow("100KB 초과");
  });
});
