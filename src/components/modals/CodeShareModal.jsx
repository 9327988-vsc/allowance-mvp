// src/components/modals/CodeShareModal.jsx — S-2-204 가족 코드 공유 안내

import { useCallback } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { useToast } from "../../hooks/useToast";
import { copyToClipboard } from "../../utils/clipboard";

/**
 * @param {{ code: string, onClose: () => void }} props
 */
export default function CodeShareModal({ code, onClose }) {
  const contentRef = useModalBase(onClose);
  const { showToast } = useToast();

  const handleCopy = useCallback(async () => {
    const result = await copyToClipboard(code);
    if (result.success) {
      showToast({ type: "success", message: "가족 코드가 복사되었습니다!" });
    } else {
      showToast({ type: "error", message: "복사 실패. 코드를 직접 공유해 주세요." });
    }
  }, [code, showToast]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={contentRef} className="modal-content rounded-xl w-full max-w-sm text-center" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="가족 코드 공유" style={{ boxShadow: "var(--shadow-lg)", backgroundColor: "var(--color-bg-card)" }}>
        <div className="px-5 py-6">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
            가족 그룹이 만들어졌어요!
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
            아래 코드를 가족에게 공유하면 같은 그룹에 참여할 수 있어요.
          </p>

          {/* 가족 코드 */}
          <div
            className="py-4 px-6 rounded-xl mb-4 inline-block"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <span className="text-3xl font-bold font-mono tracking-[0.3em]" style={{ color: "var(--color-primary)" }}>
              {code}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleCopy}
              className="w-full py-3 rounded-lg font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              📋 가족 코드 복사
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg font-semibold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
