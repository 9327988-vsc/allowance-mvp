// src/utils/initApp.js
import {
  loadSettings, loadMeta, initMetaIfNeeded,
  isStorageAvailable, listAllAppKeys
} from "./storage";
import { loadHolidays } from "./holidays";

/**
 * 앱 부팅 (v3.2: async + holidays.json 로드 포함)
 *
 * 흐름:
 *  1. localStorage 사용 가능 여부 검사
 *  2. holidays.json fetch (실패해도 앱은 동작)
 *  3. settings_v1 로드
 *  4. meta_v1 갱신 (last_used_at)
 *
 * @returns {Promise<BootResult>}
 */
export async function initApp() {
  // 1. 스토리지 사용 가능?
  if (!isStorageAvailable()) {
    return { status: "storage_disabled" };
  }

  // 2. holidays.json 로드 (실패는 fatal 아님)
  let holidays = {};
  try {
    holidays = await loadHolidays();
  } catch (e) {
    console.warn("[initApp] holidays.json 로드 실패:", e);
  }

  // 3. settings 로드
  const settings = loadSettings();

  if (!settings) {
    const corruptedKeys = listAllAppKeys().filter(k => k.includes("settings_v1_corrupted_"));
    if (corruptedKeys.length > 0) {
      return { status: "settings_corrupted", corruptedKeys, holidays };
    }
    return { status: "first_use", holidays };
  }

  // 4. meta 보장 + 갱신
  initMetaIfNeeded();
  const meta = loadMeta();
  if (meta) {
    meta.last_used_at = new Date().toISOString();
    try {
      localStorage.setItem("meta_v1", JSON.stringify(meta));
    } catch (e) {
      // 메타 갱신 실패는 무시
    }
  }

  return { status: "ok", settings, meta, holidays };
}

/**
 * 부팅 결과 → 표시할 화면 결정
 */
export function nextScreen(result) {
  switch (result.status) {
    case "ok": return "main";
    case "first_use": return "welcome_modal";
    case "storage_disabled": return "storage_disabled_modal";
    case "settings_corrupted": return "corrupted_modal";
    default: return "welcome_modal";
  }
}
