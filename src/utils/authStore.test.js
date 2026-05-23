// src/utils/authStore.test.js — authStore 핵심 기능 테스트
import { describe, it, expect, beforeEach } from "vitest";
import {
  hashPassword,
  hashPin,
  createUser,
  findUserById,
  findUserByUsername,
  loadUserAccounts,
  verifyPassword,
  setUserPassword,
  updateUserDisplayName,
  updateUserAvatar,
  removeUser,
  setActiveUser,
  getActiveUser,
  clearActiveUser,
  validateUsername,
  validatePassword,
  getPasswordStrength,
  getSecurityQuestion,
  verifySecurityAnswer,
  resetPasswordWithAnswer,
  SECURITY_QUESTIONS,
  migrateFromLegacyAccounts,
  migrateToPasswordAuth,
} from "./authStore";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("hashPassword", () => {
  it("pbkdf2v4 접두사를 반환한다", async () => {
    const hash = await hashPassword("TestPass1");
    expect(hash.startsWith("pbkdf2v4:")).toBe(true);
    expect(hash.length).toBeGreaterThan(20);
  });

  it("동일 입력 + salt → 동일 해시", async () => {
    const salt = "test-salt-hex";
    const h1 = await hashPassword("Pass1234", salt);
    const h2 = await hashPassword("Pass1234", salt);
    expect(h1).toBe(h2);
  });

  it("다른 입력 → 다른 해시", async () => {
    const salt = "same-salt";
    const h1 = await hashPassword("Pass1234", salt);
    const h2 = await hashPassword("Pass5678", salt);
    expect(h1).not.toBe(h2);
  });

  it("hashPin은 hashPassword의 별칭이다", () => {
    expect(hashPin).toBe(hashPassword);
  });
});

describe("validateUsername", () => {
  it("유효한 아이디 — 영문만", () => {
    expect(validateUsername("testuser").valid).toBe(true);
  });
  it("유효한 아이디 — 영문+숫자", () => {
    expect(validateUsername("user01").valid).toBe(true);
  });
  it("3자 미만 → 실패", () => {
    expect(validateUsername("ab").valid).toBe(false);
  });
  it("21자 초과 → 실패", () => {
    expect(validateUsername("a".repeat(21)).valid).toBe(false);
  });
  it("숫자로 시작 → 실패", () => {
    expect(validateUsername("1user").valid).toBe(false);
  });
  it("특수문자 포함 → 실패", () => {
    expect(validateUsername("user@name").valid).toBe(false);
  });
  it("한글 포함 → 실패", () => {
    expect(validateUsername("유저").valid).toBe(false);
  });
});

describe("validatePassword", () => {
  it("유효한 비밀번호 — 영문+숫자", () => {
    expect(validatePassword("Abcde123").valid).toBe(true);
  });
  it("유효한 비밀번호 — 특수문자 포함", () => {
    expect(validatePassword("Abc123!@").valid).toBe(true);
  });
  it("8자 미만 → 실패", () => {
    expect(validatePassword("Ab1").valid).toBe(false);
  });
  it("영문 없음 → 실패", () => {
    expect(validatePassword("12345678").valid).toBe(false);
  });
  it("숫자 없음 → 실패", () => {
    expect(validatePassword("abcdefgh").valid).toBe(false);
  });
});

describe("getPasswordStrength", () => {
  it("빈 문자열 → level 0", () => {
    expect(getPasswordStrength("").level).toBe(0);
  });
  it("약한 비밀번호", () => {
    expect(getPasswordStrength("abc12345").level).toBe(1);
  });
  it("강한 비밀번호", () => {
    expect(getPasswordStrength("MyStr0ng!Pass").level).toBe(3);
  });
});

