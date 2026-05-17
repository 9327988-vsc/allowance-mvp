// src/components/App.jsx
import { useEffect, useState } from "react";
import { initApp, nextScreen } from "../utils/initApp";
import { registerCorruptedCallback, cleanupOldCalendars } from "../utils/storage";
import { showToast } from "../utils/toastManager";
import ToastContainer from "./widgets/ToastContainer";
import Splash from "./Splash";
import SettingsModal from "./modals/SettingsModal";
import MainScreen from "./MainScreen";
import DiagnosticScreen from "./modals/DiagnosticScreen";
import ExportModal from "./modals/ExportModal";
import ImportModal from "./modals/ImportModal";
import CleanupConfirmModal from "./modals/CleanupConfirmModal";
import ResetAllDataModal from "./modals/ResetAllDataModal";
import CategoryManager from "./drawers/CategoryManager";
import PinResetModal from "./modals/PinResetModal";
import StorageDisabledModal from "./modals/StorageDisabledModal";
import DataCorruptedModal from "./modals/DataCorruptedModal";
import FamilyOnboardingModal from "./modals/FamilyOnboardingModal";
import ParentMainScreen from "./ParentMainScreen";
import GeneralMainScreen from "./GeneralMainScreen";
import LoginScreen from "./LoginScreen";
import SignupScreen from "./SignupScreen";
import { loadFamilyContext, saveFamilyContext, clearFamilyContext } from "../utils/familyContext";
import { setActiveUser, findUserById, clearActiveUser, updateUserFamilyContext, getActiveUser } from "../utils/authStore";
import { loadUserPrefs, applyPrefs, clearPrefsOverrides } from "../utils/userPrefs";

function isAdminMode() {
  if (!import.meta.env.DEV) return false;
  return new URLSearchParams(window.location.search).get("admin") === "1";
}

