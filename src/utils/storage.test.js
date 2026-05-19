// src/utils/storage.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadSettings, saveSettings,
  loadSettingsForUser, saveSettingsForUser,
  loadCalendarMonth, saveCalendarMonth,
  loadCustomCategories, saveCustomCategories,
  loadMeta, saveMeta, initMetaIfNeeded,
  isAppKey, listAllAppKeys,
  cleanupOldCalendars, resetAllData,
  getStorageUsage, isStorageAvailable,
  registerCorruptedCallback,
} from "./storage";

describe("settings CRUD", () => {
  it("저장 후 로드", () => {
    saveSettings({ base_allowance: 50000 });
    const loaded = loadSettings();
    expect(loaded.base_allowance).toBe(50000);
    expect(loaded.updated_at).toBeTruthy();
  });

  it("저장 전 로드 → null", () => {
    expect(loadSettings()).toBeNull();
  });
});

describe("settingsForUser", () => {
  it("유저별 설정 저장/로드", () => {
    saveSettingsForUser("user1", { base_allowance: 30000 });
    expect(loadSettingsForUser("user1").base_allowance).toBe(30000);
  });

  it("유저별 설정 없으면 글로벌 마이그레이션", () => {
    saveSettings({ base_allowance: 50000 });
    const loaded = loadSettingsForUser("first_user");
    expect(loaded.base_allowance).toBe(50000);
    expect(loaded._owner_id).toBe("first_user");
  });

  it("다른 유저 설정 존재 시 새 유저는 null", () => {
    saveSettingsForUser("user1", { base_allowance: 30000 });
    expect(loadSettingsForUser("user2")).toBeNull();
  });

  it("userId 없으면 글로벌 설정", () => {
    saveSettings({ base_allowance: 40000 });
    expect(loadSettingsForUser(null).base_allowance).toBe(40000);
  });
});

describe("calendarMonth CRUD", () => {
  it("저장 후 로드", () => {
    const cal = { year: 2026, month: 5, cells: { "2026-05-01": { memo: "test" } } };
    saveCalendarMonth(cal);
    const loaded = loadCalendarMonth(2026, 5);
    expect(loaded.cells["2026-05-01"].memo).toBe("test");
  });

  it("데이터 없으면 빈 캘린더", () => {
    const loaded = loadCalendarMonth(2026, 3);
    expect(loaded.year).toBe(2026);
    expect(loaded.month).toBe(3);
    expect(loaded.cells).toEqual({});
  });
});

describe("customCategories", () => {
  it("저장 후 로드", () => {
    saveCustomCategories([{ name: "교통", icon: "🚌" }]);
    expect(loadCustomCategories()).toHaveLength(1);
  });

  it("데이터 없으면 빈 배열", () => {
    expect(loadCustomCategories()).toEqual([]);
  });
});

describe("meta", () => {
  it("저장 후 로드", () => {
    saveMeta({ app_version: "8.5.0" });
    expect(loadMeta().app_version).toBe("8.5.0");
  });

  it("initMetaIfNeeded — 최초 생성", () => {
    expect(loadMeta()).toBeNull();
    initMetaIfNeeded();
    expect(loadMeta()).not.toBeNull();
    expect(loadMeta().schema_version).toBe(1);
  });

  it("initMetaIfNeeded — 기존 유지", () => {
    saveMeta({ custom: "data", schema_version: 99 });
    initMetaIfNeeded();
    expect(loadMeta().schema_version).toBe(99);
  });
});

describe("isAppKey", () => {
  it("exact 매칭", () => {
    expect(isAppKey("settings_v1")).toBe(true);
    expect(isAppKey("meta_v1")).toBe(true);
  });

  it("prefix 매칭", () => {
    expect(isAppKey("calendar_v1_2025_01")).toBe(true);
    expect(isAppKey("settings_v1_u_abc")).toBe(true);
  });

  it("corrupted 키", () => {
    expect(isAppKey("settings_v1_corrupted_123")).toBe(true);
  });

  it("비앱 키 → false", () => {
    expect(isAppKey("random_key")).toBe(false);
    expect(isAppKey("")).toBe(false);
  });
});

describe("listAllAppKeys", () => {
  it("앱 키만 반환", () => {
    localStorage.setItem("settings_v1", "{}");
    localStorage.setItem("calendar_v1_2025_01", "{}");
    localStorage.setItem("third_party", "data");
    const keys = listAllAppKeys();
    expect(keys).toContain("settings_v1");
    expect(keys).not.toContain("third_party");
  });
});

describe("resetAllData", () => {
  it("앱 키만 삭제, 외부 키 유지", () => {
    localStorage.setItem("settings_v1", "{}");
    localStorage.setItem("meta_v1", "{}");
    localStorage.setItem("external", "keep");
    resetAllData();
    expect(localStorage.getItem("settings_v1")).toBeNull();
    expect(localStorage.getItem("external")).toBe("keep");
  });
});

describe("getStorageUsage", () => {
  it("앱 키 사용량 계산", () => {
    localStorage.setItem("settings_v1", JSON.stringify({ test: true }));
    const usage = getStorageUsage();
    expect(usage.used).toBeGreaterThan(0);
    expect(usage.total).toBe(5 * 1024 * 1024);
    expect(usage.percent).toBeGreaterThan(0);
  });

  it("앱 키 없으면 0", () => {
    const usage = getStorageUsage();
    expect(usage.used).toBe(0);
  });
});

describe("isStorageAvailable", () => {
  it("localStorage 사용 가능 시 true", () => {
    expect(isStorageAvailable()).toBe(true);
  });
});

describe("corrupted data", () => {
  it("깨진 JSON → null + 백업 생성", () => {
    localStorage.setItem("settings_v1", "not-valid{{{");
    const result = loadSettings();
    expect(result).toBeNull();
    expect(localStorage.getItem("settings_v1")).toBeNull();
    const keys = Object.keys(localStorage).filter(k => k.includes("settings_v1_corrupted_"));
    expect(keys.length).toBe(1);
  });

  it("corrupted callback 호출", () => {
    const cb = vi.fn();
    registerCorruptedCallback(cb);
    localStorage.setItem("settings_v1", "broken");
    loadSettings();
    expect(cb).toHaveBeenCalledWith("settings_v1");
    registerCorruptedCallback(null);
  });
});

describe("quota exceeded", () => {
  it("setItem 실패 시 에러 반환", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key) => {
      if (key === "settings_v1") {
        throw new Error("write failed");
      }
    });
    const result = saveSettings({ test: true });
    expect(result.success).toBe(false);
    expect(["QUOTA_EXCEEDED", "WRITE_ERROR"]).toContain(result.error);
    spy.mockRestore();
  });
});

describe("cleanupOldCalendars", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
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
