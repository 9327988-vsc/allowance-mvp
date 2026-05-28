// src/utils/authStore.js — 로컬 유저 계정 + 아이디/비밀번호 인증

import { nanoid } from "./idGenerator";
import { serverRegister, serverLogin, serverLogout, serverUpdateProfile } from "./serverAuth";
import { loadFamilyContext } from "./familyContext";

const ACCOUNTS_KEY = "user_accounts_v1";
const ACTIVE_KEY = "active_user_v1";
const MIGRATED_KEY = "auth_migrated_v1";
const PASSWORD_MIGRATED_KEY = "auth_password_migrated_v1";

/**
 * @typedef {Object} UserAccount
 * @property {string} user_id
 * @property {string} display_name
 * @property {"child"|"parent"|"general"} role
 * @property {string} username
 * @property {string|null} password_hash
 * @property {string|null} password_salt
 * @property {string|null} security_question
 * @property {string|null} security_answer_hash
 * @property {string|null} security_answer_salt
 * @property {string|null} avatar_emoji
 * @property {string|null} birth_date
 * @property {string} created_at
 * @property {import("./familyContext").FamilyContextData|null} family_context
 */

export const SECURITY_QUESTIONS = [
  "태어난 도시는?",
  "첫 번째 반려동물 이름은?",
  "가장 좋아하는 음식은?",
  "어린 시절 별명은?",
  "가장 기억에 남는 선생님 성함은?",
];

/** PBKDF2-SHA256 해시 (100000회, per-user salt) */
export async function hashPassword(input, saltHex = null) {
  const saltStr = saltHex || "allowance-app-v1-salt";
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(input),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(saltStr), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return "pbkdf2v4:" + Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// 레거시 호환: 기존 코드에서 hashPin을 import하는 곳 대응
export const hashPin = hashPassword;

/** Constant-time 문자열 비교 (타이밍 공격 방어) */
function constantTimeEqual(a, b) {
  if (a.length !== b.length) {
    let dummy = 0;
    for (let i = 0; i < a.length; i++) dummy |= a.charCodeAt(i) ^ 0;
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** per-user random salt 생성 (16 bytes hex) */
function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$';
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  const chars = [
    upper[arr[0] % upper.length],
    lower[arr[1] % lower.length],
    lower[arr[2] % lower.length],
    digits[arr[3] % digits.length],
    special[arr[4] % special.length],
    lower[arr[5] % lower.length],
    upper[arr[6] % upper.length],
    digits[arr[7] % digits.length],
  ];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = arr[i + 2] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function generateRandomAnswer() {
  const pool = 'abcdefghjkmnpqrstuvwxyz23456789';
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  let answer = '';
  for (let i = 0; i < 8; i++) answer += pool[arr[i] % pool.length];
  return answer;
}

// ── 아이디/비밀번호 유효성 검사 ──

/** 아이디 검증: 영문 시작, 영문+숫자, 3~20자 */
export function validateUsername(username) {
  if (!username || username.length < 3) return { valid: false, error: "아이디는 3자 이상이어야 합니다" };
  if (username.length > 20) return { valid: false, error: "아이디는 20자 이하여야 합니다" };
  if (!/^[a-zA-Z]/.test(username)) return { valid: false, error: "아이디는 영문으로 시작해야 합니다" };
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(username)) return { valid: false, error: "아이디는 영문과 숫자만 사용할 수 있습니다" };
  return { valid: true };
}

/** 비밀번호 검증: 영문+숫자 필수, 특수문자/대문자 허용, 8자 이상 */
export function validatePassword(password) {
  if (!password || password.length < 8) return { valid: false, error: "비밀번호는 8자 이상이어야 합니다" };
  if (password.length > 64) return { valid: false, error: "비밀번호는 64자 이하여야 합니다" };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, error: "비밀번호에 영문을 포함해야 합니다" };
  if (!/[0-9]/.test(password)) return { valid: false, error: "비밀번호에 숫자를 포함해야 합니다" };
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(password)) {
    return { valid: false, error: "허용되지 않는 문자가 포함되어 있습니다" };
  }
  return { valid: true };
}

