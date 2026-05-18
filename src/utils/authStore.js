// src/utils/authStore.js — 로컬 유저 계정 + PIN 인증

import { nanoid } from "./idGenerator";

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

/** PIN 해시 (PBKDF2-SHA256, 100000회 반복 — brute-force 방어, per-user salt) */
export async function hashPin(pin, saltHex = null) {
  const saltStr = saltHex ? saltHex : "allowance-app-v1-salt";
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
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

/** 레거시 hashPin (sha256v3, 100000회 SHA-256 체인) — 마이그레이션 검증용 */
async function hashPinV3(pin, saltHex = null) {
  const saltStr = saltHex ? saltHex : "allowance-app-v1-salt";
  let data = new TextEncoder().encode(saltStr + pin);
  for (let i = 0; i < 100000; i++) {
    data = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  }
  return "sha256v3:" + Array.from(data).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time 문자열 비교 (타이밍 공격 방어) */
function constantTimeEqual(a, b) {
  if (a.length !== b.length) {
    // 길이 불일치 시에도 일정 시간 소비 (더미 비교)
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

/** 레거시 hashPin (sha256v2, 10000회, 고정 salt) — 마이그레이션 검증용 */
async function hashPinV2(pin) {
  const salt = "allowance-app-v1-salt";
  let data = new TextEncoder().encode(salt + pin);
  for (let i = 0; i < 10000; i++) {
    data = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  }
  return "sha256v2:" + Array.from(data).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** per-user random salt 생성 (16 bytes hex) */
function generatePinSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
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
  if (!pin || pin.length < 4) throw new Error("PIN must be at least 4 digits");
  if (pin.length > 20) throw new Error("PIN must be 20 digits or less");
  const pinSalt = generatePinSalt();
  const account = {
    user_id: `usr_${nanoid(16)}`,
    display_name: displayName,
    role,
    pin_hash: await hashPin(pin, pinSalt),
    pin_salt: pinSalt,
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

/** PIN 검증 (레거시 djb2/SHA-256 → PBKDF2 자동 마이그레이션, constant-time 비교) */
export async function verifyPin(userId, pin) {
  const user = findUserById(userId);
  if (!user) return false;
  if (user.pin_hash === null) return false; // PIN 미설정 → LoginScreen에서 설정 흐름으로 분기
  if (user.pin_reset_pending) return false; // PIN 초기화 승인됨 → 새 PIN 설정 흐름으로 분기

  // 최신 pbkdf2v4 해시로 검증 (PBKDF2-SHA256, 100000회, per-user salt)
  if (user.pin_hash.startsWith("pbkdf2v4:")) {
    return constantTimeEqual(user.pin_hash, await hashPin(pin, user.pin_salt));
  }

  // 레거시 sha256v3 해시 (100000회 SHA-256 체인) → 성공 시 pbkdf2v4로 자동 업그레이드
  if (user.pin_hash.startsWith("sha256v3:")) {
    if (constantTimeEqual(user.pin_hash, await hashPinV3(pin, user.pin_salt))) {
      await setUserPin(userId, pin); // pbkdf2v4로 업그레이드
      return true;
    }
    return false;
  }

  // 레거시 sha256v2 해시 (10000회, 고정 salt) → 성공 시 pbkdf2v4로 자동 업그레이드
  if (user.pin_hash.startsWith("sha256v2:")) {
    if (constantTimeEqual(user.pin_hash, await hashPinV2(pin))) {
      await setUserPin(userId, pin); // pbkdf2v4로 업그레이드
      return true;
    }
    return false;
  }

  // 레거시 sha256 단일 반복 해시 → 성공 시 pbkdf2v4로 자동 업그레이드
  if (user.pin_hash.startsWith("sha256:")) {
    if (constantTimeEqual(user.pin_hash, await hashPinV1(pin))) {
      await setUserPin(userId, pin); // pbkdf2v4로 업그레이드
      return true;
    }
    return false;
  }

  // prefix 없는 SHA-256 해시로 검증 (이전 마이그레이션 중간 상태)
  const rawSha = (await hashPinV1(pin)).replace("sha256:", "");
  if (constantTimeEqual(user.pin_hash, rawSha)) {
    await setUserPin(userId, pin); // pbkdf2v4로 업그레이드
    return true;
  }

  // 레거시 djb2 해시로 검증 → 성공 시 pbkdf2v4로 자동 업그레이드
  if (legacyHashVariants(pin).includes(user.pin_hash)) {
    await setUserPin(userId, pin); // pbkdf2v4로 재저장
    return true;
  }

  return false;
}

/** PIN 설정/변경 */
export async function setUserPin(userId, pin) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex((a) => a.user_id === userId);
  if (idx < 0) return { success: false, error: "USER_NOT_FOUND" };
  const pinSalt = generatePinSalt();
  accounts[idx].pin_hash = await hashPin(pin, pinSalt);
  accounts[idx].pin_salt = pinSalt;
  delete accounts[idx].pin_reset_pending;
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

/** PIN 초기화 요청 승인 → pin_reset_pending 플래그 설정 (기존 해시 유지) */
export function approvePinReset(userId) {
  const accounts = loadUserAccounts();
  const idx = accounts.findIndex(a => a.user_id === userId);
  if (idx < 0) return false;
  accounts[idx].pin_reset_pending = true;
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

/** 레거시 family_accounts_v1 → user_accounts_v1 마이그레이션 (멱등성 보장) */
export function migrateFromLegacyAccounts() {
  if (localStorage.getItem(MIGRATED_KEY)) return;
  // 이중 실행 방어: 동시 호출 시 플래그 선점
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
      // 이미 동일 family_id + member_id 가 있으면 스킵
      const alreadyExists = existing.some(
        (u) => u.family_context?.family_id === legacy.family_id &&
               u.family_context?.member_id === legacy.member_id
      );
      if (alreadyExists) continue;

      existing.push({
        user_id: `usr_${nanoid(16)}`,
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
  } finally {
    migrateFromLegacyAccounts._running = false;
  }
}
