// src/utils/storage.js

const KEYS = {
  SETTINGS: "settings_v1",
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
      try { _onCorruptedCallback(key); } catch {}
    }
    return null;
  }
}

function backupCorrupted(key) {
  const value = localStorage.getItem(key);
  if (!value) return;
  const backupKey = `${key}_corrupted_${Date.now()}`;
  localStorage.setItem(backupKey, value);
  localStorage.removeItem(key);
}

// settings_v1
export function loadSettings() {
  return safeGet(KEYS.SETTINGS);
}

export function saveSettings(settings) {
  settings.updated_at = new Date().toISOString();
  return safeSet(KEYS.SETTINGS, settings);
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
  calendar.updated_at = new Date().toISOString();
  return safeSet(key, calendar);
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
      app_version: "1.0.0",
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
  exact: ["settings_v1", "custom_categories_v1", "meta_v1"],
  prefix: ["calendar_v1_"],
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
