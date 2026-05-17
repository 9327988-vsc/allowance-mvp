// src/utils/authStore.js — 로컬 유저 계정 + PIN 인증

const ACCOUNTS_KEY = "user_accounts_v1";
const ACTIVE_KEY = "active_user_v1";
const MIGRATED_KEY = "auth_migrated_v1";

/**
 * @typedef {Object} UserAccount
 * @property {string} user_id
 * @property {string} display_name
 * @property {"child"|"parent"|"general"} role
 * @property {string|null} pin_hash
 * @property {string} created_at
 * @property {import("./familyContext").FamilyContextData|null} family_context
 */

/** PIN 해시 (SHA-256, 단일 반복 — 레거시 호환용) */
async function hashPinV1(pin) {
  const salt = "allowance-app-v1-salt";
  const data = new TextEncoder().encode(salt + pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return "sha256:" + Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** PIN 해시 (SHA-256, 10000회 반복 — brute-force 방어) */
export async function hashPin(pin) {
  const salt = "allowance-app-v1-salt";
  let data = new TextEncoder().encode(salt + pin);
  for (let i = 0; i < 10000; i++) {
    data = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  }
  return "sha256v2:" + Array.from(data).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** 레거시 djb2 해시 변형들 (마이그레이션 검증용) */
function legacyHashVariants(pin) {
  const salt = "allowance-app-v1-salt";
  const str = salt + pin;

  // 변형 1: unsigned (>>> 0)
  let h1 = 5381;
  for (let i = 0; i < str.length; i++) h1 = ((h1 << 5) + h1 + str.charCodeAt(i)) >>> 0;

  // 변형 2: signed overflow (원본 가능성 높음)
  let h2 = 5381;
  for (let i = 0; i < str.length; i++) h2 = (h2 << 5) + h2 + str.charCodeAt(i);

  // 변형 3: signed (| 0)
  let h3 = 5381;
  for (let i = 0; i < str.length; i++) h3 = ((h3 << 5) + h3 + str.charCodeAt(i)) | 0;

  return [h1.toString(36), h2.toString(36), h3.toString(36)];
}

/** @returns {UserAccount[]} */
export function loadUserAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
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

/** 유저 생성 */
export async function createUser({ displayName, role, pin, birthDate = null }) {
  const account = {
    user_id: `usr_${crypto.randomUUID()}`,
    display_name: displayName,
    role,
    pin_hash: await hashPin(pin),
    avatar_emoji: null,
    birth_date: birthDate,
    created_at: new Date().toISOString(),
    family_context: null,
  };
  const accounts = loadUserAccounts();
  accounts.push(account);
  const saveResult = saveUserAccounts(accounts);
  if (saveResult && !saveResult.success) {
    throw new Error(saveResult.error || "계정 저장 실패");
  }
  return account;
}

/** ID로 유저 조회 */
export function findUserById(userId) {
  return loadUserAccounts().find((a) => a.user_id === userId) || null;
}

/** PIN 검증 (레거시 djb2 → SHA-256 자동 마이그레이션) */
export async function verifyPin(userId, pin) {
  const user = findUserById(userId);
  if (!user) return false;
  if (user.pin_hash === null) return false; // PIN 미설정 → LoginScreen에서 설정 흐름으로 분기

  // 새 sha256v2 해시로 검증 (10000회 반복)
  if (user.pin_hash.startsWith("sha256v2:")) {
    return user.pin_hash === await hashPin(pin);
  }

  // 레거시 sha256 단일 반복 해시 → 성공 시 sha256v2로 자동 업그레이드
  if (user.pin_hash.startsWith("sha256:")) {
    if (user.pin_hash === await hashPinV1(pin)) {
      await setUserPin(userId, pin); // sha256v2로 업그레이드
      return true;
    }
    return false;
  }

  // prefix 없는 SHA-256 해시로 검증 (이전 마이그레이션 중간 상태)
  const rawSha = (await hashPinV1(pin)).replace("sha256:", "");
  if (user.pin_hash === rawSha) {
    await setUserPin(userId, pin); // sha256v2로 업그레이드
    return true;
  }

  // 레거시 djb2 해시로 검증 → 성공 시 SHA-256으로 자동 업그레이드
  if (legacyHashVariants(pin).includes(user.pin_hash)) {
    await setUserPin(userId, pin); // SHA-256으로 재저장
    return true;
  }

  return false;
}

/** PIN 설정/변경 */
export async function setUserPin(userId, pin) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex((a) => a.user_id === userId);
  if (idx < 0) return { success: false, error: "USER_NOT_FOUND" };
  accounts[idx].pin_hash = await hashPin(pin);
  return saveUserAccounts(accounts);
}

/** 유저의 표시 이름 업데이트 */
export function updateUserDisplayName(userId, displayName) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex((a) => a.user_id === userId);
  if (idx < 0) return;
  accounts[idx].display_name = displayName;
  saveUserAccounts(accounts);
}

/** 유저의 프로필 이모지 업데이트 */
export function updateUserAvatar(userId, emoji) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex((a) => a.user_id === userId);
  if (idx < 0) return;
  accounts[idx].avatar_emoji = emoji;
  saveUserAccounts(accounts);
}