export default function App() {
  const [boot, setBoot] = useState(null);
  const [adminMode, setAdminMode] = useState(isAdminMode);
  const [diagKey, setDiagKey] = useState(0);
  // 관리자 모달 상태
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCleanup, setShowCleanup] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showPinManage, setShowPinManage] = useState(false);

  // 9.1 콘솔 디버그용: window.openAdmin() — DEV 전용
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.openAdmin = () => setAdminMode(true);
      return () => { delete window.openAdmin; };
    }
  }, []);

  // 1. 부팅 처리
  useEffect(() => {
    initApp().then(setBoot);
  }, []);

  // 2. 손상 콜백 등록
  useEffect(() => {
    registerCorruptedCallback((key) => {
      if (key.startsWith("calendar_v1_")) {
        const match = key.match(/calendar_v1_(\d{4})_(\d{2})/);
        if (match) {
          showToast({
            type: "warning",
            message: `⚠ ${match[1]}-${match[2]} 데이터가 손상되어 백업되었습니다. 관리자에게 문의하세요.`,
            duration: 0
          });
        }
      }
    });
  }, []);

  // BTN-A-001: 일반 모드로 돌아가기
  function handleBackToNormal() {
    const url = new URL(window.location);
    url.searchParams.delete("admin");
    window.history.replaceState({}, "", url.pathname);
    setAdminMode(false);
  }

  // BTN-A-005: 오래된 데이터 정리 (dry-run 먼저)
  function handleCleanupClick() {
    const dryResult = cleanupOldCalendars(6, { dryRun: true });
    if (dryResult.deletedCount === 0) {
      showToast({ type: "warning", message: "정리할 데이터가 없습니다", duration: 4000 });
      return;
    }
    setShowCleanup(true);
  }

  // 3. 부팅 중 표시
  if (!boot) return (
    <>
      <Splash />
      <ToastContainer />
    </>
  );

  // 4-A. 관리자 모드
  if (adminMode) {
    return (
      <>
        <DiagnosticScreen
          key={diagKey}
          onBack={handleBackToNormal}
          onExport={() => setShowExport(true)}
          onImport={() => setShowImport(true)}
          onCategoryManage={() => setShowCategoryManager(true)}
          onCleanup={handleCleanupClick}
          onReset={() => setShowReset(true)}
          onPinManage={() => setShowPinManage(true)}
        />
        {showExport && <ExportModal onClose={() => setShowExport(false)} />}
        {showImport && (
          <ImportModal
            onClose={() => setShowImport(false)}
            onImported={() => { initApp().then(setBoot); setDiagKey(k => k + 1); }}
          />
        )}
        {showCleanup && (
          <CleanupConfirmModal
            onClose={() => setShowCleanup(false)}
            onCleaned={() => setDiagKey(k => k + 1)}
          />
        )}
        {showReset && <ResetAllDataModal onClose={() => setShowReset(false)} />}
        {showCategoryManager && <CategoryManager onClose={() => setShowCategoryManager(false)} />}
        {showPinManage && <PinResetModal onClose={() => setShowPinManage(false)} />}
        <ToastContainer />
      </>
    );
  }

  // 인증 완료 콜백
  function handleAuthComplete(userId) {
    setActiveUser(userId);
    const user = findUserById(userId);
    // 유저의 family_context가 있으면 familyContext에 반영
    if (user?.family_context) {
      saveFamilyContext(user.family_context);
    }
    // 유저별 맞춤 설정 적용
    applyPrefs(loadUserPrefs(userId));
    initApp().then(setBoot);
  }

  // 로그아웃 콜백
  function handleLogout() {
    clearActiveUser();
    clearFamilyContext();
    clearPrefsOverrides();
    initApp().then(setBoot);
  }

  // 온보딩 완료 콜백 (가족 가입 후 앱 재부팅)
  function handleFamilyJoined() {
    // user 계정에 familyContext 동기화
    const ctx = loadFamilyContext();
    const activeId = getActiveUser();
    if (ctx && activeId) {
      updateUserFamilyContext(activeId, ctx);
    }
    // 새 계정을 저장 목록에 추가 후 앱 재부팅
    import("../utils/accountSwitcher").then(({ saveCurrentAccount }) => {
      saveCurrentAccount();
      initApp().then(setBoot);
    }).catch(() => { /* 모듈 로드 실패 시 무시 */ });
  }

  // 4-B. 일반 모드 화면 분기
  const screen = nextScreen(boot);
  let content;
  if (screen === "storage_disabled_modal") {
    content = <StorageDisabledModal onRecovered={(result) => setBoot(result)} />;
  } else if (screen === "corrupted_modal") {
    content = <DataCorruptedModal
      onResetSettings={() => setBoot({ status: "first_use", authenticated: true })}
      onRecovered={() => initApp().then(setBoot)}
    />;
  } else if (boot._forceSignup) {
    content = <SignupScreen onComplete={handleAuthComplete} onBack={() => setBoot({ ...boot, _forceSignup: false })} />;
  } else if (screen === "login") {
    content = <LoginScreen
      onComplete={handleAuthComplete}
      onNewAccount={() => setBoot({ ...boot, _forceSignup: true })}
      onAdmin={import.meta.env.DEV ? () => setAdminMode(true) : undefined}
    />;
  } else if (screen === "signup") {
    content = <SignupScreen onComplete={handleAuthComplete} />;
  } else if (boot._forceOnboarding) {
    // 일반 계정은 가족 온보딩 건너뛰기
    const activeUser = boot.activeUser || findUserById(getActiveUser());
    if (activeUser?.role === "general") {
      content = <GeneralMainScreen onLogout={handleLogout} />;
    } else {
      content = <FamilyOnboardingModal onComplete={handleFamilyJoined} />;
    }
  } else if (screen === "welcome_modal") {
    content = <SettingsModal mode="first" onSaved={() => {
      initApp().then(setBoot);
    }} />;
  } else if (screen === "main_parent") {
    content = <ParentMainScreen familyContext={boot.familyContext} onLogout={handleLogout} />;
  } else if (screen === "main_general") {
    content = <GeneralMainScreen onLogout={handleLogout} />;
  } else {
    content = <MainScreen
      settings={boot.settings}
      onSettingsChange={(s) => setBoot({ ...boot, settings: s })}
      familyContext={boot.familyContext}
      onLogout={handleLogout}
    />;
  }

  return (
    <>
      {content}
      <ToastContainer />
    </>
  );
}
