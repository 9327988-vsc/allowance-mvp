// src/components/modals/CopyOptionsModal.jsx — 복사 옵션 선택 팝업
import { useState } from "react";
import { useModalBase } from "../../hooks/useModalBase";

const COPY_OPTIONS = [
  { id: "text", icon: "📝", label: "청구서 복사", desc: "텍스트 청구서만 복사" },
  { id: "calendar", icon: "📅", label: "캘린더 복사", desc: "일별 내역 캘린더 복사" },
  { id: "both", icon: "📋", label: "전체 복사", desc: "캘린더 + 청구서 함께 복사" },
];

export default function CopyOptionsModal({ onSelect, onClose }) {
  const [selected, setSelected] = useState("text");
  const contentRef = useModalBase(onClose);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div ref={contentRef} className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, width: "85%", padding: 0 }} role="dialog" aria-modal="true" aria-label="복사 옵션">
        <div className="modal-header">
          <h2 className="modal-title">📋 복사 옵션</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", padding: "var(--space-4)" }}>
          {COPY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`copy-option${selected === opt.id ? " copy-option--active" : ""}`}
              onClick={() => setSelected(opt.id)}
            >
              <span className="copy-option__icon">{opt.icon}</span>
              <div className="copy-option__text">
                <span className="copy-option__label">{opt.label}</span>
                <span className="copy-option__desc">{opt.desc}</span>
              </div>
              {selected === opt.id && <span className="copy-option__check">✓</span>}
            </button>
          ))}
        </div>

        <div className="modal-footer modal-footer--stretch">
          <button onClick={onClose} className="btn btn--secondary">취소</button>
          <button onClick={() => onSelect(selected)} className="btn btn--primary">복사하기</button>
        </div>
      </div>
    </div>
  );
}
