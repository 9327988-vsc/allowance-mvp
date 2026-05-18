// src/utils/diagnostics.js
import { listAllAppKeys } from "./storage";
import { APP_VERSION } from "../constants/appVersion";

export function checkDataStatus() {
  return listAllAppKeys().map(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return { key, valid: false, size: 0, error: "키 없음" };
    const size = (key.length + raw.length) * 2; // UTF-16: 문자당 2바이트
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
  let meta;
  try { meta = JSON.parse(localStorage.getItem("meta_v1") || "{}"); } catch (e) { console.warn("getSystemInfo: meta parse failed:", e); meta = {}; }
  const firstDate = meta.first_used_at ? new Date(meta.first_used_at) : null;
  const today = new Date();
  const rawDays = firstDate
    ? Math.floor((today - firstDate) / (1000 * 60 * 60 * 24))
    : 0;
  const daysSince = Number.isNaN(rawDays) ? 0 : Math.max(0, rawDays);
  return {
    appVersion: APP_VERSION,
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
    .sort((a, b) => {
      const ta = parseInt(a.match(/(\d+)$/)?.[1] || "0", 10);
      const tb = parseInt(b.match(/(\d+)$/)?.[1] || "0", 10);
      return tb - ta;
    });

  if (backupKeys.length === 0) {
    return { success: false, error: "NO_BACKUP" };
  }

  // backupKeys는 내림차순 정렬 — [0]이 가장 최근
  const mostRecent = backupKeys[0];
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

    // 보존 정책: 키 접두사별 최신 3개만 유지, 나머지 삭제
    _enforceBackupRetention(originalKey);

    return { success: true, restoredFrom: mostRecent };
  } catch (e) {
    return { success: false, error: "RESTORE_FAILED" };
  }
}

/**
 * 보존 정책: 키 접두사별 최신 corrupted 백업 3개만 유지
 */
const MAX_CORRUPTED_BACKUPS = 3;

function _enforceBackupRetention(originalKey) {
  const remaining = Object.keys(localStorage)
    .filter(k => k.startsWith(originalKey + "_corrupted_"))
    .sort((a, b) => {
      const ta = parseInt(a.match(/(\d+)$/)?.[1] || "0", 10);
      const tb = parseInt(b.match(/(\d+)$/)?.[1] || "0", 10);
      return tb - ta;
    });

  // 최신 3개 이후는 삭제
  remaining.slice(MAX_CORRUPTED_BACKUPS).forEach(k => {
    localStorage.removeItem(k);
  });
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
