// src/components/App.jsx
import { useEffect, useState, useRef, useCallback, lazy, Suspense } from "react";
import { useModalBase } from "../hooks/useModalBase";
import { initApp, nextScreen } from "../utils/initApp";
import { registerCorruptedCallback, cleanupOldCalendars } from "../utils/storage";
import { showToast } from "../utils/toastManager";
import ToastContainer from "./widgets/ToastContainer";
import OfflineBanner from "./widgets/OfflineBanner";
import Splash from "./Splash";
import LoginScreen from "./LoginScreen";
import MainScreen from "./MainScreen";
import { loadFamilyContext, saveFamilyContext, clearFamilyContext } from "../utils/familyContext";
import { setActiveUser, findUserById, clearActiveUser, updateUserFamilyContext, getActiveUser, clearOnboardingDeferred, loadUserAccounts } from "../utils/authStore";
import { loadUserPrefs, applyPrefs, clearPrefsOverrides } from "../utils/userPrefs";
import { resetKVAdapter } from "../utils/kvAdapter";
import { resetSpendingLimitCache } from "../utils/spendingLimit";
import { downloadFamilyData, downloadUserData, uploadFamilyData, uploadUserData } from "../utils/dataSync";

const SettingsModal = lazy(() => import("./modals/SettingsModal"));
const DiagnosticScreen = lazy(() => import("./modals/DiagnosticScreen"));
const ExportModal = lazy(() => import("./modals/ExportModal"));
const ImportModal = lazy(() => import("./modals/ImportModal"));
const CleanupConfirmModal = lazy(() => import("./modals/CleanupConfirmModal"));
const ResetAllDataModal = lazy(() => import("./modals/ResetAllDataModal"));
const CategoryManager = lazy(() => import("./drawers/CategoryManager"));
const StorageDisabledModal = lazy(() => import("./modals/StorageDisabledModal"));
const DataCorruptedModal = lazy(() => import("./modals/DataCorruptedModal"));
const FamilyOnboardingModal = lazy(() => import("./modals/FamilyOnboardingModal"));
const ParentMainScreen = lazy(() => import("./ParentMainScreen"));
const GeneralMainScreen = lazy(() => import("./GeneralMainScreen"));
const SignupScreen = lazy(() => import("./SignupScreen"));
const TutorialScreen = lazy(() => import("./TutorialScreen"));
const PasswordMigrationInfoModal = lazy(() => import("./modals/PasswordMigrationInfoModal"));

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
  const [showMigrationInfo, setShowMigrationInfo] = useState(null);
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
    initApp().then(async result => {
      if (!mountedRef.current) return;
      const ctx = loadFamilyContext();
      const uid = getActiveUser();
      const user = uid ? findUserById(uid) : null;
      if (ctx?.family_code) {
        await uploadFamilyData(ctx.family_code).catch(e => console.warn("[App] boot family upload:", e));
      }
      if (user?.username) {
        await uploadUserData(user.username).catch(e => console.warn("[App] boot user upload:", e));
      }
      setBoot(result);
      if (result.migrationResult?.migrated) {
        setShowMigrationInfo(result.migrationResult.accounts);
      }
    }).finally(() => { initInProgress.current = false; });
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

  // 3. 데이터 동기화: 탭 떠날 때 업로드, 돌아올 때 다운로드
  useEffect(() => {
    function handleVisibility() {
      const ctx = loadFamilyContext();
      if (!ctx?.family_code) return;
      const user = findUserById(getActiveUser());
      if (document.visibilityState === "hidden") {
        uploadFamilyData(ctx.family_code).catch(e => console.warn("[App] vis upload:", e));
        if (user?.username) uploadUserData(user.username).catch(e => console.warn("[App] vis user upload:", e));
      } else if (document.visibilityState === "visible") {
        downloadFamilyData(ctx.family_code).catch(e => console.warn("[App] vis family dl:", e));
        if (user?.username) downloadUserData(user.username).catch(e => console.warn("[App] vis user dl:", e));
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // 인증 완료 콜백 (훅은 early return 위에 위치해야 — Rules of Hooks)
  const handleAuthComplete = useCallback(async (userId) => {
    if (initInProgress.current) return;
    initInProgress.current = true;
    setActiveUser(userId);
    const user = findUserById(userId);
    if (user?.family_context) {
      saveFamilyContext(user.family_context);
      await downloadFamilyData(user.family_context.family_code).catch(e => console.warn("[App] login family dl:", e));
      uploadFamilyData(user.family_context.family_code).catch(e => console.warn("[App] login family ul:", e));
    }
    if (user?.username) {
      await downloadUserData(user.username).catch(e => console.warn("[App] login user dl:", e));
      uploadUserData(user.username).catch(e => console.warn("[App] login user ul:", e));
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
    clearOnboardingDeferred();
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
      // 모든 가족 구성원의 family_context를 서버에 동기화
      const allAccounts = loadUserAccounts();
      for (const acc of allAccounts) {
        if (acc.user_id !== activeId && acc.username) {
          updateUserFamilyContext(acc.user_id, ctx);
        }
      }
      const user = findUserById(activeId);
      uploadFamilyData(ctx.family_code).catch(e => console.warn("[App] onboard family upload:", e));
      if (user?.username) {
        uploadUserData(user.username).catch(e => console.warn("[App] onboard user upload:", e));
      }
    }
    const role = ctx?.member_role;
    if (role === "parent" || role === "child") {
      setShowTutorial(role);
    }
    import("../utils/accountSwitcher").then(({ saveCurrentAccount }) => {
      saveCurrentAccount();
      initApp().then(result => { if (mountedRef.current) setBoot(result); });
    }).catch(() => {});
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
      <Suspense fallback={<Splash />}>
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
      </Suspense>
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
      onAdmin={() => setAdminMode(true)}
      onTutorial={() => setShowTutorialPicker(true)}
    />;
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
    <Suspense fallback={<Splash />}>
      <OfflineBanner />
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
      {showMigrationInfo && (
        <PasswordMigrationInfoModal
          accounts={showMigrationInfo}
          onConfirm={() => setShowMigrationInfo(null)}
        />
      )}
      <ToastContainer />
    </Suspense>
  );
}
