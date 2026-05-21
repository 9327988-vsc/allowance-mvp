// src/components/App.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useModalBase } from "../hooks/useModalBase";
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
import StorageDisabledModal from "./modals/StorageDisabledModal";
import DataCorruptedModal from "./modals/DataCorruptedModal";
import FamilyOnboardingModal from "./modals/FamilyOnboardingModal";
import ParentMainScreen from "./ParentMainScreen";
import GeneralMainScreen from "./GeneralMainScreen";
import LoginScreen from "./LoginScreen";
import SignupScreen from "./SignupScreen";
import TutorialScreen from "./TutorialScreen";
import { loadFamilyContext, saveFamilyContext, clearFamilyContext } from "../utils/familyContext";
import { setActiveUser, findUserById, clearActiveUser, updateUserFamilyContext, getActiveUser } from "../utils/authStore";
import { loadUserPrefs, applyPrefs, clearPrefsOverrides } from "../utils/userPrefs";
import { resetKVAdapter } from "../utils/kvAdapter";
import { resetSpendingLimitCache } from "../utils/spendingLimit";

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
  const [showTutorial, setShowTutorial] = useState(null); // null | "child" | "parent"
  const [showTutorialPicker, setShowTutorialPicker] = useState(false);
  const tutorialPickerRef = useModalBase(() => setShowTutorialPicker(false), { active: showTutorialPicker });

  // 9.1 콘솔 디버그용: window.openAdmin() — DEV 전용
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.openAdmin = () => setAdminMode(true);
      return () => { delete window.openAdmin; };
    }
  }, []);

  // 1. 부팅 처리
  const initInProgress = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    if (initInProgress.current) return;
    initInProgress.current = true;
    initApp().then(result => { if (mountedRef.current) setBoot(result); }).finally(() => { initInProgress.current = false; });
    return () => { mountedRef.current = false; };
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

  // 인증 완료 콜백 (훅은 early return 위에 위치해야 — Rules of Hooks)
  const handleAuthComplete = useCallback((userId) => {
    if (initInProgress.current) return;
    initInProgress.current = true;
    setActiveUser(userId);
    const user = findUserById(userId);
    if (user?.family_context) {
      saveFamilyContext(user.family_context);
    }
    applyPrefs(loadUserPrefs(userId));
    initApp().then(result => { if (mountedRef.current) setBoot(result); }).finally(() => { initInProgress.current = false; });
  }, []);

  // 로그아웃 콜백
  const handleLogout = useCallback(() => {
    if (initInProgress.current) return;
    initInProgress.current = true;
    clearActiveUser();
    clearFamilyContext();
    clearPrefsOverrides();
    resetKVAdapter();
    resetSpendingLimitCache();
    initApp().then(result => { if (mountedRef.current) setBoot(result); }).finally(() => { initInProgress.current = false; });
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

  // 온보딩 완료 콜백 (가족 가입 후 앱 재부팅)
  function handleFamilyJoined() {
    const ctx = loadFamilyContext();
    const activeId = getActiveUser();
    if (ctx && activeId) {
      updateUserFamilyContext(activeId, ctx);
    }
    const role = ctx?.member_role;
    if (role === "parent" || role === "child") {
      setShowTutorial(role);
    }
    import("../utils/accountSwitcher").then(({ saveCurrentAccount }) => {
      saveCurrentAccount();
      initApp().then(result => { if (mountedRef.current) setBoot(result); });
    }).catch(() => { /* 모듈 로드 실패 시 무시 */ });
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
        />
        {showExport && <ExportModal onClose={() => setShowExport(false)} />}
        {showImport && (
          <ImportModal
            onClose={() => setShowImport(false)}
            onImported={() => { initApp().then(result => setBoot(result)); setDiagKey(k => k + 1); }}
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
        <ToastContainer />
      </>
    );
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
      onTutorial={() => setShowTutorialPicker(true)}
    />;
  } else if (screen === "signup") {
    content = <SignupScreen onComplete={handleAuthComplete} />;
  } else if (screen === "family_onboarding") {
    content = <FamilyOnboardingModal onComplete={handleFamilyJoined} />;
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
      {showTutorialPicker && (
        <div className="modal-backdrop" onClick={() => setShowTutorialPicker(false)}>
          <div ref={tutorialPickerRef} className="modal-content" style={{ maxWidth: 320, width: "85%", padding: 0 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="튜토리얼 선택">
            <div className="modal-header">
              <h2 className="modal-title">📖 튜토리얼</h2>
              <button onClick={() => setShowTutorialPicker(false)} className="modal-close" aria-label="닫기">×</button>
            </div>
            <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <button
                className="btn btn--primary"
                style={{ width: "100%", padding: "var(--space-3)" }}
                onClick={() => { setShowTutorialPicker(false); setShowTutorial("child"); }}
              >
                👦 자녀용 튜토리얼
              </button>
              <button
                className="btn btn--primary"
                style={{ width: "100%", padding: "var(--space-3)", background: "linear-gradient(135deg, var(--gradient-primary-start), var(--gradient-primary-end))" }}
                onClick={() => { setShowTutorialPicker(false); setShowTutorial("parent"); }}
              >
                👨‍👩‍👧 부모용 튜토리얼
              </button>
            </div>
          </div>
        </div>
      )}
      {showTutorial && (
        <TutorialScreen
          role={showTutorial}
          onComplete={() => setShowTutorial(null)}
        />
      )}
      <ToastContainer />
    </>
  );
}
