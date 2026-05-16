// src/components/modals/NotificationCenterModal.jsx — 인앱 알림 센터
import { useState, useEffect } from "react";
import { loadNotifications, markAsRead, markAllAsRead, clearNotifications } from "../../utils/notifications";

export default function NotificationCenterModal({ onClose }) {
  const [notifs, setNotifs] = useState(() => loadNotifications());

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function handleRead(id) {
    markAsRead(id);
    setNotifs(loadNotifications());
  }

  function handleReadAll() {
    markAllAsRead();
    setNotifs(loadNotifications());
  }

  function handleClear() {
    clearNotifications();
    setNotifs([]);
  }

  function formatTime(isoStr) {
    const d = new Date(isoStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "방금";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  }

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 420, width: "92%", padding: 0 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="알림"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 className="modal-title">🔔 알림</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        {/* 액션 버튼 */}
        {notifs.length > 0 && (
          <div style={{ display: "flex", gap: "var(--space-2)", padding: "var(--space-2) var(--space-4)", borderBottom: "1px solid var(--color-border)" }}>
            {unreadCount > 0 && (
              <button onClick={handleReadAll} className="btn btn--sm btn--secondary" style={{ fontSize: "0.75rem" }}>
                모두 읽음
              </button>
            )}
            <button onClick={handleClear} className="btn btn--sm btn--secondary" style={{ fontSize: "0.75rem", marginLeft: "auto" }}>
              전체 삭제
            </button>
          </div>
        )}

        <div className="modal-body" style={{ maxHeight: 400, overflowY: "auto", padding: 0 }}>
          {notifs.length === 0 && (
            <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-secondary)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔔</div>
              <p>알림이 없어요</p>
            </div>
          )}

          {notifs.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && handleRead(n.id)}
              style={{
                display: "flex", gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                borderBottom: "1px solid var(--color-border)",
                background: n.read ? "transparent" : "var(--color-bg-secondary)",
                cursor: n.read ? "default" : "pointer",
              }}
            >
              <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{n.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: n.read ? 400 : 600, fontSize: "0.85rem" }}>{n.title}</div>
                {n.message && (
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                    {n.message}
                  </div>
                )}
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: 4 }}>
                  {formatTime(n.created_at)}
                </div>
              </div>
              {!n.read && (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0, marginTop: 6 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
