// src/components/modals/ChoresChildModal.jsx — 자녀용 미션 보드
import { useState, useEffect, useRef, useCallback } from "react";
import { loadChores, submitChoreCompletion, getRecentChoreLog, getMonthlyChoreReward } from "../../utils/chores";
import { formatAmountShort } from "../../utils/formatAmount";

export default function ChoresChildModal({ childMemberId, childName, onClose }) {
  const [tab, setTab] = useState("available"); // "available" | "history"
  const [chores, setChores] = useState([]);
  const [recentLog, setRecentLog] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [completingId, setCompletingId] = useState(null);
  const [message, setMessage] = useState(null);
  const messageTimerRef = useRef(null);

  const reload = useCallback(() => {
    if (!childMemberId) return;
    const all = loadChores().filter(c => c.enabled && (!c.child_member_id || c.child_member_id === childMemberId));
    setChores(all);
    setRecentLog(getRecentChoreLog(childMemberId, 14));
    const now = new Date();
    setMonthlyTotal(getMonthlyChoreReward(childMemberId, now.getFullYear(), now.getMonth() + 1));
  }, [childMemberId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // 타이머 정리
  useEffect(() => {
    return () => { if (messageTimerRef.current) clearTimeout(messageTimerRef.current); };
  }, []);

  function handleComplete(chore) {
    if (completingId) return; // 더블클릭 방지
    setCompletingId(chore.id);
    const result = submitChoreCompletion(chore.id, childMemberId, childName);
    if (result.success) {
      setMessage({ type: "success", text: `${chore.icon} ${chore.name} 완료 신청! 부모님 승인을 기다려요` });
      reload();
    } else {
      setMessage({ type: "error", text: result.error });
    }
    // 짧은 딜레이 후 completingId 해제 (더블클릭 방지)
    setTimeout(() => setCompletingId(null), 500);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 440, width: "92%", padding: 0 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="미션 보드"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 className="modal-title">🎯 미션 보드</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        {/* 이번 달 보상 요약 */}
        <div style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-secondary)", textAlign: "center" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>이번 달 미션 보상</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {formatAmountShort(monthlyTotal)}<span className="amount-unit">원</span>
          </div>
        </div>

        {/* 메시지 */}
        {message && (
          <div style={{
            padding: "var(--space-2) var(--space-4)",
            fontSize: "0.82rem",
            color: message.type === "success" ? "var(--color-success)" : "var(--color-error)",
            textAlign: "center",
          }}>
            {message.text}
          </div>
        )}

        {/* 탭 */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", padding: "0 var(--space-4)" }}>
          <button
            className={`parent-filter-tab${tab === "available" ? " parent-filter-tab--active" : ""}`}
            onClick={() => setTab("available")}
          >
            할 수 있는 미션
          </button>
          <button
            className={`parent-filter-tab${tab === "history" ? " parent-filter-tab--active" : ""}`}
            onClick={() => setTab("history")}
          >
            기록
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxHeight: 360, overflowY: "auto" }}>
          {tab === "available" && (
            <>
              {chores.length === 0 && (
                <div style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-secondary)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎯</div>
                  <p>등록된 미션이 없어요</p>
                  <p style={{ fontSize: "0.8rem" }}>부모님이 미션을 등록하면 여기에 나타나요</p>
                </div>
              )}
              {chores.map(c => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", gap: "var(--space-3)",
                  padding: "var(--space-3)", borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-secondary)",
                }}>
                  <span style={{ fontSize: "1.5rem" }}>{c.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                      +{c.reward.toLocaleString()}원
                    </div>
                  </div>
                  <button
                    onClick={() => handleComplete(c)}
                    disabled={completingId === c.id}
                    className="btn btn--primary btn--sm"
                    style={{ minWidth: 60 }}
                  >
                    완료!
                  </button>
                </div>
              ))}
            </>
          )}

          {tab === "history" && (
            <>
              {recentLog.length === 0 && (
                <div style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-secondary)" }}>
                  <p>아직 완료한 미션이 없어요</p>
                </div>
              )}
              {recentLog.map(entry => (
                <div key={entry.id} style={{
                  display: "flex", alignItems: "center", gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-secondary)",
                  opacity: entry.status === "rejected" ? 0.5 : 1,
                }}>
                  <span style={{ fontSize: "1.1rem" }}>{entry.chore_icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{entry.chore_name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>
                      {new Date(entry.completed_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    {entry.status === "approved" && <span style={{ color: "var(--color-success)" }}>+{entry.reward.toLocaleString()}원 ✓</span>}
                    {entry.status === "pending" && <span style={{ color: "var(--color-warning, orange)" }}>대기중</span>}
                    {entry.status === "rejected" && <span style={{ color: "var(--color-error)" }}>거절</span>}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
