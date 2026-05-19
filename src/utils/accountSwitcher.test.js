// src/utils/accountSwitcher.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./familyContext", () => ({
  loadFamilyContext: vi.fn(),
  saveFamilyContext: vi.fn(),
  clearFamilyContext: vi.fn(),
}));
vi.mock("./kvAdapter", () => ({ resetKVAdapter: vi.fn() }));
vi.mock("./deviceId", () => ({ getDeviceId: vi.fn(() => "device_1") }));
vi.mock("./authStore", () => ({
  clearActiveUser: vi.fn(),
  setActiveUser: vi.fn(),
  loadUserAccounts: vi.fn(() => []),
}));
vi.mock("./userPrefs", () => ({ clearPrefsOverrides: vi.fn() }));
vi.mock("./spendingLimit", () => ({ resetSpendingLimitCache: vi.fn() }));
vi.mock("./autoGrant", () => ({ resetAutoGrantCache: vi.fn() }));

import {
  loadSavedAccounts,
  saveCurrentAccount,
  switchToAccount,
  logout,
  updateAccountDisplayName,
  removeSavedAccount,
} from "./accountSwitcher";
import { loadFamilyContext, saveFamilyContext, clearFamilyContext } from "./familyContext";
import { resetKVAdapter } from "./kvAdapter";
import { clearActiveUser, setActiveUser, loadUserAccounts } from "./authStore";
import { clearPrefsOverrides } from "./userPrefs";
import { resetSpendingLimitCache } from "./spendingLimit";
import { resetAutoGrantCache } from "./autoGrant";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("loadSavedAccounts", () => {
  it("저장된 데이터 없으면 빈 배열 반환", () => {
    expect(loadSavedAccounts()).toEqual([]);
  });

  it("정상 데이터 파싱", () => {
    const accounts = [{ family_id: "f1", member_id: "m1" }];
    localStorage.setItem("saved_family_accounts_v1", JSON.stringify(accounts));
    expect(loadSavedAccounts()).toEqual(accounts);
  });

  it("손상된 JSON → 빈 배열 반환 + 백업 저장", () => {
    localStorage.setItem("saved_family_accounts_v1", "not-json{{{");
    const result = loadSavedAccounts();
    expect(result).toEqual([]);
    // 원본 삭제됨
    expect(localStorage.getItem("saved_family_accounts_v1")).toBeNull();
  });
});

describe("saveCurrentAccount", () => {
  it("familyContext 없으면 아무것도 안 함", () => {
    loadFamilyContext.mockReturnValue(null);
    saveCurrentAccount();
    expect(localStorage.getItem("saved_family_accounts_v1")).toBeNull();
  });

  it("새 계정 추가", () => {
    loadFamilyContext.mockReturnValue({ family_id: "f1", member_id: "m1", member_display_name: "테스트" });
    saveCurrentAccount();
    const saved = JSON.parse(localStorage.getItem("saved_family_accounts_v1"));
    expect(saved).toHaveLength(1);
    expect(saved[0].family_id).toBe("f1");
  });

  it("같은 계정 중복 저장 시 업데이트", () => {
    loadFamilyContext.mockReturnValue({ family_id: "f1", member_id: "m1", member_display_name: "이전" });
    saveCurrentAccount();
    loadFamilyContext.mockReturnValue({ family_id: "f1", member_id: "m1", member_display_name: "변경" });
    saveCurrentAccount();
    const saved = JSON.parse(localStorage.getItem("saved_family_accounts_v1"));
    expect(saved).toHaveLength(1);
    expect(saved[0].member_display_name).toBe("변경");
  });
});

describe("switchToAccount", () => {
  it("매칭 유저 있으면 setActiveUser 호출", () => {
    loadFamilyContext.mockReturnValue(null);
    loadUserAccounts.mockReturnValue([
      { user_id: "u1", family_context: { family_id: "f1", member_id: "m1" } },
    ]);
    switchToAccount({ family_id: "f1", member_id: "m1" });
    expect(saveFamilyContext).toHaveBeenCalledWith({ family_id: "f1", member_id: "m1" });
    expect(setActiveUser).toHaveBeenCalledWith("u1");
    expect(resetKVAdapter).toHaveBeenCalled();
    expect(resetSpendingLimitCache).toHaveBeenCalled();
    expect(resetAutoGrantCache).toHaveBeenCalled();
  });

  it("매칭 유저 없으면 clearActiveUser + clearFamilyContext 호출", () => {
    loadFamilyContext.mockReturnValue(null);
    loadUserAccounts.mockReturnValue([]);
    switchToAccount({ family_id: "f_none", member_id: "m_none" });
    expect(clearActiveUser).toHaveBeenCalled();
    expect(clearFamilyContext).toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("로그아웃 시 모든 정리 함수 호출", () => {
    loadFamilyContext.mockReturnValue(null);
    logout();
    expect(clearFamilyContext).toHaveBeenCalled();
    expect(clearActiveUser).toHaveBeenCalled();
    expect(clearPrefsOverrides).toHaveBeenCalled();
    expect(resetKVAdapter).toHaveBeenCalled();
  });
});

describe("updateAccountDisplayName", () => {
  it("존재하는 멤버 이름 업데이트", () => {
    localStorage.setItem(
      "saved_family_accounts_v1",
      JSON.stringify([{ family_id: "f1", member_id: "m1", member_display_name: "이전" }])
    );
    updateAccountDisplayName("m1", "새이름");
    const saved = JSON.parse(localStorage.getItem("saved_family_accounts_v1"));
    expect(saved[0].member_display_name).toBe("새이름");
  });

  it("존재하지 않는 멤버는 무시", () => {
    localStorage.setItem(
      "saved_family_accounts_v1",
      JSON.stringify([{ family_id: "f1", member_id: "m1", member_display_name: "이전" }])
    );
    updateAccountDisplayName("m_unknown", "새이름");
    const saved = JSON.parse(localStorage.getItem("saved_family_accounts_v1"));
    expect(saved[0].member_display_name).toBe("이전");
  });
});

describe("removeSavedAccount", () => {
  it("특정 계정 삭제", () => {
    localStorage.setItem(
      "saved_family_accounts_v1",
      JSON.stringify([
        { family_id: "f1", member_id: "m1" },
        { family_id: "f2", member_id: "m2" },
      ])
    );
    removeSavedAccount("f1", "m1");
    const saved = JSON.parse(localStorage.getItem("saved_family_accounts_v1"));
    expect(saved).toHaveLength(1);
    expect(saved[0].family_id).toBe("f2");
  });

  it("존재하지 않는 계정 삭제 시도 → 기존 데이터 유지", () => {
    localStorage.setItem(
      "saved_family_accounts_v1",
      JSON.stringify([{ family_id: "f1", member_id: "m1" }])
    );
    removeSavedAccount("f_none", "m_none");
    const saved = JSON.parse(localStorage.getItem("saved_family_accounts_v1"));
    expect(saved).toHaveLength(1);
  });
});
