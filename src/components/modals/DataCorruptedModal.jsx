// src/components/modals/DataCorruptedModal.jsx — S-109 설정 손상 안내
import { useEffect, useState } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { recoverFromBackup } from "../../utils/diagnostics";
import { showToast } from "../../utils/toastManager";

export default function DataCorruptedModal({ onResetSettings, onRecovered }) {
  const [hasBackup, setHasBackup] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    const backupExists = Object.keys(localStorage)
      .some(k => k.startsWith("settings_v1_corrupted_"));
    setHasBackup(backupExists);
  }, []);

  // useModalBase: scroll lock + focus trap + ESC (→ 다시 설정하기)
  const modalRef = useModalBase(onResetSettings, { active: true });

  function handleRecover() {
    setRecovering(true);
    const result = recoverFromBackup("settings_v1");
    if (result.success) {
      showToast({ type: "success", message: "✅ 설정이 복구되었습니다" });
      if (onRecovered) onRecovered();
    } else {
      const messages = {
        NO_BACKUP: "백업 파일이 없습니다",
        BACKUP_EMPTY: "백업 파일이 비어있습니다",
        PARSE_FAILED: "백업 파일도 손상되었습니다. 다시 설정해주세요",
        RESTORE_FAILED: "복원 중 저장 오류",
      };
      showToast({ type: "error", message: messages[result.error] || "복구 실패" });
    }
    setRecovering(false);
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-1)" }}>
      <div
        ref={modalRef}
        tabIndex={-1}
        className="modal-content"
        style={{ maxWidth: 420, width: "90%" }}
        role="alertdialog"
        aria-modal="true"
        aria-label="설정 데이터 손상 안내"
      >
        <h2 className="modal-title mb-3">⚠ 설정 데이터 손상</h2>

        <p className="mb-3">
          자녀 설정 데이터가 손상되어 읽을 수 없습니다.
        </p>

        {hasBackup && (
          <p className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
            백업 데이터가 있습니다. 복구를 시도해보세요.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onResetSettings}
            className="px-4 py-2 rounded-md border"
          >
            다시 설정하기
          </button>
          {hasBackup && (
            <button
              onClick={handleRecover}
              disabled={recovering}
              className="px-4 py-2 rounded-md text-white"
              style={{ background: "var(--color-primary)" }}
            >
              {recovering ? "복구 중..." : "복구 시도"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
