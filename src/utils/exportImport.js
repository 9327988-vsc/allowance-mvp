// src/utils/exportImport.js

export async function exportData(options = {}) {
  const data = {
    export_version: 1,
    exported_at: new Date().toISOString(),
    app_version: "1.0.0",
    schema_version: 1,
    calendars: {}
  };

  if (options.includeSettings !== false) {
    const s = localStorage.getItem("settings_v1");
    if (s) data.settings = JSON.parse(s);
  }
  if (options.includeMeta !== false) {
    const m = localStorage.getItem("meta_v1");
    if (m) data.meta = JSON.parse(m);
  }
  if (options.includeCategories !== false) {
    const c = localStorage.getItem("custom_categories_v1");
    if (c) data.custom_categories = JSON.parse(c);
  }
  if (options.includeCalendars !== false) {
    Object.keys(localStorage)
      .filter(k => k.startsWith("calendar_v1_") && !k.includes("_corrupted_"))
      .forEach(k => {
        const m = k.match(/calendar_v1_(\d{4})_(\d{2})/);
        if (!m) return;
        const ym = `${m[1]}-${m[2]}`;
        data.calendars[ym] = JSON.parse(localStorage.getItem(k));
      });
  }
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
  URL.revokeObjectURL(url);
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
  } catch {
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
        k.startsWith("calendar_v1_") ||
        k.includes("_corrupted_")
      )
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
      const existing = JSON.parse(localStorage.getItem("custom_categories_v1") || '{"categories":[],"version":1}');
      data.custom_categories.categories.forEach(c => {
        if (!existing.categories.some(e => e.name === c.name)) {
          existing.categories.push(c);
          result.applied.categories++;
        }
      });
      localStorage.setItem("custom_categories_v1", JSON.stringify(existing));
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
  } catch {
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