describe("createUser / findUserById / findUserByUsername", () => {
  it("유저를 생성하고 조회할 수 있다", async () => {
    const user = await createUser({
      displayName: "테스트", role: "child",
      username: "testchild", password: "Child123!",
      securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: "서울"
    });
    expect(user.user_id).toMatch(/^usr_/);
    expect(user.display_name).toBe("테스트");
    expect(user.role).toBe("child");
    expect(user.password_hash.startsWith("pbkdf2v4:")).toBe(true);
    expect(user.username).toBe("testchild");

    const found = findUserById(user.user_id);
    expect(found).not.toBeNull();
    expect(found.display_name).toBe("테스트");

    const byName = findUserByUsername("testchild");
    expect(byName).not.toBeNull();
    expect(byName.user_id).toBe(user.user_id);
  });

  it("아이디 유효성 검사 실패 시 에러", async () => {
    await expect(createUser({
      displayName: "짧은ID", role: "child",
      username: "ab", password: "Pass1234",
    })).rejects.toThrow("3자 이상");
  });

  it("비밀번호 유효성 검사 실패 시 에러", async () => {
    await expect(createUser({
      displayName: "약한PW", role: "child",
      username: "testuser", password: "abc",
    })).rejects.toThrow("8자 이상");
  });

  it("중복 아이디 → 에러", async () => {
    await createUser({
      displayName: "원본", role: "child",
      username: "duplicate", password: "Pass1234",
    });
    await expect(createUser({
      displayName: "복사", role: "child",
      username: "duplicate", password: "Pass1234",
    })).rejects.toThrow("이미 사용 중인 아이디");
  });

  it("대소문자 무관 중복 검사", async () => {
    await createUser({
      displayName: "원본", role: "child",
      username: "MyUser", password: "Pass1234",
    });
    await expect(createUser({
      displayName: "복사", role: "child",
      username: "myuser", password: "Pass1234",
    })).rejects.toThrow("이미 사용 중인 아이디");
  });

  it("존재하지 않는 유저 조회 → null", () => {
    expect(findUserById("usr_nonexistent")).toBeNull();
    expect(findUserByUsername("nonexistent")).toBeNull();
  });
});

describe("verifyPassword", () => {
  it("올바른 비밀번호 → success", async () => {
    await createUser({
      displayName: "인증", role: "parent",
      username: "authtest", password: "Pass9999",
    });
    const result = await verifyPassword("authtest", "Pass9999");
    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();
  });

  it("틀린 비밀번호 → failure", async () => {
    await createUser({
      displayName: "인증", role: "parent",
      username: "authtest", password: "Pass9999",
    });
    const result = await verifyPassword("authtest", "Wrong1234");
    expect(result.success).toBe(false);
  });

  it("존재하지 않는 아이디 → failure", async () => {
    const result = await verifyPassword("ghost", "Pass1234");
    expect(result.success).toBe(false);
  });
});

describe("setUserPassword", () => {
  it("비밀번호 변경 후 새 비밀번호로 인증 성공", async () => {
    const user = await createUser({
      displayName: "변경", role: "child",
      username: "pwchange", password: "Pass1111",
    });
    await setUserPassword(user.user_id, "Pass2222");
    expect((await verifyPassword("pwchange", "Pass1111")).success).toBe(false);
    expect((await verifyPassword("pwchange", "Pass2222")).success).toBe(true);
  });

});

