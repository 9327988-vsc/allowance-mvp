// src/utils/exportImport.js
import { APP_VERSION } from "../constants/appVersion";
import { getActiveUser } from "./authStore";
import { loadFamilyContext } from "./familyContext";

export async function exportData(options = {}) {
  const data = {
    export_version: 1,
    exported_at: new Date().toISOString(),
    app_version: APP_VERSION,
    schema_version: 1,
    calendars: {}
  };

  if (options.includeSettings !== false) {
    const s = localStorage.getItem("settings_v1");
    if (s) { try { data.settings = JSON.parse(s); } catch (e) { console.warn("exportData: settings parse failed:", e); } }
  }
  if (options.includeMeta !== false) {
    const m = localStorage.getItem("meta_v1");
    if (m) { try { data.meta = JSON.parse(m); } catch (e) { console.warn("exportData: meta parse failed:", e); } }
  }
  if (options.includeCategories !== false) {
    const c = localStorage.getItem("custom_categories_v1");
    if (c) { try { data.custom_categories = JSON.parse(c); } catch (e) { console.warn("exportData: categories parse failed:", e); } }
  }
  if (options.includeCalendars !== false) {
    Object.keys(localStorage)
      .filter(k => k.startsWith("calendar_v1_") && !k.includes("_corrupted_"))
      .forEach(k => {
        const m = k.match(/calendar_v1_(\d{4})_(\d{2})/);
        if (!m) return;
        try { data.calendars[`${m[1]}-${m[2]}`] = JSON.parse(localStorage.getItem(k)); } catch (e) { console.warn(`exportData: calendar ${k} parse failed:`, e); }
      });
  }
  // 2단계 데이터
  try { const familyContext = JSON.parse(localStorage.getItem("family_context_v1") || "null"); if (familyContext) data.family_context = familyContext; } catch (e) { console.warn("exportData: family_context parse failed:", e); }
  try { const submittedClaims = JSON.parse(localStorage.getItem("submitted_claims_v1") || "null"); if (submittedClaims) data.submitted_claims = submittedClaims; } catch (e) { console.warn("exportData: submitted_claims parse failed:", e); }
  try { const userPrefs = JSON.parse(localStorage.getItem("user_prefs_v1") || "null"); if (userPrefs) data.user_prefs = userPrefs; } catch (e) { console.warn("exportData: user_prefs parse failed:", e); }

  // Phase-2 scoped data (only export if valid user/family context)
  const activeUser = getActiveUser();
  const familyCtx = loadFamilyContext();
  if (activeUser) {
    // export_user_id를 기록하여 import 시 크로스유저 방지
    data.export_user_id = activeUser;
    try { const v = JSON.parse(localStorage.getItem("notifications_v1_u_" + activeUser) || "null"); if (v) data.notifications = v; } catch { /* ignored */ }
    try { const v = JSON.parse(localStorage.getItem("badges_earned_v1_u_" + activeUser) || "null"); if (v) data.badges_earned = v; } catch { /* ignored */ }
  }
  if (familyCtx?.family_id) {
    const fid = familyCtx.family_id;
    data.export_family_id = fid;
    try { const v = JSON.parse(localStorage.getItem("auto_grant_schedules_v1_f_" + fid) || "null"); if (v) data.auto_grant_schedules = v; } catch { /* ignored */ }
    try { const v = JSON.parse(localStorage.getItem("auto_grant_last_run_v1_f_" + fid) || "null"); if (v) data.auto_grant_last_run = v; } catch { /* ignored */ }
    try { const v = JSON.parse(localStorage.getItem("chores_v1_f_" + fid) || "null"); if (v) data.chores = v; } catch { /* ignored */ }
    try { const v = JSON.parse(localStorage.getItem("chore_log_v1_f_" + fid) || "null"); if (v) data.chore_log = v; } catch { /* ignored */ }
    try { const v = JSON.parse(localStorage.getItem("qna_v1_f_" + fid) || "null"); if (v) data.qna = v; } catch { /* ignored */ }
  }
  // user_accounts 포함 (인증 필드 제거하여 보안 보호)
  try {
    const v = JSON.parse(localStorage.getItem("user_accounts_v1") || "null");
    if (v) {
      data.user_accounts = (Array.isArray(v) ? v : []).map(({ pin_hash, pin_salt, pin_reset_pending, password_hash, password_salt, security_answer_hash, security_answer_salt, birth_date, ...rest }) => rest);
    }
  } catch { /* ignored */ }

  if (options.includeBackups) {
    data.backups = {};
    Object.keys(localStorage)
      .filter(k => k.includes("_corrupted_"))
      .forEach(k => { data.backups[k] = localStorage.getItem(k); });
  }

  data.checksum = "";
  data.checksum = await computeChecksum(data);

  return data;
}

export async function computeChecksum(data) {
  const sorted = sortKeysDeep({ ...data, checksum: "" });
  return sha256(JSON.stringify(sorted));
}

function sortKeysDeep(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);
  if (obj === null || typeof obj !== "object") return obj;
  const result = {};
  Object.keys(obj).sort().forEach(k => {
    result[k] = sortKeysDeep(obj[k]);
  });
  return result;
}

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function defaultExportFilename() {
  const today = new Date().toISOString().slice(0, 10);
  return `allowance-backup-${today}.json`;
}

