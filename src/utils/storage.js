// src/utils/storage.js
import { APP_VERSION } from "../constants/appVersion";

const KEYS = {
  SETTINGS: "settings_v1",
  SETTINGS_USER: (userId) => `settings_v1_u_${userId}`,
  CALENDAR: (year, month) => `calendar_v1_${year}_${String(month).padStart(2, "0")}`,
  CUSTOM_CATEGORIES: "custom_categories_v1",
  META: "meta_v1"
};

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { success: true };
  } catch (e) {
    if (e.name === "QuotaExceededError") return { success: false, error: "QUOTA_EXCEEDED" };
    return { success: false, error: "WRITE_ERROR" };
  }
}

let _onCorruptedCallback = null;

export function registerCorruptedCallback(cb) {
  _onCorruptedCallback = cb;
}

function safeGet(key) {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    backupCorrupted(key);
    if (_onCorruptedCallback) {
      try { _onCorruptedCallback(key); } catch (e) { console.warn("safeGet: corrupted callback failed:", e); }
    }
    return null;
  }
}

function backupCorrupted(key) {
  const value = localStorage.getItem(key);
  if (!value) return;
  const backupKey = `${key}_corrupted_${Date.now()}`;
  try {
    localStorage.setItem(backupKey, value);
  } catch (e) {
    // quota exceeded — skip backup, just remove corrupted key
  }
  localStorage.removeItem(key);
}

// settings_v1
export function loadSettings() {
  return safeGet(KEYS.SETTINGS);
}

export function saveSettings(settings) {
  const toSave = { ...settings, updated_at: new Date().toISOString() };
  return safeSet(KEYS.SETTINGS, toSave);
}

// 유저별 설정 (다중 계정 지원)
export function loadSettingsForUser(userId) {
  if (userId) {
    const userSettings = safeGet(KEYS.SETTINGS_USER(userId));
    if (userSettings) return userSettings;
    // 유저별 설정 없음 → 글로벌 설정 마이그레이션 (최초 1회만)
    // 이미 다른 유저가 settings_v1_u_* 키를 가지고 있으면 마이그레이션 완료 상태
    const anyUserScoped = listAllAppKeys().some(k => k.startsWith("settings_v1_u_"));
    if (anyUserScoped) return null; // 다른 유저 존재 → 새 유저는 초기 설정부터
    const globalSettings = safeGet(KEYS.SETTINGS);
    if (globalSettings) {
      // 레거시 글로벌 설정 → 첫 유저가 소유권 획득
      globalSettings._owner_id = userId;
      safeSet(KEYS.SETTINGS_USER(userId), globalSettings);
      return globalSettings;
    }
    return null;
  }
  return safeGet(KEYS.SETTINGS);
}

export function saveSettingsForUser(userId, settings) {
  const toSave = { ...settings, updated_at: new Date().toISOString() };
  if (userId) {
    return safeSet(KEYS.SETTINGS_USER(userId), toSave);
  }
  return safeSet(KEYS.SETTINGS, toSave);
}

// calendar_v1_YYYY_MM
export function loadCalendarMonth(year, month) {
  const key = KEYS.CALENDAR(year, month);
  const data = safeGet(key);
  if (data) return data;
  return {
    year, month,
    cells: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  };
}

export function saveCalendarMonth(calendar) {
  const key = KEYS.CALENDAR(calendar.year, calendar.month);
  const toSave = { ...calendar, updated_at: new Date().toISOString() };
  return safeSet(key, toSave);
}

// custom_categories_v1
export function loadCustomCategories() {
  const data = safeGet(KEYS.CUSTOM_CATEGORIES);
  return data?.categories ?? [];
}

export function saveCustomCategories(categories) {
  return safeSet(KEYS.CUSTOM_CATEGORIES, { categories, version: 1 });
}

// meta_v1
export function loadMeta() {
  return safeGet(KEYS.META);
}

export function saveMeta(meta) {
  return safeSet(KEYS.META, meta);
}

export function initMetaIfNeeded() {
  if (!loadMeta()) {
    saveMeta({
      first_used_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      current_view_month: getTodayYearMonth(),
      app_version: APP_VERSION,
      schema_version: 1
    });
  }
}

function getTodayYearMonth() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
}

// 키 관리
export const APP_KEY_PATTERNS = {
  exact: ["settings_v1", "custom_categories_v1", "meta_v1", "family_context_v1", "family_accounts_v1", "device_id_v1", "submitted_claims_v1", "theme_v1", "user_accounts_v1", "auth_migrated_v1", "user_prefs_v1", "pin_reset_requests_v1", "migration_done_v1"],
  prefix: ["calendar_v1_", "mock_kv:", "settings_v1_u_"],
  contains: ["_corrupted_"]
};

export function isAppKey(key) {
  if (APP_KEY_PATTERNS.exact.includes(key)) return true;
  if (APP_KEY_PATTERNS.prefix.some(p => key.startsWith(p))) return true;
  if (APP_KEY_PATTERNS.contains.some(p => key.includes(p))) return true;
  return false;
}

export function listAllAppKeys() {
  return Object.keys(localStorage).filter(isAppKey);
}

export function cleanupOldCalendars(retainMonths = 6, { dryRun = false } = {}) {
  if (retainMonths < 1) retainMonths = 1;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - retainMonths, 1);

  const toDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith("calendar_v1_")) continue;
    const match = k.match(/^calendar_v1_(\d{4})_(\d{2})$/);
    if (!match) continue;
    const keyDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1);
    if (keyDate < start) toDelete.push(k);
  }

  if (!dryRun) {
    toDelete.forEach(k => localStorage.removeItem(k));
  }
  return { deletedCount: toDelete.length, deletedKeys: toDelete };
}

export function resetAllData() {
  listAllAppKeys().forEach(k => localStorage.removeItem(k));
}

export function getStorageUsage() {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    // Only count app-specific keys to avoid inflating usage with third-party data
    if (!isAppKey(key)) continue;
    used += key.length + (localStorage.getItem(key)?.length ?? 0);
  }
  const TOTAL = 5 * 1024 * 1024;
  return { used, total: TOTAL, percent: (used / TOTAL) * 100 };
}

export function isStorageAvailable() {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "x");
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}
