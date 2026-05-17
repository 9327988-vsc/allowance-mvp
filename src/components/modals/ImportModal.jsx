// src/components/modals/ImportModal.jsx — S-114 데이터 가져오기
import { useState, useEffect, useRef } from "react";
import { validateImportFile, importData } from "../../utils/exportImport";
import { showToast } from "../../utils/toastManager";
import ConfirmOverwriteModal from "./ConfirmOverwriteModal";

export default function ImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("merge");
  const [validation, setValidation] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const validationSeqRef = useRef(0);

  // ESC 닫기
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (showOverwriteConfirm) return; // S-115가 ESC 처리
        if (!importing) {
          e.stopPropagation();
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, importing, showOverwriteConfirm]);

  async function handleFileSelect(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setValidation(null);
    const seq = ++validationSeqRef.current;
    const result = await validateImportFile(f);
    if (validationSeqRef.current === seq) {
      setValidation(result);
    }
  }

  async function handleImport() {
    if (!file || !validation?.valid || importing) return;

    // 덮어쓰기 모드 + 기존 데이터 존재 → S-115 확인
    if (mode === "overwrite") {
      const hasExisting = localStorage.getItem("settings_v1") !== null ||
        Object.keys(localStorage).some(k => k.startsWith("calendar_v1_"));
      if (hasExisting) {
        setShowOverwriteConfirm(true);
        return;
      }
    }

    await executeImport(mode);
  }

  async function executeImport(importMode) {
    setImporting(true);
    try {
      const result = await importData(file, importMode);
      if (result.success) {
        const total = result.applied.settings + result.applied.categories + result.applied.calendars;
        showToast({ type: "success", message: `✅ ${total}개 항목을 가져왔습니다` });
        if (onImported) onImported();
        onClose();
      } else {
        const messages = {
          INVALID_JSON: "올바른 JSON 형식이 아닙니다",
          VERSION_MISMATCH: "지원되지 않는 백업 버전입니다",
          INVALID_SCHEMA: "백업 파일 구조가 올바르지 않습니다",
          CHECKSUM_MISMATCH: "체크섬 불일치 — 파일이 변조되었거나 손상됨",
        };
        showToast({ type: "error", message: messages[result.error] || "가져오기 실패" });
      }
    } catch {
      showToast({ type: "error", message: "가져오기 실패" });
    } finally {
      setImporting(false);
    }
  }

  // S-115에서 확인
  async function handleOverwriteConfirmed() {
    setShowOverwriteConfirm(false);
    await executeImport("overwrite");
  }

  const errorMessages = {
    INVALID_JSON: "❌ 올바른 JSON 형식이 아닙니다",
    VERSION_MISMATCH: `❌ 지원되지 않는 백업 버전입니다 (v${validation?.version ?? "?"}, 현재 v1만 지원)`,
    INVALID_SCHEMA: "❌ 백업 파일 구조가 올바르지 않습니다",
    CHECKSUM_MISMATCH: "❌ 체크섬 불일치 — 파일이 변조되었거나 손상됨",
  };

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-1)" }}
      onClick={importing || showOverwriteConfirm ? undefined : onClose}
    >
      <div
        className="modal-content"
        style={{ maxWidth: 500, width: "95%" }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="데이터 가져오기"
        aria-modal="true"
      >
        <div className="modal-header-row">
          <h2 className="modal-title">📥 데이터 가져오기</h2>
          {!importing && (
            <button className="modal-close-x" onClick={onClose} aria-label="닫기">×</button>
          )}
        </div>

        {/* 파일 선택 */}
        <div className="mb-4">
          <p className="mb-2">백업 파일을 선택하세요 (.json)</p>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              파일 선택
            </button>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {file ? file.name : "선택된 파일 없음"}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        {/* 모드 선택 */}
        <div className="mb-4">
          <p className="font-medium mb-2">가져오기 모드:</p>
          <label className="import-radio">
            <input
              type="radio"
              name="importMode"
              value="overwrite"
              checked={mode === "overwrite"}
              onChange={() => setMode("overwrite")}
              disabled={importing}
            />
            덮어쓰기 (기존 모두 삭제)
          </label>
          <label className="import-radio">
            <input
              type="radio"
              name="importMode"
              value="merge"
              checked={mode === "merge"}
              onChange={() => setMode("merge")}
              disabled={importing}
            />
            병합 (없는 것만 추가) ← 기본
          </label>
          {mode === "overwrite" && (
            <p className="text-sm mt-1" style={{ color: "var(--color-danger)" }}>
              ⚠ 덮어쓰기는 현재 데이터를 완전히 대체합니다. 되돌릴 수 없으니 📤 내보내기로 미리 백업하세요.
            </p>
          )}
        </div>

        {/* 검증 결과 */}
        {validation && (
          <div className="import-validation mb-4">
            <p className="font-medium mb-1">검증 결과:</p>
            {validation.valid ? (
              <div className="text-sm">
                <p>✅ 파일 형식 OK</p>
                <p>✅ 체크섬 일치</p>
                <p>✅ 버전 호환 (v1)</p>
                <p>• settings: {validation.summary.settings}건</p>
                <p>• custom_categories: {validation.summary.categories}건</p>
                <p>• calendars: {validation.summary.calendars}개월</p>
                {validation.summary.exportedAt && (
                  <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    내보낸 날짜: {new Date(validation.summary.exportedAt).toLocaleString("ko-KR")}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-danger)" }}>
                {errorMessages[validation.error] || "❌ 알 수 없는 오류"}
              </p>
            )}
          </div>
        )}

        <div className="modal-footer modal-footer--end">
          <button onClick={onClose} disabled={importing} className="btn btn--secondary">
            취소
          </button>
          <button
            onClick={handleImport}
            disabled={!validation?.valid || importing}
            className="btn btn--primary"
          >
            {importing ? "가져오는 중..." : "가져오기"}
          </button>
        </div>
      </div>

      {/* S-115 덮어쓰기 확인 */}
      {showOverwriteConfirm && (
        <ConfirmOverwriteModal
          onCancel={() => setShowOverwriteConfirm(false)}
          onConfirm={handleOverwriteConfirmed}
        />
      )}
    </div>
  );
}
