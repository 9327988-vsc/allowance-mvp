// src/components/modals/ReceiptViewerModal.jsx — 영수증 사진 뷰어
import { useState, useEffect } from "react";

export default function ReceiptViewerModal({ src, itemName, onClose }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-3, 1300)" }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{ maxWidth: 500, width: "94%", padding: 0, overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="영수증 보기"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 className="modal-title">📷 {itemName || "영수증"}</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>
        <div style={{ padding: "var(--space-3)", textAlign: "center" }}>
          {!src || imgError ? (
            <div style={{ padding: "var(--space-8)", color: "var(--color-text-secondary)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>❌</div>
              <p>이미지를 표시할 수 없어요</p>
            </div>
          ) : (
            <img
              src={src}
              alt={itemName ? `${itemName} 영수증` : "영수증"}
              onError={() => setImgError(true)}
              style={{
                maxWidth: "100%",
                maxHeight: "60vh",
                borderRadius: "var(--radius-md)",
                objectFit: "contain",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
