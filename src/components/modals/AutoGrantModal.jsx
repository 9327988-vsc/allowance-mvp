// src/components/modals/AutoGrantModal.jsx — 자동 정기 용돈 스케줄 관리
import { useState } from "react";
import { loadSchedules, addSchedule, removeSchedule, toggleSchedule } from "../../utils/autoGrant";
import { useModalBase } from "../../hooks/useModalBase";
import CurrencyInput from "../inputs/CurrencyInput";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export default function AutoGrantModal({ childMembers = [], onClose }) {
  const modalRef = useModalBase(onClose);
  const [schedules, setSchedules] = useState(() => loadSchedules());
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    child_member_id: childMembers.length === 1 ? childMembers[0].member_id : "",
    name: "",
    amount: 0,
    frequency: "weekly",
    day_of_week: 1, // 월요일
    day_of_month: 1,
  });
  const [errors, setErrors] = useState({});

  // ESC handled by useModalBase

  function handleAdd() {
    if (submitting) return;
    const errs = {};
    if (!form.child_member_id && childMembers.length > 1) errs.child = "자녀를 선택해주세요";
    if (childMembers.length === 0) errs.child = "등록된 자녀가 없어요";
    if (!form.name.trim()) errs.name = "항목명을 입력해주세요";
    if (!form.amount || form.amount < 100) errs.amount = "100원 이상 입력해주세요";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    const childId = form.child_member_id || childMembers[0]?.member_id;
    const child = childMembers.find(m => m.member_id === childId);
    addSchedule({
      child_member_id: childId,
      child_name: child?.display_name || "자녀",
      name: form.name.trim(),
      amount: form.amount,
      frequency: form.frequency,
      day_of_week: form.day_of_week,
      day_of_month: form.day_of_month,
    });
    setSchedules(loadSchedules());
    setShowForm(false);
    setForm({ ...form, name: "", amount: 0 });
    setErrors({});
    setSubmitting(false);
  }

  function handleToggle(id) {
    toggleSchedule(id);
    setSchedules(loadSchedules());
  }

  function handleRemove(id) {
    removeSchedule(id);
    setSchedules(loadSchedules());
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        tabIndex={-1}
        className="modal-content"
        style={{ maxWidth: 440, width: "90%", padding: 0 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="자동 정기 용돈"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 className="modal-title">🔄 자동 정기 용돈</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {schedules.length === 0 && !showForm && (
            <div style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-secondary)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📅</div>
              <p>설정된 자동 지급 스케줄이 없어요</p>
              <p style={{ fontSize: "0.8rem" }}>매주/매월 자동으로 용돈을 지급해보세요</p>
            </div>
          )}

          {/* 기존 스케줄 목록 */}
          {schedules.map(s => (
            <div key={s.id} className="auto-grant-item" style={{
              display: "flex", alignItems: "center", gap: "var(--space-2)",
              padding: "var(--space-3)", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-secondary)",
              opacity: s.enabled ? 1 : 0.5,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                  {s.child_name} · {s.amount.toLocaleString("ko-KR")}원 ·{" "}
                  {s.frequency === "weekly" ? `매주 ${DAY_NAMES[s.day_of_week]}요일` : `매월 ${s.day_of_month}일`}
                </div>
              </div>
              <button
                onClick={() => handleToggle(s.id)}
                className="btn btn--sm"
                style={{ minWidth: 40, fontSize: "0.8rem" }}
                aria-label={s.enabled ? "일시정지" : "재개"}
              >
                {s.enabled ? "⏸" : "▶️"}
              </button>
              <button
                onClick={() => handleRemove(s.id)}
                className="btn btn--sm btn--danger"
                style={{ minWidth: 40, fontSize: "0.8rem" }}
                aria-label="삭제"
              >
                🗑
              </button>
            </div>
          ))}

          {/* 추가 폼 */}
          {showForm && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "var(--color-bg-secondary)" }}>
              {childMembers.length > 1 && (
                <select
                  value={form.child_member_id}
                  onChange={e => setForm({ ...form, child_member_id: e.target.value })}
                  className="input"
                  aria-label="대상 자녀"
                >
                  <option value="">자녀 선택</option>
                  {childMembers.map(m => <option key={m.member_id} value={m.member_id}>{m.display_name}</option>)}
                </select>
              )}
              {errors.child && <p style={{ color: "var(--color-error)", fontSize: "0.78rem" }}>{errors.child}</p>}

              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="항목명 (예: 주간 용돈)"
                className="input"
                maxLength={30}
                aria-label="항목명"
              />
              {errors.name && <p style={{ color: "var(--color-error)", fontSize: "0.78rem" }}>{errors.name}</p>}

              <CurrencyInput
                id="auto_grant_amount"
                label="금액"
                value={form.amount}
                onChange={v => setForm({ ...form, amount: v })}
                max={1000000}
                error={errors.amount}
              />

              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <select
                  value={form.frequency}
                  onChange={e => setForm({ ...form, frequency: e.target.value })}
                  className="input"
                  style={{ flex: 1 }}
                  aria-label="주기"
                >
                  <option value="weekly">매주</option>
                  <option value="monthly">매월</option>
                </select>

                {form.frequency === "weekly" ? (
                  <select
                    value={form.day_of_week}
                    onChange={e => setForm({ ...form, day_of_week: Number(e.target.value) })}
                    className="input"
                    style={{ flex: 1 }}
                    aria-label="요일"
                  >
                    {DAY_NAMES.map((name, i) => <option key={i} value={i}>{name}요일</option>)}
                  </select>
                ) : (
                  <select
                    value={form.day_of_month}
                    onChange={e => setForm({ ...form, day_of_month: Number(e.target.value) })}
                    className="input"
                    style={{ flex: 1 }}
                    aria-label="날짜"
                  >
                    {Array.from({ length: 28 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}일</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button onClick={handleAdd} disabled={submitting} className="btn btn--primary" style={{ flex: 1 }}>추가</button>
                <button onClick={() => { setShowForm(false); setErrors({}); }} className="btn btn--secondary">취소</button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer modal-footer--stretch">
          {!showForm && childMembers.length > 0 && (
            <button onClick={() => setShowForm(true)} className="btn btn--primary btn--full">
              + 스케줄 추가
            </button>
          )}
          {!showForm && childMembers.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: "0.8rem", padding: "var(--space-2)" }}>
              등록된 자녀가 없어 스케줄을 추가할 수 없어요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
