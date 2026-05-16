// src/components/modals/BadgesModal.jsx — 성취 배지 모달
import { useState, useEffect } from "react";
import { getBadgeSummary } from "../../utils/badges";

const CATEGORY_LABELS = {
  milestone: "마일스톤",
  chore: "집안일",
  savings: "절약",
  streak: "연속 출석",
  quality: "품질",
};

export default function BadgesModal({ onClose }) {
  const [summary, setSummary] = useState(() => getBadgeSummary());

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // 카테고리별 그룹
  const groups = {};
  summary.badges.forEach(b => {
    if (!groups[b.category]) groups[b.category] = [];
    groups[b.category].push(b);
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 420, width: "92%", padding: 0 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="성취 배지"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 className="modal-title">🏅 성취 배지</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        {/* 진행 상황 */}
        <div style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-secondary)", textAlign: "center" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginBottom: 4 }}>
            달성률 {summary.earned}/{summary.total}
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              background: "var(--color-primary)",
              width: `${summary.percent}%`,
              transition: "width 0.3s",
            }} />
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: 8, color: "var(--color-primary)" }}>
            {summary.percent}%
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {Object.entries(groups).map(([cat, badges]) => (
            <div key={cat}>
              <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "var(--space-2)" }}>
                {CATEGORY_LABELS[cat] || cat}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "var(--space-2)" }}>
                {badges.map(b => (
                  <div
                    key={b.id}
                    style={{
                      textAlign: "center", padding: "var(--space-3) var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-bg-secondary)",
                      opacity: b.earned ? 1 : 0.4,
                      filter: b.earned ? "none" : "grayscale(1)",
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{b.icon}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600 }}>{b.name}</div>
                    {b.earned && (
                      <div style={{ fontSize: "0.65rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                        {new Date(b.earned_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
