// src/utils/diagnostics.js
import { listAllAppKeys } from "./storage";

export function checkDataStatus() {
  return listAllAppKeys().map(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return { key, valid: false, size: 0, error: "키 없음" };
    const size = raw.length;
    try {
      const data = JSON.parse(raw);
      let itemCount;
      if (key.startsWith("calendar_v1_")) {
        const cells = Object.values(data.cells || {});
        itemCount = cells.reduce((s, c) => s + (c.extra_items?.length || 0), 0);
      } else if (key === "custom_categories_v1") {
        itemCount = data.categories?.length || 0;
      }
      return { key, valid: true, size, itemCount };
    } catch (e) {
      return { key, valid: false, size, error: e.message };
    }
  });
}

export function getSystemInfo() {
  const meta = JSON.parse(localStorage.getItem("meta_v1") || "{}");
  const firstDate = meta.first_used_at ? new Date(meta.first_used_at) : null;
  const today = new Date();
  const daysSince = firstDate
    ? Math.floor((today - firstDate) / (1000 * 60 * 60 * 24))
    : 0;
  return {
    appVersion: "1.0.0",
    schemaVersion: 1,
    firstUsedAt: meta.first_used_at,
    lastUsedAt: meta.last_used_at,
    daysSinceFirstUse: daysSince,
    userAgent: navigator.userAgent
  };
}

/**
 * 손상된 키를 가장 최근 백업으로 복구
 */
export function recoverFromBackup(originalKey) {
  const backupKeys = Object.keys(localStorage)
    .filter(k => k.startsWith(originalKey + "_corrupted_"))
    .sort();

  if (backupKeys.length === 0) {
    return { success: false, error: "NO_BACKUP" };
  }

  const mostRecent = backupKeys[backupKeys.length - 1];
  const raw = localStorage.getItem(mostRecent);

  if (!raw) {
    return { success: false, error: "BACKUP_EMPTY" };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { success: false, error: "PARSE_FAILED" };
  }

  try {
    localStorage.setItem(originalKey, JSON.stringify(parsed));
    localStorage.removeItem(mostRecent);
    return { success: true, restoredFrom: mostRecent };
  } catch (e) {
    return { success: false, error: "RESTORE_FAILED" };
  }
}

/**
 * 손상 백업 키 삭제
 */
export function discardBackup(backupKey) {
  if (!backupKey.includes("_corrupted_")) {
    return { success: false, error: "NOT_BACKUP_KEY" };
  }
  localStorage.removeItem(backupKey);
  return { success: true };
}
