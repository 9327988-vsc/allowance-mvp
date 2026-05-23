// src/utils/initApp.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { initApp, nextScreen } from "./initApp";

// --- 모든 외부 의존성 모킹 ---

vi.mock("./storage", () => ({
  isStorageAvailable: vi.fn(() => true),
  loadSettings: vi.fn(() => ({ budget: 100000 })),
  loadSettingsForUser: vi.fn(() => ({ budget: 100000 })),
  loadMeta: vi.fn(() => ({ last_used_at: "2026-01-01T00:00:00Z" })),
  initMetaIfNeeded: vi.fn(),
  listAllAppKeys: vi.fn(() => []),
}));

vi.mock("./holidays", () => ({
  loadHolidays: vi.fn(() => Promise.resolve({ "2026-01-01": "신정" })),
}));

vi.mock("./familyContext", () => ({
  loadFamilyContext: vi.fn(() => null),
}));

vi.mock("./authStore", () => ({
  loadUserAccounts: vi.fn(() => []),
  getActiveUser: vi.fn(() => null),
  findUserById: vi.fn(() => null),
  migrateFromLegacyAccounts: vi.fn(),
  migrateToPasswordAuth: vi.fn(() => Promise.resolve()),
  isOnboardingDeferred: vi.fn(() => false),
}));

vi.mock("./userPrefs", () => ({
  loadUserPrefs: vi.fn(() => ({})),
  applyPrefs: vi.fn(),
}));

vi.mock("./exportImport", () => ({
  recoverFromCrashedImport: vi.fn(),
}));

// --- 모킹된 모듈 임포트 ---
import { isStorageAvailable, loadSettings, loadSettingsForUser, loadMeta, initMetaIfNeeded, listAllAppKeys } from "./storage";
import { loadHolidays } from "./holidays";
import { loadFamilyContext } from "./familyContext";
import { loadUserAccounts, getActiveUser, findUserById } from "./authStore";
import { applyPrefs } from "./userPrefs";

beforeEach(() => {
  vi.clearAllMocks();
  // 기본값 복원
  isStorageAvailable.mockReturnValue(true);
  loadSettings.mockReturnValue({ budget: 100000 });
  loadSettingsForUser.mockReturnValue({ budget: 100000 });
  loadMeta.mockReturnValue({ last_used_at: "2026-01-01T00:00:00Z" });
  listAllAppKeys.mockReturnValue([]);
  loadHolidays.mockResolvedValue({ "2026-01-01": "신정" });
  loadFamilyContext.mockReturnValue(null);
  getActiveUser.mockReturnValue(null);
  findUserById.mockReturnValue(null);
  loadUserAccounts.mockReturnValue([]);

  // localStorage mock
  const store = {};
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((k) => store[k] ?? null),
    setItem: vi.fn((k, v) => { store[k] = v; }),
    removeItem: vi.fn((k) => { delete store[k]; }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
  });
});

// ============================================================
// initApp() 테스트
// ============================================================
describe("initApp", () => {
  it("스토리지 비활성화 → storage_disabled 반환", async () => {
    isStorageAvailable.mockReturnValue(false);
    const result = await initApp();
    expect(result).toEqual({ status: "storage_disabled" });
  });

  it("정상 부팅 (settings 존재) → ok 반환", async () => {
    getActiveUser.mockReturnValue("user1");
    findUserById.mockReturnValue({ id: "user1", role: "parent" });
    loadSettingsForUser.mockReturnValue({ budget: 50000 });
    loadFamilyContext.mockReturnValue({ family_id: "f1", member_role: "parent" });

    const result = await initApp();
    expect(result.status).toBe("ok");
    expect(result.settings).toEqual({ budget: 50000 });
    expect(result.holidays).toEqual({ "2026-01-01": "신정" });
    expect(result.familyContext).toEqual({ family_id: "f1", member_role: "parent" });
    expect(result.authenticated).toBe(true);
    expect(result.activeUser).toEqual({ id: "user1", role: "parent" });
  });

  it("첫 사용 (settings 없음, corrupted 없음) → first_use 반환", async () => {
    loadSettings.mockReturnValue(null);
    loadSettingsForUser.mockReturnValue(null);

    const result = await initApp();
    expect(result.status).toBe("first_use");
    expect(result.holidays).toEqual({ "2026-01-01": "신정" });
  });

  it("settings 손상 (corrupted 키 존재) → settings_corrupted 반환", async () => {
    loadSettings.mockReturnValue(null);
    listAllAppKeys.mockReturnValue(["settings_v1_corrupted_20260101"]);

    const result = await initApp();
    expect(result.status).toBe("settings_corrupted");
    expect(result.corruptedKeys).toEqual(["settings_v1_corrupted_20260101"]);
  });

  it("holidays 로드 실패해도 앱은 정상 부팅", async () => {
    loadHolidays.mockRejectedValue(new Error("fetch failed"));

    const result = await initApp();
    expect(result.status).toBe("ok");
    expect(result.holidays).toEqual({});
  });

  it("인증된 유저 → applyPrefs 호출", async () => {
    getActiveUser.mockReturnValue("user1");
    findUserById.mockReturnValue({ id: "user1", role: "child" });
    loadSettingsForUser.mockReturnValue({ budget: 30000 });

    await initApp();
    expect(applyPrefs).toHaveBeenCalled();
  });

  it("미인증 유저 → applyPrefs 미호출", async () => {
    await initApp();
    expect(applyPrefs).not.toHaveBeenCalled();
  });

  it("general 계정은 settings 없어도 ok 반환", async () => {
    getActiveUser.mockReturnValue("user1");
    findUserById.mockReturnValue({ id: "user1", role: "general" });
    loadSettingsForUser.mockReturnValue(null);

    const result = await initApp();
    expect(result.status).toBe("ok");
    expect(result.settings).toBeNull();
    expect(result.activeUser.role).toBe("general");
  });

  it("meta 갱신 — initMetaIfNeeded 호출 + last_used_at 업데이트", async () => {
    const result = await initApp();
    expect(result.status).toBe("ok");
    expect(initMetaIfNeeded).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "meta_v1",
      expect.stringContaining("last_used_at"),
    );
  });
});

