// src/utils/storage.test.js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { cleanupOldCalendars } from "./storage";

describe("cleanupOldCalendars", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 15));
  });

  it("retainMonths=6: 오늘 2026-05 → 2025-11부터 유지, 2025-10 이전 삭제", () => {
    [
      "calendar_v1_2025_06", "calendar_v1_2025_10", "calendar_v1_2025_11",
      "calendar_v1_2025_12", "calendar_v1_2026_01", "calendar_v1_2026_05"
    ].forEach(k => localStorage.setItem(k, "{}"));

    const r = cleanupOldCalendars(6);

    expect(r.deletedCount).toBe(2);
    expect(r.deletedKeys.sort()).toEqual([
      "calendar_v1_2025_06", "calendar_v1_2025_10"
    ]);
    expect(localStorage.getItem("calendar_v1_2025_11")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2025_12")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2026_05")).not.toBeNull();
  });

  it("미래 캘린더 절대 보호 (Critical 회귀 테스트)", () => {
    [
      "calendar_v1_2026_06", "calendar_v1_2026_07",
      "calendar_v1_2027_04", "calendar_v1_2030_12"
    ].forEach(k => localStorage.setItem(k, "{}"));

    const r = cleanupOldCalendars(6);

    expect(r.deletedCount).toBe(0);
    expect(localStorage.getItem("calendar_v1_2026_06")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2027_04")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2030_12")).not.toBeNull();
  });

  it("연도 경계 (오늘 2026-01 + retainMonths=6 → 2025-07부터 유지)", () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    [
      "calendar_v1_2025_06", "calendar_v1_2025_07",
      "calendar_v1_2025_08", "calendar_v1_2026_01"
    ].forEach(k => localStorage.setItem(k, "{}"));

    const r = cleanupOldCalendars(6);

    expect(r.deletedKeys).toEqual(["calendar_v1_2025_06"]);
    expect(localStorage.getItem("calendar_v1_2025_07")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2026_01")).not.toBeNull();
  });

  it("연도 2회 경계 (오늘 2026-03 + retainMonths=18 → 2024-09부터 유지)", () => {
    vi.setSystemTime(new Date(2026, 2, 15));
    [
      "calendar_v1_2024_06", "calendar_v1_2024_08",
      "calendar_v1_2024_09", "calendar_v1_2025_01", "calendar_v1_2026_03"
    ].forEach(k => localStorage.setItem(k, "{}"));

    const r = cleanupOldCalendars(18);

    expect(r.deletedKeys.sort()).toEqual([
      "calendar_v1_2024_06", "calendar_v1_2024_08"
    ]);
    expect(localStorage.getItem("calendar_v1_2024_09")).not.toBeNull();
  });

  it("settings/categories/meta는 영향 없음", () => {
    localStorage.setItem("settings_v1", "{}");
    localStorage.setItem("custom_categories_v1", "{}");
    localStorage.setItem("meta_v1", "{}");
    localStorage.setItem("calendar_v1_2020_01", "{}");

    cleanupOldCalendars(6);

    expect(localStorage.getItem("settings_v1")).not.toBeNull();
    expect(localStorage.getItem("custom_categories_v1")).not.toBeNull();
    expect(localStorage.getItem("meta_v1")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2020_01")).toBeNull();
  });

  it("잘못된 키 형식은 무시", () => {
    localStorage.setItem("calendar_v1_invalid", "{}");
    localStorage.setItem("calendar_v1_2020_99", "{}");
    localStorage.setItem("calendar_v1_2020_01", "{}");

    const r = cleanupOldCalendars(6);

    expect(r.deletedKeys).toContain("calendar_v1_2020_01");
    expect(localStorage.getItem("calendar_v1_invalid")).not.toBeNull();
  });
});
