// src/components/modals/ChoresManagerModal.jsx — 부모용 집안일/미션 관리
import { useState, useEffect } from "react";
import { loadChores, addChore, removeChore, toggleChore, getPendingChoreApprovals, approveChoreCompletion } from "../../utils/chores";
import CurrencyInput from "../inputs/CurrencyInput";

const ICONS = ["🧹", "🍽️", "🧺", "🐕", "📚", "🛏️", "🗑️", "🌱", "🚿", "✨"];

export default function ChoresManagerModal({ childMembers = [], onClose }) {
  const [tab, setTab] = useState("list"); // "list" | "pending"
  const [chores, setChores] = useState(() => loadChores());
  const [pending, setPending] = useState(() => getPendingChoreApprovals());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    reward: 0,
    icon: "🧹",
    child_member_id: "",
    frequency: "daily",
    max_per_day: 1,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function reload() {
    setChores(loadChores());
    setPending(getPendingChoreApprovals());
  }

  function handleAdd() {
    const errs = {};
    if (!form.name.trim()) errs.name = "미션명을 입력해주세요";
    if (!form.reward || form.reward < 100) errs.reward = "100원 이상 입력해주세요";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    addChore({
      name: form.name.trim(),
      reward: form.reward,
      icon: form.icon,
      child_member_id: form.child_member_id || null,
      frequency: form.frequency,
      max_per_day: form.max_per_day,
    });
    reload();
    setShowForm(false);
    setForm({ ...form, name: "", reward: 0 });
    setErrors({});
  }

  function handleApprove(entryId) {
    approveChoreCompletion(entryId, true);
    reload();
  }

  function handleReject(entryId) {
    approveChoreCompletion(entryId, false);
    reload();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 480, width: "92%", padding: 0 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="집안일 미션"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 className="modal-title">🏠 집안일 미션</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", padding: "0 var(--space-4)" }}>
          <button
            className={`parent-filter-tab${tab === "list" ? " parent-filter-tab--active" : ""}`}
            onClick={() => setTab("list")}
          >
            미션 목록 ({chores.length})
          </button>
          <button
            className={`parent-filter-tab${tab === "pending" ? " parent-filter-tab--active" : ""}`}
            onClick={() => setTab("pending")}
          >
            승인 대기 ({pending.length})
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxHeight: 400, overflowY: "auto" }}>
          {/* 미션 목록 탭 */}
          {tab === "list" && (
            <>
              {chores.length === 0 && !showForm && (
                <div style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-secondary)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>🏠</div>
                  <p>등록된 미션이 없어요</p>
                  <p style={{ fontSize: "0.8rem" }}>집안일을 등록하고 보상을 설정해보세요</p>
                </div>
              )}

              {chores.map(c => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", gap: "var(--space-2)",
                  padding: "var(--space-3)", borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-secondary)",
                  opacity: c.enabled ? 1 : 0.5,
                }}>
                  <span style={{ fontSize: "1.3rem" }}>{c.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                      {c.reward.toLocaleString()}원 · {c.frequency === "daily" ? "매일" : c.frequency === "weekly" ? "매주" : "1회"}
                      {c.max_per_day > 1 && ` · 하루 ${c.max_per_day}회`}
                    </div>
                  </div>
                  <button
                    onClick={() => { toggleChore(c.id); reload(); }}
                    className="btn btn--sm"
                    style={{ minWidth: 36, fontSize: "0.8rem" }}
                  >
                    {c.enabled ? "⏸" : "▶️"}
                  </button>
                  <button
                    onClick={() => { removeChore(c.id); reload(); }}
                    className="btn btn--sm btn--danger"
                    style={{ minWidth: 36, fontSize: "0.8rem" }}
                  >
                    🗑
                  </button>
                </div>
              ))}

              {/* 추가 폼 */}
              {showForm && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "var(--color-bg-secondary)" }}>
                  {/* 아이콘 선택 */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setForm({ ...form, icon })}
                        style={{
                          fontSize: "1.2rem", padding: "4px 6px", borderRadius: 6,
                          border: form.icon === icon ? "2px solid var(--color-primary)" : "2px solid transparent",
                          background: "transparent", cursor: "pointer",
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="미션명 (예: 설거지)"
                    className="input"
                    maxLength={30}
                  />
                  {errors.name && <p style={{ color: "var(--color-error)", fontSize: "0.78rem" }}>{errors.name}</p>}

                  <CurrencyInput
                    id="chore_reward"
                    label="보상 금액"
                    value={form.reward}
                    onChange={v => setForm({ ...form, reward: v })}
                    max={100000}
                    error={errors.reward}
                  />

                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <select
                      value={form.frequency}
                      onChange={e => setForm({ ...form, frequency: e.target.value })}
                      className="input"
                      style={{ flex: 1 }}
                    >
                      <option value="daily">매일 가능</option>
                      <option value="weekly">주 1회</option>
                      <option value="once">1회성</option>
                    </select>
                    <select
                      value={form.max_per_day}
                      onChange={e => setForm({ ...form, max_per_day: Number(e.target.value) })}
                      className="input"
                      style={{ flex: 1 }}
                    >
                      <option value={1}>하루 1회</option>
                      <option value={2}>하루 2회</option>
                      <option value={3}>하루 3회</option>
                    </select>
                  </div>

                  {childMembers.length > 1 && (
                    <select
                      value={form.child_member_id}
                      onChange={e => setForm({ ...form, child_member_id: e.target.value })}
                      className="input"
                    >
                      <option value="">모든 자녀</option>
                      {childMembers.map(m => <option key={m.member_id} value={m.member_id}>{m.display_name}</option>)}
                    </select>
                  )}

                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button onClick={handleAdd} className="btn btn--primary" style={{ flex: 1 }}>추가</button>
                    <button onClick={() => { setShowForm(false); setErrors({}); }} className="btn btn--secondary">취소</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 승인 대기 탭 */}
          {tab === "pending" && (
            <>
              {pending.length === 0 && (
                <div style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-secondary)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
                  <p>승인 대기 중인 미션이 없어요</p>
                </div>
              )}
              {pending.map(entry => (
                <div key={entry.id} style={{
                  display: "flex", alignItems: "center", gap: "var(--space-2)",
                  padding: "var(--space-3)", borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-secondary)",
                }}>
                  <span style={{ fontSize: "1.2rem" }}>{entry.chore_icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{entry.chore_name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                      {entry.child_name} · {entry.reward.toLocaleString()}원 · {new Date(entry.completed_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <button onClick={() => handleApprove(entry.id)} className="btn btn--sm btn--primary" style={{ minWidth: 40 }}>✓</button>
                  <button onClick={() => handleReject(entry.id)} className="btn btn--sm btn--danger" style={{ minWidth: 40 }}>✗</button>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="modal-footer modal-footer--stretch">
          {tab === "list" && !showForm && (
            <button onClick={() => setShowForm(true)} className="btn btn--primary btn--full">
              + 미션 추가
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