// ============================================================
// nextScreen() 테스트
// ============================================================
describe("nextScreen", () => {
  it("storage_disabled → storage_disabled_modal", () => {
    expect(nextScreen({ status: "storage_disabled" })).toBe("storage_disabled_modal");
  });

  it("settings_corrupted → corrupted_modal", () => {
    expect(nextScreen({ status: "settings_corrupted" })).toBe("corrupted_modal");
  });

  // --- 미인증 분기 ---
  it("미인증 + 계정 존재 → login", () => {
    loadUserAccounts.mockReturnValue([{ id: "u1" }]);
    expect(nextScreen({ status: "ok", authenticated: false })).toBe("login");
  });

  it("미인증 + 계정 없음 → signup", () => {
    loadUserAccounts.mockReturnValue([]);
    expect(nextScreen({ status: "ok", authenticated: false })).toBe("signup");
  });

  it("미인증 + first_use + 계정 없음 → signup", () => {
    loadUserAccounts.mockReturnValue([]);
    expect(nextScreen({ status: "first_use", authenticated: false })).toBe("signup");
  });

  // --- 인증 후: general 계정 ---
  it("인증 + general 역할 → main_general", () => {
    expect(nextScreen({
      status: "ok",
      authenticated: true,
      activeUser: { id: "u1", role: "general" },
      settings: { budget: 100000 },
    })).toBe("main_general");
  });

  // --- 버그 수정 핵심: parent/child + familyContext 없음 → family_onboarding ---
  it("인증 + parent 역할 + familyContext 없음 → family_onboarding", () => {
    expect(nextScreen({
      status: "ok",
      authenticated: true,
      activeUser: { id: "u1", role: "parent" },
      familyContext: null,
      settings: { budget: 100000 },
    })).toBe("family_onboarding");
  });

  it("인증 + child 역할 + familyContext 없음 → family_onboarding", () => {
    expect(nextScreen({
      status: "ok",
      authenticated: true,
      activeUser: { id: "u1", role: "child" },
      familyContext: null,
      settings: { budget: 100000 },
    })).toBe("family_onboarding");
  });

  // --- familyContext 존재 시 분기 ---
  it("인증 + familyContext + parent member_role → main_parent", () => {
    expect(nextScreen({
      status: "ok",
      authenticated: true,
      activeUser: { id: "u1", role: "parent" },
      familyContext: { family_id: "f1", member_role: "parent" },
      settings: { budget: 100000 },
    })).toBe("main_parent");
  });

  it("인증 + familyContext + child member_role → main", () => {
    expect(nextScreen({
      status: "ok",
      authenticated: true,
      activeUser: { id: "u1", role: "child" },
      familyContext: { family_id: "f1", member_role: "child" },
      settings: { budget: 100000 },
    })).toBe("main");
  });

  // --- familyContext 없음 + role 없음 (일반 fallback) ---
  it("인증 + role 없음 + familyContext 없음 + settings 있음 → main", () => {
    expect(nextScreen({
      status: "ok",
      authenticated: true,
      activeUser: { id: "u1" },
      familyContext: null,
      settings: { budget: 100000 },
    })).toBe("main");
  });

  it("인증 + role 없음 + familyContext 없음 + settings 없음 → welcome_modal", () => {
    expect(nextScreen({
      status: "ok",
      authenticated: true,
      activeUser: { id: "u1" },
      familyContext: null,
      settings: null,
    })).toBe("welcome_modal");
  });

  // --- 알 수 없는 status → welcome_modal (default) ---
  it("알 수 없는 status → welcome_modal (default)", () => {
    expect(nextScreen({ status: "unknown_status" })).toBe("welcome_modal");
  });

  // --- first_use + 인증 + parent → family_onboarding ---
  it("first_use + 인증 + parent + familyContext 없음 → family_onboarding", () => {
    expect(nextScreen({
      status: "first_use",
      authenticated: true,
      activeUser: { id: "u1", role: "parent" },
      familyContext: null,
      settings: null,
    })).toBe("family_onboarding");
  });

  // --- activeUser 누락 시 findUserById fallback ---
  it("activeUser 누락 시 findUserById fallback 사용", () => {
    getActiveUser.mockReturnValue("u1");
    findUserById.mockReturnValue({ id: "u1", role: "general" });

    expect(nextScreen({
      status: "ok",
      authenticated: true,
      // activeUser 누락
      settings: { budget: 100000 },
    })).toBe("main_general");

    expect(findUserById).toHaveBeenCalledWith("u1");
  });
});
