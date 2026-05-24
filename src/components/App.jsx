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
  const [syncing, setSyncing] = useState(false);
  const tutorialPickerRef = useModalBase(() => setShowTutorialPicker(false), { active: showTutorialPicker });

  // 9.1 콘솔 디버그용
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.openAdmin = () => setAdminMode(true);
    }
    // 수동 동기화 + 디버그용 (운영 환경 포함)
    window.forceSync = async () => {
      const ctx = loadFamilyContext();
      const uid = getActiveUser();
      const user = uid ? findUserById(uid) : null;
      console.info("[forceSync] family_context:", ctx);
      console.info("[forceSync] user:", user?.username, "uid:", uid);
      if (!ctx?.family_code) { console.warn("[forceSync] 가족 코드 없음"); return; }
      try {
        await uploadFamilyData(ctx.family_code);
        console.info("[forceSync] 가족 데이터 업로드 완료");
        showToast({ type: "success", message: "가족 데이터 업로드 완료", duration: 3000 });
      } catch (e) { console.error("[forceSync] 가족 업로드 실패:", e); }
      if (user?.username) {
        try {
          await uploadUserData(user.username);
          console.info("[forceSync] 사용자 데이터 업로드 완료");
          showToast({ type: "success", message: "사용자 데이터 업로드 완료", duration: 3000 });
        } catch (e) { console.error("[forceSync] 사용자 업로드 실패:", e); }
      }
    };
    console.info("[App] v9.2-sync loaded");
    return () => { delete window.openAdmin; delete window.forceSync; };
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
      let syncCount = 0;
      if (ctx?.family_code) {
        try {
          await uploadFamilyData(ctx.family_code);
          syncCount++;
        } catch (e) {
          showToast({ type: "warning", message: `동기화 업로드 실패: ${e.message}`, duration: 5000 });
        }
      }
      if (user?.username) {
        try {
          await uploadUserData(user.username);
          syncCount++;
        } catch (e) {
          showToast({ type: "warning", message: `사용자 데이터 업로드 실패: ${e.message}`, duration: 5000 });
        }
      }
      if (syncCount > 0) {
        showToast({ type: "success", message: `클라우드 동기화 완료`, duration: 3000 });
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
    let dlCount = 0;
    if (user?.family_context) {
      saveFamilyContext(user.family_context);
      try {
        dlCount += await downloadFamilyData(user.family_context.family_code) || 0;
      } catch (e) { showToast({ type: "warning", message: `가족 데이터 다운로드 실패: ${e.message}`, duration: 5000 }); }
      uploadFamilyData(user.family_context.family_code).catch(() => {});
    } else {
      showToast({ type: "info", message: "서버에 가족 정보가 없습니다. PC에서 먼저 새로고침해 주세요.", duration: 6000 });
    }
    if (user?.username) {
      try {
        dlCount += await downloadUserData(user.username) || 0;
      } catch (e) { showToast({ type: "warning", message: `사용자 데이터 다운로드 실패: ${e.message}`, duration: 5000 }); }
      uploadUserData(user.username).catch(() => {});
    }
    if (dlCount > 0) {
      showToast({ type: "success", message: `클라우드에서 ${dlCount}건 동기화 완료`, duration: 3000 });
    } else if (user?.family_context) {
      showToast({ type: "info", message: "클라우드에 데이터가 없습니다. PC에서 앱을 먼저 열어주세요.", duration: 6000 });
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

  // 수동 동기화 버튼 핸들러
  async function handleManualSync() {
    if (syncing) return;
    setSyncing(true);
    const ctx = loadFamilyContext();
    const uid = getActiveUser();
    const user = uid ? findUserById(uid) : null;
    if (!ctx?.family_code) {
      showToast({ type: "warning", message: "가족 코드가 없어서 동기화할 수 없습니다", duration: 4000 });
      setSyncing(false);
      return;
    }
    try {
      await uploadFamilyData(ctx.family_code);
      if (user?.username) await uploadUserData(user.username);
      showToast({ type: "success", message: "클라우드 동기화 완료!", duration: 3000 });
    } catch (e) {
      showToast({ type: "warning", message: `동기화 실패: ${e.message}`, duration: 5000 });
    }
    setSyncing(false);
  }

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
      {boot?.familyContext && (
        <button
          onClick={handleManualSync}
          disabled={syncing}
          aria-label="클라우드 동기화"
          style={{
            position: "fixed", bottom: 80, right: 16, zIndex: 900,
            width: 48, height: 48, borderRadius: "50%",
            background: syncing ? "var(--color-text-muted)" : "var(--color-primary)",
            color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, cursor: syncing ? "wait" : "pointer",
          }}
        >
          {syncing ? "..." : "☁"}
        </button>
      )}
      <ToastContainer />
    </Suspense>
  );
}