/**
 * 앱 시작 시 호출: 이전 import 중 크래시 발생 시 백업 복원
 */
export function recoverFromCrashedImport() {
  try {
    const raw = localStorage.getItem("_import_backup_v1");
    if (!raw) return false;
    const backup = JSON.parse(raw);
    Object.keys(backup).forEach(k => {
      if (backup[k] === null) localStorage.removeItem(k);
      else localStorage.setItem(k, backup[k]);
    });
    localStorage.removeItem("_import_backup_v1");
    return true;
  } catch (e) {
    console.warn("[exportImport] restoreBackup failed:", e);
    try { localStorage.removeItem("_import_backup_v1"); } catch (e2) { console.warn("[exportImport] backup cleanup failed:", e2); }
    return false;
  }
}

export async function importData(file, mode = "overwrite") {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.warn("importData: JSON parse failed:", e);
    return { success: false, error: "INVALID_JSON" };
  }

  if (data.export_version !== 1) return { success: false, error: "VERSION_MISMATCH" };
  if (!data.calendars) return { success: false, error: "INVALID_SCHEMA" };

  const expected = data.checksum;
  const computed = await computeChecksum(data);
  if (expected !== computed) return { success: false, error: "CHECKSUM_MISMATCH" };

  const result = { success: true, applied: { settings: 0, categories: 0, calendars: 0 } };

  // Backup current localStorage state before overwrite (M-7: rollback on failure)
  // C-04: persist backup to localStorage so it survives browser crash mid-import
  let backup = null;
  if (mode === "overwrite") {
    backup = {};
    Object.keys(localStorage)
      .filter(k =>
        k === "settings_v1" || k === "meta_v1" || k === "custom_categories_v1" ||
        k.startsWith("calendar_v1_") ||
        k === "family_context_v1" || k === "submitted_claims_v1" || k === "user_prefs_v1" ||
        k === "user_accounts_v1"
      )
      .filter(k => !k.includes("_corrupted_"))
      .forEach(k => { backup[k] = localStorage.getItem(k); });

    // Also backup Phase-2 scoped keys
    const backupUser = getActiveUser();
    const backupFamilyCtx = loadFamilyContext();
    if (backupUser) {
      const nk = "notifications_v1_u_" + backupUser;
      const bk = "badges_earned_v1_u_" + backupUser;
      backup[nk] = localStorage.getItem(nk);
      backup[bk] = localStorage.getItem(bk);
    }
    if (backupFamilyCtx?.family_id) {
      const fid = backupFamilyCtx.family_id;
      ["chores_v1_f_", "chore_log_v1_f_", "auto_grant_schedules_v1_f_", "auto_grant_last_run_v1_f_", "qna_v1_f_"].forEach(prefix => {
        const k = prefix + fid;
        backup[k] = localStorage.getItem(k);
      });
    }
    // Persist backup to localStorage so it survives browser crash
    try {
      localStorage.setItem("_import_backup_v1", JSON.stringify(backup));
    } catch { /* if this fails, proceed with in-memory backup only */ }
  }

  try {
    if (mode === "overwrite") {
      Object.keys(backup).forEach(k => localStorage.removeItem(k));
    }

    if (data.settings && (mode === "overwrite" || !localStorage.getItem("settings_v1"))) {
      localStorage.setItem("settings_v1", JSON.stringify(data.settings));
      result.applied.settings = 1;
    } else if (mode === "overwrite" && !data.settings && backup && backup["settings_v1"]) {
      // Restore settings from backup if import data doesn't include settings
      localStorage.setItem("settings_v1", backup["settings_v1"]);
    }
    if (data.meta && (mode === "overwrite" || !localStorage.getItem("meta_v1"))) {
      localStorage.setItem("meta_v1", JSON.stringify(data.meta));
    }
    if (data.custom_categories) {
      if (mode === "overwrite") {
        localStorage.setItem("custom_categories_v1", JSON.stringify(data.custom_categories));
        result.applied.categories = data.custom_categories.categories?.length ?? 0;
      } else {
        let existing;
        try { existing = JSON.parse(localStorage.getItem("custom_categories_v1") || '{"categories":[],"version":1}'); } catch (e) { console.warn("importData: categories parse failed:", e); existing = { categories: [], version: 1 }; }
        (data.custom_categories.categories || []).forEach(c => {
          if (!existing.categories.some(e => e.name === c.name)) {
            existing.categories.push(c);
            result.applied.categories++;
          }
        });
        localStorage.setItem("custom_categories_v1", JSON.stringify(existing));
      }
    }
    // 2단계 데이터 복원
    if (data.family_context) {
      if (mode === "overwrite" || !localStorage.getItem("family_context_v1")) {
        localStorage.setItem("family_context_v1", JSON.stringify(data.family_context));
      }
    }
    if (data.submitted_claims) {
      if (mode === "overwrite" || !localStorage.getItem("submitted_claims_v1")) {
        localStorage.setItem("submitted_claims_v1", JSON.stringify(data.submitted_claims));
      }
    }
    if (data.user_prefs) {
      if (mode === "overwrite" || !localStorage.getItem("user_prefs_v1")) {
        localStorage.setItem("user_prefs_v1", JSON.stringify(data.user_prefs));
      }
    }

    // Phase-2 scoped data restore
    // 크로스유저 방지: export_user_id가 현재 유저와 다르면 개인 데이터(알림/배지)를 건너뜀
    const importUserId = getActiveUser();
    const importFamilyCtx = loadFamilyContext();
    const importFamilyId = importFamilyCtx?.family_id;
    const sameUser = !data.export_user_id || data.export_user_id === importUserId;
    if (importUserId && sameUser) {
      if (data.notifications) {
        const k = "notifications_v1_u_" + importUserId;
        if (mode === "overwrite" || !localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(data.notifications));
      }
      if (data.badges_earned) {
        const k = "badges_earned_v1_u_" + importUserId;
        if (mode === "overwrite" || !localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(data.badges_earned));
      }
    }
    const sameFamily = !data.export_family_id || data.export_family_id === importFamilyId;
    if (importFamilyId && sameFamily) {
      if (data.auto_grant_schedules) {
        const k = "auto_grant_schedules_v1_f_" + importFamilyId;
        if (mode === "overwrite" || !localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(data.auto_grant_schedules));
      }
      if (data.auto_grant_last_run) {
        const k = "auto_grant_last_run_v1_f_" + importFamilyId;
        if (mode === "overwrite" || !localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(data.auto_grant_last_run));
      }
      if (data.chores) {
        const k = "chores_v1_f_" + importFamilyId;
        if (mode === "overwrite" || !localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(data.chores));
      }
      if (data.chore_log) {
        const k = "chore_log_v1_f_" + importFamilyId;
        if (mode === "overwrite" || !localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(data.chore_log));
      }
      if (data.qna) {
        const k = "qna_v1_f_" + importFamilyId;
        if (mode === "overwrite" || !localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(data.qna));
      }
    }
    // user_accounts 복원 (크로스유저 방지: export_user_id가 현재 유저 목록에 있을 때만)
    if (data.user_accounts) {
      const currentAccounts = JSON.parse(localStorage.getItem("user_accounts_v1") || "[]");
      const currentUserIds = new Set(currentAccounts.map(a => a.user_id));
      const hasOverlap = !data.export_user_id || currentUserIds.has(data.export_user_id) || currentUserIds.size === 0;
      if (hasOverlap && (mode === "overwrite" || !localStorage.getItem("user_accounts_v1"))) {
        const authFieldMap = {};
        currentAccounts.forEach(a => {
          if (a.password_hash) authFieldMap[a.user_id] = a;
        });
        const merged = data.user_accounts.map(imported => {
          const existing = authFieldMap[imported.user_id];
          if (existing && !imported.password_hash) {
            return {
              ...imported,
              password_hash: existing.password_hash,
              password_salt: existing.password_salt,
              security_answer_hash: existing.security_answer_hash,
              security_answer_salt: existing.security_answer_salt,
              security_question: existing.security_question || imported.security_question,
            };
          }
          return imported;
        });
        localStorage.setItem("user_accounts_v1", JSON.stringify(merged));
        const hasAnyAuth = merged.some(a => a.password_hash);
        if (!hasAnyAuth) {
          localStorage.removeItem("auth_password_migrated_v1");
        }
      }
    }

    Object.entries(data.calendars).forEach(([ym, cal]) => {
      const [y, m] = ym.split("-");
      const key = `calendar_v1_${y}_${m}`;
      if (mode === "overwrite" || !localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(cal));
        result.applied.calendars++;
      }
    });
  } catch (e) {
    // Restore from backup on failure
    if (backup) {
      Object.keys(backup).forEach(k => {
        if (backup[k] === null) {
          localStorage.removeItem(k);
        } else {
          localStorage.setItem(k, backup[k]);
        }
      });
    }
    try { localStorage.removeItem("_import_backup_v1"); } catch { /* ignored */ }
    return { success: false, error: "IMPORT_WRITE_FAILED" };
  }

  // Clear backup on success
  backup = null;
  try { localStorage.removeItem("_import_backup_v1"); } catch { /* ignored */ }
  return result;
}

/**
 * 파일 검증 (가져오기 전 미리보기용)
 */
export async function validateImportFile(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.warn("validateImportFile: JSON parse failed:", e);
    return { valid: false, error: "INVALID_JSON" };
  }

  if (data.export_version !== 1) return { valid: false, error: "VERSION_MISMATCH", version: data.export_version };
  if (!data.calendars) return { valid: false, error: "INVALID_SCHEMA" };

  const expected = data.checksum;
  const computed = await computeChecksum(data);
  if (expected !== computed) return { valid: false, error: "CHECKSUM_MISMATCH" };

  return {
    valid: true,
    data,
    summary: {
      settings: data.settings ? 1 : 0,
      categories: data.custom_categories?.categories?.length ?? 0,
      calendars: Object.keys(data.calendars).length,
      exportedAt: data.exported_at,
    }
  };
}