describe("보안 질문 기반 비밀번호 초기화", () => {
  it("보안 질문 조회", async () => {
    await createUser({
      displayName: "질문", role: "child",
      username: "secuser", password: "Pass1234",
      securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: "서울"
    });
    expect(getSecurityQuestion("secuser")).toBe(SECURITY_QUESTIONS[0]);
    expect(getSecurityQuestion("nonexistent")).toBeNull();
  });

  it("보안 답변 검증 — 대소문자/공백 무시", async () => {
    await createUser({
      displayName: "답변", role: "child",
      username: "answertest", password: "Pass1234",
      securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: "Seoul"
    });
    const ok = await verifySecurityAnswer("answertest", "  seoul  ");
    expect(ok.success).toBe(true);
  });

  it("보안 답변 틀림 → failure", async () => {
    await createUser({
      displayName: "답변", role: "child",
      username: "answertest2", password: "Pass1234",
      securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: "서울"
    });
    const result = await verifySecurityAnswer("answertest2", "부산");
    expect(result.success).toBe(false);
  });

  it("비밀번호 초기화 성공", async () => {
    await createUser({
      displayName: "초기화", role: "child",
      username: "resettest", password: "Pass1234",
      securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: "서울"
    });
    const result = await resetPasswordWithAnswer("resettest", "서울", "NewPass99");
    expect(result.success).toBe(true);
    expect((await verifyPassword("resettest", "NewPass99")).success).toBe(true);
    expect((await verifyPassword("resettest", "Pass1234")).success).toBe(false);
  });
});

describe("updateUserDisplayName / updateUserAvatar", () => {
  it("이름 변경", async () => {
    const user = await createUser({
      displayName: "원래", role: "child",
      username: "nametest", password: "Pass1234",
    });
    updateUserDisplayName(user.user_id, "변경됨");
    expect(findUserById(user.user_id).display_name).toBe("변경됨");
  });

  it("아바타 변경", async () => {
    const user = await createUser({
      displayName: "아바타", role: "child",
      username: "avatartest", password: "Pass1234",
    });
    updateUserAvatar(user.user_id, "🦊");
    expect(findUserById(user.user_id).avatar_emoji).toBe("🦊");
  });
});

describe("removeUser", () => {
  it("유저 삭제 후 조회 불가", async () => {
    const user = await createUser({
      displayName: "삭제대상", role: "child",
      username: "deltest", password: "Pass1234",
    });
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

describe("migrateToPasswordAuth", () => {
  it("기존 PIN 계정에 기본 자격증명 부여", async () => {
    const accounts = [
      { user_id: "usr_c1", display_name: "자녀", role: "child", pin_hash: "pbkdf2v4:abc", pin_salt: "salt1", created_at: "2026-01-01T00:00:00Z", family_context: null },
      { user_id: "usr_p1", display_name: "부모", role: "parent", pin_hash: "pbkdf2v4:def", pin_salt: "salt2", created_at: "2026-01-01T00:00:00Z", family_context: null },
    ];
    localStorage.setItem("user_accounts_v1", JSON.stringify(accounts));

    await migrateToPasswordAuth();

    const migrated = loadUserAccounts();
    expect(migrated[0].username).toBe("child01");
    expect(migrated[0].password_hash).toBeTruthy();
    expect(migrated[1].username).toBe("parent01");
    expect(migrated[1].password_hash).toBeTruthy();
    expect(localStorage.getItem("auth_password_migrated_v1")).toBe("1");
  });

  it("이미 마이그레이션 완료면 재실행 안 함", async () => {
    localStorage.setItem("auth_password_migrated_v1", "1");
    await migrateToPasswordAuth();
    expect(loadUserAccounts().length).toBe(0);
  });

  it("username이 이미 있으면 스킵", async () => {
    const accounts = [
      { user_id: "usr_c1", display_name: "자녀", role: "child", username: "existing", password_hash: "pbkdf2v4:abc", password_salt: "salt1", created_at: "2026-01-01T00:00:00Z", family_context: null },
    ];
    localStorage.setItem("user_accounts_v1", JSON.stringify(accounts));

    await migrateToPasswordAuth();

    const migrated = loadUserAccounts();
    expect(migrated[0].username).toBe("existing");
  });
});

describe("SECURITY_QUESTIONS", () => {
  it("보안 질문 목록이 존재한다", () => {
    expect(Array.isArray(SECURITY_QUESTIONS)).toBe(true);
    expect(SECURITY_QUESTIONS.length).toBeGreaterThan(0);
  });
});
