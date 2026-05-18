// src/utils/authStore.test.js — authStore 핵심 기능 테스트
import { describe, it, expect, beforeEach } from "vitest";
import {
  hashPin,
  createUser,
  findUserById,
  loadUserAccounts,
  verifyPin,
  setUserPin,
  updateUserDisplayName,
  updateUserAvatar,
  removeUser,
  setActiveUser,
  getActiveUser,
  clearActiveUser,
  approvePinReset,
  rejectPinReset,
  requestPinReset,
  loadPinResetRequests,
  migrateFromLegacyAccounts,
} from "./authStore";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("hashPin", () => {
  it("pbkdf2v4 접두사를 반환한다", async () => {
    const hash = await hashPin("1234");
    expect(hash.startsWith("pbkdf2v4:")).toBe(true);
    expect(hash.length).toBeGreaterThan(20);
  });

  it("동일 PIN + salt → 동일 해시", async () => {
    const salt = "test-salt-hex";
    const h1 = await hashPin("5678", salt);
    const h2 = await hashPin("5678", salt);
    expect(h1).toBe(h2);
  });

  it("다른 PIN → 다른 해시", async () => {
    const salt = "same-salt";
    const h1 = await hashPin("1234", salt);
    const h2 = await hashPin("5678", salt);
    expect(h1).not.toBe(h2);
  });
});

describe("createUser / findUserById", () => {
  it("유저를 생성하고 조회할 수 있다", async () => {
    const user = await createUser({ displayName: "테스트", role: "child", pin: "1234" });
    expect(user.user_id).toMatch(/^usr_/);
    expect(user.display_name).toBe("테스트");
    expect(user.role).toBe("child");
    expect(user.pin_hash.startsWith("pbkdf2v4:")).toBe(true);

    const found = findUserById(user.user_id);
    expect(found).not.toBeNull();
    expect(found.display_name).toBe("테스트");
  });

  it("PIN 4자리 미만이면 에러", async () => {
    await expect(createUser({ displayName: "짧은PIN", role: "child", pin: "12" }))
      .rejects.toThrow("PIN must be at least 4 digits");
  });

  it("PIN 20자리 초과면 에러", async () => {
    await expect(createUser({ displayName: "긴PIN", role: "child", pin: "123456789012345678901" }))
      .rejects.toThrow("PIN must be 20 digits or less");
  });

  it("존재하지 않는 유저 조회 → null", () => {
    expect(findUserById("usr_nonexistent")).toBeNull();
  });
});

describe("verifyPin", () => {
  it("올바른 PIN → true", async () => {
    const user = await createUser({ displayName: "인증", role: "parent", pin: "9999" });
    const result = await verifyPin(user.user_id, "9999");
    expect(result).toBe(true);
  });

  it("틀린 PIN → false", async () => {
    const user = await createUser({ displayName: "인증", role: "parent", pin: "9999" });
    const result = await verifyPin(user.user_id, "0000");
    expect(result).toBe(false);
  });

  it("존재하지 않는 유저 → false", async () => {
    const result = await verifyPin("usr_ghost", "1234");
    expect(result).toBe(false);
  });
});

describe("setUserPin", () => {
  it("PIN 변경 후 새 PIN으로 인증 성공", async () => {
    const user = await createUser({ displayName: "변경", role: "child", pin: "1111" });
    await setUserPin(user.user_id, "2222");
    expect(await verifyPin(user.user_id, "1111")).toBe(false);
    expect(await verifyPin(user.user_id, "2222")).toBe(true);
  });
});

describe("updateUserDisplayName / updateUserAvatar", () => {
  it("이름 변경", async () => {
    const user = await createUser({ displayName: "원래", role: "child", pin: "1234" });
    updateUserDisplayName(user.user_id, "변경됨");
    expect(findUserById(user.user_id).display_name).toBe("변경됨");
  });

  it("아바타 변경", async () => {
    const user = await createUser({ displayName: "아바타", role: "child", pin: "1234" });
    updateUserAvatar(user.user_id, "🦊");
    expect(findUserById(user.user_id).avatar_emoji).toBe("🦊");
  });
});

describe("removeUser", () => {
  it("유저 삭제 후 조회 불가", async () => {
    const user = await createUser({ displayName: "삭제대상", role: "child", pin: "1234" });
    removeUser(user.user_id);
    expect(findUserById(user.user_id)).toBeNull();
    expect(loadUserAccounts().length).toBe(0);
  });
});

describe("activeUser (세션)", () => {
  it("설정/조회/클리어", async () => {
    expect(getActiveUser()).toBeNull();
    setActiveUser("usr_abc");
    expect(getActiveUser()).toBe("usr_abc");
    clearActiveUser();
    expect(getActiveUser()).toBeNull();
  });
});

describe("approvePinReset — 역할 검증", () => {
  it("부모가 승인 → 성공", async () => {
    const parent = await createUser({ displayName: "부모", role: "parent", pin: "1234" });
    const child = await createUser({ displayName: "자녀", role: "child", pin: "5678" });
    requestPinReset(child.user_id);
    const result = approvePinReset(child.user_id, parent.user_id);
    expect(result).toBe(true);
  });

  it("자녀가 승인 시도 → 실패", async () => {
    const child1 = await createUser({ displayName: "자녀1", role: "child", pin: "1234" });
    const child2 = await createUser({ displayName: "자녀2", role: "child", pin: "5678" });
    requestPinReset(child2.user_id);
    const result = approvePinReset(child2.user_id, child1.user_id);
    expect(result).toBe(false);
  });
});

describe("migrateFromLegacyAccounts", () => {
  it("레거시 데이터 없으면 안전하게 종료", () => {
    migrateFromLegacyAccounts();
    expect(loadUserAccounts().length).toBe(0);
    expect(localStorage.getItem("auth_migrated_v1")).toBe("1");
  });

  it("이미 마이그레이션 완료면 재실행 안 함", async () => {
    localStorage.setItem("auth_migrated_v1", "1");
    localStorage.setItem("family_accounts_v1", JSON.stringify([{ member_display_name: "무시됨" }]));
    migrateFromLegacyAccounts();
    expect(loadUserAccounts().length).toBe(0);
  });
});