/** 비밀번호 강도 평가 (UI 피드백용) */
export function getPasswordStrength(password) {
  if (!password) return { level: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 2) return { level: 1, label: "약함" };
  if (score <= 3) return { level: 2, label: "보통" };
  return { level: 3, label: "강함" };
}

// ── 저장/로드 ──

/** @returns {UserAccount[]} */
export function loadUserAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("[authStore] loadUserAccounts parse failed:", e);
    return [];
  }
}

function saveUserAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.name === "QuotaExceededError" ? "QUOTA_EXCEEDED" : "WRITE_ERROR" };
  }
}

// ── 유저 생성/조회 ──

/** 유저 생성 (아이디+비밀번호+보안질문) */
export async function createUser({ displayName, role, username, password, securityQuestion, securityAnswer, birthDate = null, familyContext = null }) {
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.valid) throw new Error(usernameCheck.error);
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) throw new Error(passwordCheck.error);

  const accounts = loadUserAccounts();
  if (accounts.some(a => a.username?.toLowerCase() === username.toLowerCase())) {
    throw new Error("이미 사용 중인 아이디입니다");
  }

  const passwordSalt = generateSalt();
  const account = {
    user_id: `usr_${nanoid(16)}`,
    display_name: displayName,
    role,
    username: username.toLowerCase(),
    password_hash: await hashPassword(password, passwordSalt),
    password_salt: passwordSalt,
    security_question: securityQuestion || null,
    security_answer_hash: null,
    security_answer_salt: null,
    avatar_emoji: null,
    birth_date: birthDate,
    created_at: new Date().toISOString(),
    family_context: familyContext || null,
  };

  if (securityAnswer) {
    const answerSalt = generateSalt();
    account.security_answer_hash = await hashPassword(securityAnswer.trim().toLowerCase(), answerSalt);
    account.security_answer_salt = answerSalt;
  }

  accounts.push(account);
  const saveResult = saveUserAccounts(accounts);
  if (saveResult && !saveResult.success) {
    throw new Error(saveResult.error || "계정 저장 실패");
  }

  serverRegister({
    username, password, display_name: displayName, role,
    security_question: securityQuestion, security_answer: securityAnswer,
    family_context: familyContext || null,
  }).catch(e => console.warn("[authStore] serverRegister:", e.message));

  return account;
}

/** ID로 유저 조회 */
export function findUserById(userId) {
  return loadUserAccounts().find((a) => a.user_id === userId) || null;
}

/** username으로 유저 조회 */
export function findUserByUsername(username) {
  if (!username) return null;
  return loadUserAccounts().find(a => a.username?.toLowerCase() === username.toLowerCase()) || null;
}

// ── 비밀번호 인증 ──

/** 비밀번호 검증 (로컬 → 서버 폴백) */
export async function verifyPassword(username, password) {
  const user = findUserByUsername(username);
  if (user) {
    if (!user.password_hash) return { success: false, error: "비밀번호가 설정되지 않았습니다" };
    const hash = await hashPassword(password, user.password_salt);
    if (constantTimeEqual(user.password_hash, hash)) {
      serverRegister({
        username, password, display_name: user.display_name, role: user.role,
        security_question: user.security_question, security_answer: null,
        family_context: loadFamilyContext() || user.family_context || null,
      }).catch(e => console.warn("[authStore] serverRegister on login:", e.message));
      return { success: true, userId: user.user_id };
    }
    return { success: false, error: "비밀번호가 일치하지 않습니다" };
  }

  const serverResult = await serverLogin(username, password);
  if (serverResult.success && serverResult.user) {
    const newAccount = await createUser({
      displayName: serverResult.user.display_name,
      role: serverResult.user.role,
      username,
      password,
      securityQuestion: serverResult.user.security_question,
      securityAnswer: null,
      familyContext: serverResult.user.family_context || null,
    }).catch(e => {
      console.warn("[authStore] createUser after serverLogin failed:", e.message);
      return null;
    });
    if (newAccount) return { success: true, userId: newAccount.user_id };
    // createUser 실패 시 (이미 존재하는 로컬 계정 등) — 기존 계정으로 재시도
    const existing = findUserByUsername(username);
    if (existing) return { success: true, userId: existing.user_id };
  }
  if (serverResult.error === "NETWORK_ERROR") {
    return { success: false, error: "서버에 연결할 수 없습니다. 이 기기에 저장된 계정만 로그인할 수 있어요." };
  }
  return { success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다" };
}

/** 비밀번호 변경 */
export async function setUserPassword(userId, password) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex((a) => a.user_id === userId);
  if (idx < 0) return { success: false, error: "USER_NOT_FOUND" };
  const salt = generateSalt();
  accounts[idx].password_hash = await hashPassword(password, salt);
  accounts[idx].password_salt = salt;
  delete accounts[idx].password_must_change;
  return saveUserAccounts(accounts);
}