/** 유저의 가족 컨텍스트 업데이트 */
export function updateUserFamilyContext(userId, familyContext) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex((a) => a.user_id === userId);
  if (idx < 0) return;
  accounts[idx].family_context = familyContext;
  saveUserAccounts(accounts);
}

/** 유저 삭제 */
export function removeUser(userId) {
  const accounts = loadUserAccounts().filter((a) => a.user_id !== userId);
  saveUserAccounts(accounts);
  // Clean up orphan prefs
  try {
    const raw = localStorage.getItem("user_prefs_v1");
    if (raw) {
      const all = JSON.parse(raw);
      if (all[userId]) {
        delete all[userId];
        localStorage.setItem("user_prefs_v1", JSON.stringify(all));
      }
    }
  } catch { /* ignored */ }
  if (getActiveUser() === userId) clearActiveUser();
}

/** 활성 유저 설정 */
export function setActiveUser(userId) {
  sessionStorage.setItem(ACTIVE_KEY, userId);
}

/** 활성 유저 조회 (세션 단위) */
export function getActiveUser() {
  return sessionStorage.getItem(ACTIVE_KEY) || null;
}

/** 활성 유저 클리어 */
export function clearActiveUser() {
  sessionStorage.removeItem(ACTIVE_KEY);
}

// ── PIN 초기화 요청 관리 ──
const PIN_RESET_KEY = "pin_reset_requests_v1";

export function loadPinResetRequests() {
  try {
    const raw = localStorage.getItem(PIN_RESET_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePinResetRequests(requests) {
  try {
    localStorage.setItem(PIN_RESET_KEY, JSON.stringify(requests));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.name === "QuotaExceededError" ? "QUOTA_EXCEEDED" : "WRITE_ERROR" };
  }
}

/** PIN 초기화 요청 생성 */
export function requestPinReset(userId) {
  const user = findUserById(userId);
  if (!user) return false;
  const requests = loadPinResetRequests();
  // 이미 대기 중인 요청이 있으면 무시
  if (requests.some(r => r.user_id === userId && r.status === "pending")) return false;
  requests.push({
    user_id: userId,
    display_name: user.display_name,
    role: user.role,
    requested_at: new Date().toISOString(),
    status: "pending"
  });
  savePinResetRequests(requests);
  return true;
}

/** PIN 초기화 요청 승인 → PIN을 null로 설정 */
export function approvePinReset(userId) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex(a => a.user_id === userId);
  if (idx < 0) return false;
  accounts[idx].pin_hash = null;
  saveUserAccounts(accounts);
  // 요청 상태 업데이트
  const requests = loadPinResetRequests();
  const rIdx = requests.findIndex(r => r.user_id === userId && r.status === "pending");
  if (rIdx >= 0) requests[rIdx].status = "approved";
  savePinResetRequests(requests);
  return true;
}

/** PIN 초기화 요청 거절 */
export function rejectPinReset(userId) {
  const requests = loadPinResetRequests();
  const rIdx = requests.findIndex(r => r.user_id === userId && r.status === "pending");
  if (rIdx < 0) return false;
  requests[rIdx].status = "rejected";
  savePinResetRequests(requests);
  return true;
}

/** 처리 완료된 요청 정리 */
export function clearResolvedPinResets() {
  const requests = loadPinResetRequests().filter(r => r.status === "pending");
  savePinResetRequests(requests);
}

/** 레거시 family_accounts_v1 → user_accounts_v1 마이그레이션 */
export function migrateFromLegacyAccounts() {
  if (localStorage.getItem(MIGRATED_KEY)) return;

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
      // 이미 동일 family_id + member_id 가 있으면 스킵
      const alreadyExists = existing.some(
        (u) => u.family_context?.family_id === legacy.family_id &&
               u.family_context?.member_id === legacy.member_id
      );
      if (alreadyExists) continue;

      existing.push({
        user_id: `usr_${crypto.randomUUID()}`,
        display_name: legacy.member_display_name || "사용자",
        role: legacy.member_role || "child",
        pin_hash: null, // PIN 미설정 → 첫 로그인 시 설정 요구
        avatar_emoji: null,
        created_at: legacy.joined_at || new Date().toISOString(),
        family_context: legacy,
      });
    }
    saveUserAccounts(existing);
    localStorage.setItem(MIGRATED_KEY, "1");
  } catch {
    // 마이그레이션 실패 → MIGRATED_KEY 미설정 → 다음 기동 시 재시도
  }
}
