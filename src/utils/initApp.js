// src/utils/initApp.js
import {
  loadSettings, loadSettingsForUser, loadMeta, initMetaIfNeeded,
  isStorageAvailable, listAllAppKeys
} from "./storage";
import { loadHolidays } from "./holidays";
import { loadFamilyContext } from "./familyContext";
import { loadUserAccounts, getActiveUser, findUserById, migrateFromLegacyAccounts, migrateToPasswordAuth, isOnboardingDeferred } from "./authStore";
import { loadUserPrefs, applyPrefs } from "./userPrefs";
import { recoverFromCrashedImport } from "./exportImport";
import { showToast } from "./toastManager";

/**
 * Phase-2 키 마이그레이션: 글로벌 키 → 스코프드 키
 * 한 번만 실행 (phase2_migrated_v1 플래그로 제어)
 */
function migratePhase2Keys() {
  if (localStorage.getItem("phase2_migrated_v1")) return;

  const activeUser = getActiveUser();
  const familyCtx = loadFamilyContext();

  // Migrate notifications
  const oldNotifs = localStorage.getItem("notifications_v1");
  if (oldNotifs && activeUser) {
    const newKey = "notifications_v1_u_" + activeUser;
    if (!localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldNotifs);
    }
    localStorage.removeItem("notifications_v1");
  }

  // Migrate badges
  const oldBadges = localStorage.getItem("badges_earned_v1");
  if (oldBadges && activeUser) {
    const newKey = "badges_earned_v1_u_" + activeUser;
    if (!localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldBadges);
    }
    localStorage.removeItem("badges_earned_v1");
  }

  // Migrate chores, chore_log, auto_grant_*, qna
  if (familyCtx?.family_id) {
    const fid = familyCtx.family_id;
    const migrations = [
      ["chores_v1", "chores_v1_f_" + fid],
      ["chore_log_v1", "chore_log_v1_f_" + fid],
      ["auto_grant_schedules_v1", "auto_grant_schedules_v1_f_" + fid],
      ["auto_grant_last_run_v1", "auto_grant_last_run_v1_f_" + fid],
      ["qna_v1", "qna_v1_f_" + fid],
    ];
    migrations.forEach(([oldKey, newKey]) => {
      const old = localStorage.getItem(oldKey);
      if (old && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, old);
      }
      localStorage.removeItem(oldKey);
    });
  }

  // 활성 유저가 있을 때만 마이그레이션 완료 플래그 설정
  // familyCtx만 있고 activeUser가 없으면 user-scoped 데이터(알림/배지)가 영구 유실될 수 있음
  if (activeUser) {
    localStorage.setItem("phase2_migrated_v1", "1");
  }
}

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

  // 1.5a. 이전 import 중 크래시 발생 시 백업 복원
  recoverFromCrashedImport();

  // 1.5b. 레거시 계정 마이그레이션 (스토리지 확인 후)
  migrateFromLegacyAccounts();

  // 1.5c. PIN → 비밀번호 인증 마이그레이션
  const migrationResult = await migrateToPasswordAuth();

  // 1.6. Phase-2 키 마이그레이션 (글로벌 → 스코프드)
  migratePhase2Keys();

  // 2. holidays.json 로드 (실패는 fatal 아님)
  let holidays = {};
  try {
    holidays = await loadHolidays();
  } catch (e) {
    console.warn("[initApp] holidays.json 로드 실패:", e);
    showToast({ type: "warning", message: "공휴일 데이터를 불러오지 못했습니다. 새로고침하면 다시 시도합니다.", duration: 6000 });
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
      return { status: "ok", settings: null, holidays, familyContext, authenticated, activeUser, migrationResult };
    }
    return { status: "first_use", holidays, familyContext, authenticated, activeUser, migrationResult };
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

  return { status: "ok", settings, meta, holidays, familyContext, authenticated, activeUser, migrationResult };
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
      // 인증 게이트: 로그인 안 된 상태 → 항상 로그인 화면 (회원가입 버튼 포함)
      if (!result.authenticated) {
        return "login";
      }
      // 인증 완료 후 화면 분기 — 계정 유형(role) 기반
      {
        const activeUser = result.activeUser || findUserById(getActiveUser());
        if (activeUser?.role === "general") return "main_general";
      }
      if (!result.familyContext) {
        const activeUser = result.activeUser || findUserById(getActiveUser());
        // 부모/자녀 계정은 가족 온보딩 필요 (연기한 경우 메인으로)
        if (activeUser?.role === "parent" || activeUser?.role === "child") {
          return isOnboardingDeferred() ? "main" : "family_onboarding";
        }
        // 일반 계정: settings 없으면 초기 설정
        return result.settings ? "main" : "welcome_modal";
      }
      if (result.familyContext.member_role === "parent") return "main_parent";
      return "main";
    default: return "welcome_modal";
  }
}