// ── 보안 질문 기반 비밀번호 초기화 ──

/** 보안 답변 검증 */
export async function verifySecurityAnswer(username, answer) {
  const user = findUserByUsername(username);
  if (!user) return { success: false, error: "존재하지 않는 아이디입니다" };
  if (!user.security_question || !user.security_answer_hash) {
    return { success: false, error: "보안 질문이 설정되지 않았습니다" };
  }

  const hash = await hashPassword(answer.trim().toLowerCase(), user.security_answer_salt);
  if (constantTimeEqual(user.security_answer_hash, hash)) {
    return { success: true, userId: user.user_id, question: user.security_question };
  }
  return { success: false, error: "보안 답변이 일치하지 않습니다" };
}

/** 보안 질문 조회 (비밀번호 찾기 화면용) */
export function getSecurityQuestion(username) {
  const user = findUserByUsername(username);
  if (!user) return null;
  return user.security_question || null;
}

/** 보안 질문으로 비밀번호 초기화 */
export async function resetPasswordWithAnswer(username, answer, newPassword) {
  const verify = await verifySecurityAnswer(username, answer);
  if (!verify.success) return verify;

  const passwordCheck = validatePassword(newPassword);
  if (!passwordCheck.valid) return { success: false, error: passwordCheck.error };

  return setUserPassword(verify.userId, newPassword);
}

// ── 유저 프로필 관리 ──

export function updateUserDisplayName(userId, displayName) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex((a) => a.user_id === userId);
  if (idx < 0) return;
  accounts[idx].display_name = displayName;
  saveUserAccounts(accounts);
}

export function updateUserAvatar(userId, emoji) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex((a) => a.user_id === userId);
  if (idx < 0) return;
  accounts[idx].avatar_emoji = emoji;
  saveUserAccounts(accounts);
}

export function updateUserFamilyContext(userId, familyContext) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex((a) => a.user_id === userId);
  if (idx < 0) return;
  accounts[idx].family_context = familyContext;
  saveUserAccounts(accounts);
  if (accounts[idx].username) {
    serverUpdateProfile(accounts[idx].username, { family_context: familyContext }).catch(e => console.warn("[authStore] serverUpdateProfile:", e.message));
  }
}

export function removeUser(userId) {
  const accounts = loadUserAccounts().filter((a) => a.user_id !== userId);
  saveUserAccounts(accounts);
  try {
    const raw = localStorage.getItem("user_prefs_v1");
    if (raw) {
      const all = JSON.parse(raw);
      if (all[userId]) {
        delete all[userId];
        localStorage.setItem("user_prefs_v1", JSON.stringify(all));
      }
    }
  } catch (e) { console.warn("[authStore] removeUser prefs cleanup failed:", e); }
  if (getActiveUser() === userId) clearActiveUser();
}

// ── 세션 관리 ──

export function setActiveUser(userId) {
  localStorage.setItem(ACTIVE_KEY, userId);
}

export function getActiveUser() {
  return localStorage.getItem(ACTIVE_KEY) || null;
}

export function clearActiveUser() {
  localStorage.removeItem(ACTIVE_KEY);
}

export async function logoutUser() {
  clearActiveUser();
  await serverLogout().catch(() => {});
}

// ── 레거시 마이그레이션 ──

