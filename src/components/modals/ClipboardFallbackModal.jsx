// src/components/modals/ClipboardFallbackModal.jsx — S-111 클립보드 폴백
import { useEffect, useRef } from "react";
import { useModalBase } from "../../hooks/useModalBase";

export default function ClipboardFallbackModal({ text, onClose }) {
  const modalRef = useModalBase(onClose);
  const textareaRef = useRef(null);

  // 자동 포커스 + 전체 선택
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  function handleSelectAll() {
    if (textareaRef.current) {
      textareaRef.current.select();
    }
  }

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-1)" }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="modal-content"
        style={{ maxWidth: 500, width: "95%" }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="메시지 수동 복사"
        aria-modal="true"
      >
        <p className="font-medium mb-1">자동 복사가 지원되지 않는 환경이에요.</p>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
          아래 메시지를 길게 눌러 (또는 Ctrl+A → Ctrl+C) 직접 복사해주세요.
        </p>

        <textarea
          ref={textareaRef}
          readOnly
          value={text}
          rows={12}
          className="w-full border rounded-md p-3 mb-4 resize-none"
          style={{
            fontSize: "var(--font-size-sm)",
            fontFamily: "monospace",
            background: "var(--color-bg-secondary)",
          }}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 rounded-md border"
            style={{ color: "var(--color-primary)" }}
          >
            모두 선택
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-white"
            style={{ background: "var(--color-primary)" }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
