// src/utils/familyContext.js — 가족 컨텍스트 localStorage 관리 (4.7)

const STORAGE_KEY = "family_context_v1";

/**
 * @typedef {Object} FamilyContextData
 * @property {string} family_id
 * @property {string} family_code
 * @property {string} member_id
 * @property {"child"|"parent"} member_role
 * @property {string} member_display_name
 * @property {string} joined_at
 */

/**
 * @returns {FamilyContextData|null}
 */
export function loadFamilyContext() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("loadFamilyContext: parse failed:", e);
    // 손상된 데이터 백업 후 제거 (raw를 재사용하여 이중 읽기 방지)
    try {
      if (raw) {
        localStorage.setItem(`${STORAGE_KEY}_corrupted_${Date.now()}`, raw);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e2) { console.warn("loadFamilyContext: backup failed:", e2); }
    return null;
  }
}

/**
 * @param {FamilyContextData} ctx
 */
export function saveFamilyContext(ctx) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
    return true;
  } catch (e) {
    console.error("Failed to save family context:", e);
    return false;
  }
}

export function clearFamilyContext() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isInFamily() {
  return loadFamilyContext() !== null;
}
