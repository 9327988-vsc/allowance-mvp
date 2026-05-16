// src/components/widgets/MoreMenu.jsx — 하단바 "더보기" 팝업 메뉴
import { useEffect, useRef } from "react";

/**
 * @param {{ items: Array<{icon: string, label: string, onClick: () => void}>, onClose: () => void }} props
 */
export default function MoreMenu({ items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleEsc(e) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    // 다음 틱에 리스너 등록 (오픈 클릭과 충돌 방지)
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClick);
      document.addEventListener("keydown", handleEsc);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="more-menu"
      role="menu"
      style={{
        position: "absolute",
        bottom: "100%",
        right: 0,
        marginBottom: 8,
        background: "var(--color-bg-primary)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg, 12px)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
        padding: "var(--space-2)",
        minWidth: 140,
        zIndex: 100,
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          role="menuitem"
          className="more-menu__item"
          onClick={() => { item.onClick(); onClose(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            width: "100%",
            padding: "var(--space-3) var(--space-3)",
            border: "none",
            background: "transparent",
            borderRadius: "var(--radius-md)",
            fontSize: "0.88rem",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
          <span>{item.label}</span>
          {item.badge && <span className="notification-badge" style={{ marginLeft: "auto", fontSize: "0.65rem" }}>{item.badge}</span>}
        </button>
      ))}
    </div>
  );
}
