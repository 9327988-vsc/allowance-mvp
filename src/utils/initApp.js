// src/utils/initApp.js
import {
  loadSettings, loadSettingsForUser, loadMeta, initMetaIfNeeded,
  isStorageAvailable, listAllAppKeys
} from "./storage";
import { loadHolidays } from "./holidays";
import { loadFamilyContext } from "./familyContext";
import { loadUserAccounts, getActiveUser, findUserById, migrateFromLegacyAccounts } from "./authStore";
import { loadUserPrefs, applyPrefs } from "./userPrefs";

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

  // 1.5. 레거시 계정 마이그레이션 (스토리지 확인 후)
  migrateFromLegacyAccounts();

  // 2. holidays.json 로드 (실패는 fatal 아님)
  let holidays = {};
  try {
    holidays = await loadHolidays();
  } catch (e) {
    console.warn("[initApp] holidays.json 로드 실패:", e);
  }

  // 3. settings 로드 (인증된 유저가 있으면 유저별 설정 우선)
  const activeUserId = getActiveUser();
  const activeUser = activeUserId ? findUserById(activeUserId) : null;
  const settings = activeUserId ? loadSettingsForUser(activeUserId) : loadSettings();

  if (!settings) {
    const corruptedKeys = listAllAppKeys().filter(k => k.includes("_corrupted_"));
    if (corruptedKeys.length > 0) {
      return { status: "settings_corrupted", corruptedKeys, holidays };
    }
    const familyContext = loadFamilyContext();
    const authenticated = !!activeUserId;
    // 일반계정은 settings 없이도 정상 부팅 (ok 상태로 반환)
    if (activeUser?.role === "general") {
      return { status: "ok", settings: null, holidays, familyContext, authenticated, activeUser };
    }
    return { status: "first_use", holidays, familyContext, authenticated, activeUser };
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

  // 5. 가족 컨텍스트 로드 (2단계)
  const familyContext = loadFamilyContext();

  // 6. 인증 상태 + 맞춤 설정 적용
  const authenticated = !!activeUserId;
  if (authenticated) {
    applyPrefs(loadUserPrefs(activeUserId));
  }

  return { status: "ok", settings, meta, holidays, familyContext, authenticated, activeUser };
}

/**
 * 부팅 결과 → 표시할 화면 결정
 * 2단계: familyContext 기반 분기 추가
 */
/**
 * 로컬 데이터 → 서버 마이그레이션 프롬프트 표시 여부
 * D-2: kvAdapter.migrateFromLocal 엔드포인트 존재하지만 UI에서 호출하지 않음
 */
export function shouldShowMigrationPrompt() {
  const ctx = loadFamilyContext();
  if (!ctx) return false;
  const migrated = localStorage.getItem("migration_done_v1");
  if (migrated) return false;
  // Check if there's local data
  const hasLocalData = localStorage.getItem("settings_v1") || localStorage.getItem("calendar_v1_2026_01");
  return !!hasLocalData;
}

/**
 * 부팅 결과 → 표시할 화면 결정
 * 2단계: familyContext 기반 분기 추가
 */
export function nextScreen(result) {
  switch (result.status) {
    case "storage_disabled": return "storage_disabled_modal";
    case "settings_corrupted": return "corrupted_modal";
    case "first_use":
    case "ok":
      // 인증 게이트: 로그인 안 된 상태
      if (!result.authenticated) {
        if (loadUserAccounts().length > 0) return "login";
        return "signup";
      }
      // 인증 완료 후 화면 분기 — 계정 유형(role) 기반
      {
        const activeUser = result.activeUser || findUserById(getActiveUser());
        if (activeUser?.role === "general") return "main_general";
      }
      if (!result.familyContext) {
        // 자녀 계정: settings 없으면 초기 설정
        return result.settings ? "main" : "welcome_modal";
      }
      if (result.familyContext.member_role === "parent") return "main_parent";
      return "main";
    default: return "welcome_modal";
  }
}