/** 레거시 family_accounts_v1 → user_accounts_v1 마이그레이션 (멱등성 보장) */
export function migrateFromLegacyAccounts() {
  if (localStorage.getItem(MIGRATED_KEY)) return;
  if (migrateFromLegacyAccounts._running) return;
  migrateFromLegacyAccounts._running = true;

  try {
    const raw = localStorage.getItem("family_accounts_v1");
    if (!raw) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return;
    }
    const legacyAccounts = JSON.parse(raw);
    if (!Array.isArray(legacyAccounts) || legacyAccounts.length === 0) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return;
    }

    const existing = loadUserAccounts();
    for (const legacy of legacyAccounts) {
      const alreadyExists = existing.some(
        (u) => u.family_context?.family_id === legacy.family_id &&
               u.family_context?.member_id === legacy.member_id
      );
      if (alreadyExists) continue;

      existing.push({
        user_id: `usr_${nanoid(16)}`,
        display_name: legacy.member_display_name || "사용자",
        role: legacy.member_role || "child",
        username: null,
        password_hash: null,
        password_salt: null,
        security_question: null,
        security_answer_hash: null,
        security_answer_salt: null,
        avatar_emoji: null,
        created_at: legacy.joined_at || new Date().toISOString(),
        family_context: legacy,
      });
    }
    saveUserAccounts(existing);
    localStorage.setItem(MIGRATED_KEY, "1");
  } catch (e) {
    console.warn("[authStore] migrateFromLegacyAccounts failed (will retry next boot):", e);
  } finally {
    migrateFromLegacyAccounts._running = false;
  }
}

/** PIN 기반 계정 → 비밀번호 기반 계정 마이그레이션 (기존 계정에 기본 자격증명 부여) */
export async function migrateToPasswordAuth() {
  if (localStorage.getItem(PASSWORD_MIGRATED_KEY)) return { migrated: false, accounts: [] };

  const accounts = loadUserAccounts();
  let changed = false;
  const migratedAccounts = [];

  for (let i = 0; i < accounts.length; i++) {
    const acct = accounts[i];
    if (acct.username && acct.password_hash) continue;

    let defaultUsername;
    if (acct.role === "child") {
      defaultUsername = "child01";
    } else if (acct.role === "parent") {
      defaultUsername = "parent01";
    } else {
      defaultUsername = "user01";
    }
    const defaultPassword = generateRandomPassword();

    let suffix = 1;
    let candidate = defaultUsername;
    while (accounts.some((a, idx) => idx !== i && a.username?.toLowerCase() === candidate.toLowerCase())) {
      suffix++;
      candidate = defaultUsername.replace(/\d+$/, "") + String(suffix).padStart(2, "0");
    }

    const salt = generateSalt();
    accounts[i].username = candidate;
    accounts[i].password_hash = await hashPassword(defaultPassword, salt);
    accounts[i].password_salt = salt;
    accounts[i].password_must_change = true;

    const questionSalt = generateSalt();
    accounts[i].security_question = SECURITY_QUESTIONS[0];
    accounts[i].security_answer_hash = await hashPassword(generateRandomAnswer(), questionSalt);
    accounts[i].security_answer_salt = questionSalt;

    changed = true;
    migratedAccounts.push({ username: candidate, password: defaultPassword, role: acct.role, display_name: acct.display_name });
  }

  if (changed) {
    saveUserAccounts(accounts);
  }

  try { localStorage.removeItem("pin_reset_requests_v1"); } catch { /* ignored */ }

  localStorage.setItem(PASSWORD_MIGRATED_KEY, "1");
  return { migrated: changed, accounts: migratedAccounts };
}

// ── 온보딩 연기 플래그 ──
const ONBOARDING_DEFERRED_KEY = "onboarding_deferred_v1";

export function setOnboardingDeferred() {
  localStorage.setItem(ONBOARDING_DEFERRED_KEY, "1");
}

export function isOnboardingDeferred() {
  return localStorage.getItem(ONBOARDING_DEFERRED_KEY) === "1";
}

export function clearOnboardingDeferred() {
  localStorage.removeItem(ONBOARDING_DEFERRED_KEY);
}

