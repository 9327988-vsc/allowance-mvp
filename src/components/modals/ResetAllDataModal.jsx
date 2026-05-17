// src/components/modals/ResetAllDataModal.jsx — S-117 모든 데이터 초기화 (2단계 type-to-confirm)
import { useState, useEffect } from "react";
import { resetAllData } from "../../utils/storage";
import { showToast } from "../../utils/toastManager";
import { logout } from "../../utils/accountSwitcher";

const CONFIRM_TEXT = "초기화 동의";

export default function ResetAllDataModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState("");

  // ESC 처리: 1단계 → 닫기, 2단계 → 1단계 복귀
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (step === 2) {
          setStep(1);
          setInput("");
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, step]);

  const trimmed = input.trim();
  const isMatch = trimmed === CONFIRM_TEXT;

  function handleReset() {
    if (!isMatch) return;
    try {
      resetAllData();
      // L-14: 세션 상태도 클리어
      try { logout(); } catch { /* ignored */ }
      showToast({ type: "success", message: "✅ 모든 데이터가 초기화되었습니다" });
      window.location.reload();
    } catch (err) {
      showToast({ type: "error", message: "초기화 실패: " + (err.message || "알 수 없는 오류"), duration: 5000 });
    }
  }

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-3)" }}
    >
      <div
        className="modal-content"
        style={{ maxWidth: 440, width: "95%" }}
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-label="모든 데이터 초기화"
        aria-modal="true"
      >
        {step === 1 ? (
          <>
            <h2 className="modal-title mb-3">🗑 모든 데이터 초기화 — 1/2</h2>

            <p className="mb-2" style={{ color: "var(--color-danger)" }}>⚠ 다음이 영구 삭제됩니다:</p>
            <ul className="text-sm mb-3" style={{ paddingLeft: "1.2em", listStyle: "disc" }}>
              <li>자녀 설정</li>
              <li>캘린더 데이터 (전체 기간)</li>
              <li>사용자 정의 카테고리</li>
              <li>손상 백업 파일</li>
              <li>메타 정보</li>
            </ul>

            <p className="mb-1">즉, 앱이 첫 사용 상태로 돌아갑니다.</p>
            <p className="mb-3" style={{ color: "var(--color-danger)" }}>이 작업은 되돌릴 수 없습니다.</p>
            <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              미리 📤 내보내기로 백업하셨나요?
            </p>

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-md border">취소</button>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-md text-white"
                style={{ background: "var(--color-danger)" }}
              >
                백업했습니다, 계속
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="modal-title mb-3">🗑 모든 데이터 초기화 — 2/2</h2>

            <p className="mb-2">정말로 모든 데이터를 삭제하려면 아래에 정확히 입력해주세요:</p>

            <p className="text-center font-bold text-lg mb-3" style={{ color: "var(--color-danger)" }}>
              {CONFIRM_TEXT}
            </p>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="초기화 동의"
              className="w-full px-3 py-2 rounded-md border mb-1"
              style={{
                borderColor: input.length === 0
                  ? "var(--color-border)"
                  : isMatch
                    ? "var(--color-success)"
                    : "var(--color-danger)",
                outline: "none",
              }}
              autoFocus
            />
            {input.length > 0 && !isMatch && (
              <p className="text-sm mb-3" style={{ color: "var(--color-danger)" }}>
                입력이 일치하지 않습니다
              </p>
            )}
            {(input.length === 0 || isMatch) && <div className="mb-3" />}

            <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
              ※ 한글 그대로 &quot;초기화 동의&quot; (공백 포함 5글자)
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setStep(1); setInput(""); }}
                className="px-4 py-2 rounded-md border"
              >
                ← 이전
              </button>
              <button
                onClick={handleReset}
                disabled={!isMatch}
                className="px-4 py-2 rounded-md text-white"
                style={{
                  background: isMatch ? "var(--color-danger)" : "var(--color-text-disabled)",
                }}
              >
                완전히 삭제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
