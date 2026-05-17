// src/utils/exportImport.js
import { APP_VERSION } from "../constants/appVersion";

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

  if (mode === "overwrite") {
    Object.keys(localStorage)
      .filter(k =>
        k === "settings_v1" || k === "meta_v1" || k === "custom_categories_v1" ||
        k.startsWith("calendar_v1_")
      )
      .filter(k => !k.includes("_corrupted_"))
      .forEach(k => localStorage.removeItem(k));
  }

  if (data.settings && (mode === "overwrite" || !localStorage.getItem("settings_v1"))) {
    localStorage.setItem("settings_v1", JSON.stringify(data.settings));
    result.applied.settings = 1;
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

  Object.entries(data.calendars).forEach(([ym, cal]) => {
    const [y, m] = ym.split("-");
    const key = `calendar_v1_${y}_${m}`;
    if (mode === "overwrite" || !localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(cal));
      result.applied.calendars++;
    }
  });

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
