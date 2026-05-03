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
import StorageDisabledModal from "./modals/StorageDisabledModal";
import DataCorruptedModal from "./modals/DataCorruptedModal";

function isAdminMode() {
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

  // 9.1 콘솔 디버그용: window.openAdmin()
  useEffect(() => {
    window.openAdmin = () => { window.location.search = "?admin=1"; };
    return () => { delete window.openAdmin; };
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
            message: `⚠ ${match[1]}-${match[2]} 데이터가 손상되어 백업되었습니다. 관리자 모드에서 복구할 수 있어요.`,
            duration: 0,
            action: {
              label: "관리자 모드",
              onClick: () => { window.location.search = "?admin=1"; }
            }
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
      onResetSettings={() => setBoot({ status: "first_use" })}
      onRecovered={() => initApp().then(setBoot)}
    />;
  } else if (screen === "welcome_modal") {
    content = <SettingsModal mode="first" onSaved={(settings) => setBoot({ status: "ok", settings })} />;
  } else {
    content = <MainScreen
      settings={boot.settings}
      onSettingsChange={(s) => setBoot({ ...boot, settings: s })}
    />;
  }

  return (
    <>
      {content}
      <ToastContainer />
    </>
  );
}
