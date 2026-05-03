// src/components/modals/ExportModal.jsx — S-113 데이터 내보내기
import { useState, useEffect } from "react";
import { exportData, downloadJSON, defaultExportFilename } from "../../utils/exportImport";
import { showToast } from "../../utils/toastManager";

export default function ExportModal({ onClose }) {
  const [includeSettings, setIncludeSettings] = useState(true);
  const [includeCalendars, setIncludeCalendars] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeBackups, setIncludeBackups] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ESC 닫기
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !exporting) {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, exporting]);

  const anyChecked = includeSettings || includeCalendars || includeCategories || includeBackups;

  async function handleExport() {
    if (!anyChecked || exporting) return;
    setExporting(true);
    try {
      const data = await exportData({
        includeSettings,
        includeCalendars,
        includeCategories,
        includeBackups,
      });
      downloadJSON(data, defaultExportFilename());
      showToast({ type: "success", message: "✅ 내보내기 완료" });
      onClose();
    } catch {
      showToast({ type: "error", message: "내보내기 실패" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-1)" }}
      /* PRD 6.3: S-113 ❌ 외부 클릭 */
    >
      <div
        className="modal-content"
        style={{ maxWidth: 480, width: "95%" }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="데이터 내보내기"
        aria-modal="true"
      >
        <div className="modal-header-row">
          <h2 className="modal-title">📤 데이터 내보내기</h2>
          {!exporting && (
            <button className="modal-close-x" onClick={onClose} aria-label="닫기">×</button>
          )}
        </div>

        <div className="export-options">
          <p className="font-medium mb-2">내보낼 항목</p>
          <label className="export-checkbox">
            <input type="checkbox" checked={includeSettings} onChange={e => setIncludeSettings(e.target.checked)} disabled={exporting} />
            자녀 설정
          </label>
          <label className="export-checkbox">
            <input type="checkbox" checked={includeCalendars} onChange={e => setIncludeCalendars(e.target.checked)} disabled={exporting} />
            캘린더 데이터
          </label>
          <label className="export-checkbox">
            <input type="checkbox" checked={includeCategories} onChange={e => setIncludeCategories(e.target.checked)} disabled={exporting} />
            사용자 정의 카테고리
          </label>
          <label className="export-checkbox">
            <input type="checkbox" checked={includeBackups} onChange={e => setIncludeBackups(e.target.checked)} disabled={exporting} />
            손상된 백업 파일 (관리자용)
          </label>
        </div>

        <div className="export-info">
          <p className="diag-sub-label">▸ 정보</p>
          <p className="text-sm">파일명: {defaultExportFilename()}</p>
          <p className="text-sm">형식: JSON, SHA-256 체크섬 포함</p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 rounded-md border"
          >
            취소
          </button>
          <button
            onClick={handleExport}
            disabled={!anyChecked || exporting}
            className="px-4 py-2 rounded-md text-white"
            style={{ background: anyChecked && !exporting ? "var(--color-primary)" : "var(--color-text-disabled)" }}
          >
            {exporting ? "내보내는 중..." : "내보내기"}
          </button>
        </div>
      </div>
    </div>
  );
}
