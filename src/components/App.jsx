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
import { serverUpdateProfile } from "../utils/serverAuth";

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

  // 9.1 콘솔 디버그용
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.openAdmin = () => setAdminMode(true);
    }
    window.forceSync = async () => {
      const ctx = loadFamilyContext();
      const uid = getActiveUser();
      const user = uid ? findUserById(uid) : null;
      console.info("[forceSync] family_code:", ctx?.family_code, "username:", user?.username, "uid:", uid);
      if (!ctx?.family_code) { showToast({ type: "error", message: "동기화 불가: 가족 코드 없음", duration: 5000 }); return; }
      try {
        const up = await uploadFamilyData(ctx.family_code);
        let usrUp = 0;
        if (user?.username) usrUp = (await uploadUserData(user.username))?.total || 0;
        const dl = await downloadFamilyData(ctx.family_code);
        let usrDl = 0;
        if (user?.username) usrDl = (await downloadUserData(user.username))?.total || 0;
        showToast({ type: "success", message: `동기화 완료: ↑${up + usrUp} ↓${dl + usrDl}건`, duration: 5000 });
      } catch (e) { showToast({ type: "error", message: `동기화 실패: ${e.message}`, duration: 5000 }); }
    };
    window.syncDiag = () => {
      const ctx = loadFamilyContext();
      const uid = getActiveUser();
      const user = uid ? findUserById(uid) : null;
      const famKeys = [];
      const usrKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("mock_kv:")) famKeys.push(k);
        if (k?.startsWith("calendar_v1_")) usrKeys.push(k);
      }
      const diag = {
        family_code: ctx?.family_code || "❌ 없음",
        family_id: ctx?.family_id || "❌ 없음",
        member_role: ctx?.member_role || "❌ 없음",
        username: user?.username || "❌ 없음",
        user_id: uid || "❌ 없음",
        mock_kv_keys: famKeys.length,
        calendar_keys: usrKeys.length,
        calendar_list: usrKeys,
      };
      console.table(diag);
      alert(JSON.stringify(diag, null, 2));
      return diag;
    };
    console.info("[App] v9.3-autosync loaded");
    return () => { delete window.openAdmin; delete window.forceSync; delete window.syncDiag; };
  }, []);

  // 1. 부팅 처리 (다운로드 → initApp → 업로드)
  const initInProgress = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    if (initInProgress.current) return;
    initInProgress.current = true;
    (async () => {
      try {
        const ctx = loadFamilyContext();
        const uid = getActiveUser();
        const user = uid ? findUserById(uid) : null;
        console.info("[App] boot sync 조건:", { family_code: ctx?.family_code, username: user?.username, uid });
        let famDl = 0, usrDlResult = null;
        if (ctx?.family_code) {
          try { famDl = await downloadFamilyData(ctx.family_code) || 0; }
          catch (e) { console.warn("[App] boot family dl:", e); }
          try { if (user?.username) usrDlResult = await downloadUserData(user.username) || null; }
          catch (e) { console.warn("[App] boot user dl:", e); }
        } else if (uid) {
          console.warn("[App] boot: 로그인됨 but 가족 코드 없음 → 동기화 스킵");
        }
        const result = await initApp();
        if (!mountedRef.current) return;
        let famUp = 0, usrUpResult = null;
        if (ctx?.family_code) {
          try { famUp = await uploadFamilyData(ctx.family_code) || 0; }
          catch (e) { showToast({ type: "warning", message: `가족 업로드 실패: ${e.message}`, duration: 5000 }); }
        }
        if (user?.username) {
          try { usrUpResult = await uploadUserData(user.username) || null; }
          catch (e) { showToast({ type: "warning", message: `사용자 업로드 실패: ${e.message}`, duration: 5000 }); }
        }
        if (ctx && user?.username) {
          serverUpdateProfile(user.username, { family_context: ctx }).catch(e => console.warn("[App] serverUpdateProfile:", e.message));
        }
        const usrDl = usrDlResult?.total || 0;
        const calDl = usrDlResult?.calendar || 0;
        const usrUp = usrUpResult?.total || 0;
        if (famDl + usrDl > 0) {
          showToast({ type: "success", message: `동기화: ↓${famDl + usrDl}건(캘${calDl}) ↑${famUp + usrUp}건`, duration: 5000 });
        } else if (famUp + usrUp > 0) {
          showToast({ type: "success", message: `클라우드: ${famUp + usrUp}건 업로드`, duration: 5000 });
        }
        setBoot(result);
        if (result.migrationResult?.migrated) {
          setShowMigrationInfo(result.migrationResult.accounts);
        }
      } finally { initInProgress.current = false; }
    })();
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

  // 4. 자동 동기화: 데이터 변경 시 디바운스 업로드 (3초)
  useEffect(() => {
    let timer = null;
    function handleMutation() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const ctx = loadFamilyContext();
        if (!ctx?.family_code) return;
        const user = findUserById(getActiveUser());
        uploadFamilyData(ctx.family_code).catch(e => console.warn("[App] auto-sync family:", e));
        if (user?.username) uploadUserData(user.username).catch(e => console.warn("[App] auto-sync user:", e));
      }, 3000);
    }
    window.addEventListener("mock-data-mutated", handleMutation);
    return () => { window.removeEventListener("mock-data-mutated", handleMutation); if (timer) clearTimeout(timer); };
  }, []);

  // 인증 완료 콜백 (훅은 early return 위에 위치해야 — Rules of Hooks)
  const handleAuthComplete = useCallback(async (userId) => {
    if (initInProgress.current) return;
    initInProgress.current = true;
    setActiveUser(userId);
    const user = findUserById(userId);
    let famDl = 0, usrDlResult = null;
    if (user?.family_context) {
      saveFamilyContext(user.family_context);
      try { await uploadFamilyData(user.family_context.family_code); } catch {}
      if (user.username) { try { await uploadUserData(user.username); } catch {} }
      try {
        famDl = await downloadFamilyData(user.family_context.family_code) || 0;
      } catch (e) { showToast({ type: "warning", message: `가족 다운로드 실패: ${e.message}`, duration: 5000 }); }
    } else {
      showToast({ type: "info", message: "서버에 가족 정보가 없습니다", duration: 5000 });
    }
    if (user?.username) {
      try {
        usrDlResult = await downloadUserData(user.username) || null;
      } catch (e) { showToast({ type: "warning", message: `개인 다운로드 실패: ${e.message}`, duration: 5000 }); }
    }
    const usrDl = usrDlResult?.total || 0;
    const calDl = usrDlResult?.calendar || 0;
    if (famDl + usrDl > 0) {
      showToast({ type: "success", message: `동기화: 가족${famDl} 개인${usrDl}(캘린더${calDl})건`, duration: 5000 });
    } else if (user?.family_context) {
      showToast({ type: "info", message: "클라우드에 데이터 없음. PC에서 앱을 먼저 열어주세요", duration: 5000 });
    }
    applyPrefs(loadUserPrefs(userId));
    initApp().then(result => { if (mountedRef.current) setBoot(result); }).finally(() => { initInProgress.current = false; });
  }, []);

  // 로그아웃 콜백 (전환 전 업로드 → 컨텍스트 정리)
  const handleLogout = useCallback(async () => {
    if (initInProgress.current) return;
    initInProgress.current = true;
    const ctx = loadFamilyContext();
    const user = findUserById(getActiveUser());
    if (ctx?.family_code) {
      try { await uploadFamilyData(ctx.family_code); } catch {}
      if (user?.username) { try { await uploadUserData(user.username); } catch {} }
    }
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
    }).catch(e => console.warn("[App] accountSwitcher:", e.message));
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
