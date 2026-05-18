// src/components/modals/CreateGrantModal.jsx — 부모 추가 지급 등록
import { useState } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import CurrencyInput from "../inputs/CurrencyInput";

export default function CreateGrantModal({ childMembers = [], onSubmit, onClose, loading }) {
  const [childMemberId, setChildMemberId] = useState(childMembers.length === 1 ? childMembers[0].member_id : "");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});
  const contentRef = useModalBase(onClose, { active: !loading });

  function validate() {
    const errs = {};
    if (!childMemberId) errs.child = "자녀를 선택해주세요";
    if (!name.trim()) errs.name = "항목명을 입력해주세요";
    else if (name.length > 50) errs.name = "50자 이내로 입력해주세요";
    if (typeof amount !== "number" || isNaN(amount) || amount < 100) errs.amount = "100원 이상 입력해주세요";
    else if (amount > 10000000) errs.amount = "10,000,000원 이하로 입력해주세요";
    if (reason.length > 200) errs.reason = "200자 이내로 입력해주세요";
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      child_member_id: childMemberId,
      name: name.trim(),
      amount: amount,
      reason: reason.trim(),
    });
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-2)" }} onClick={loading ? undefined : onClose}>
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 420, width: "90%", padding: 0 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="추가 지급 등록"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 className="modal-title">💝 추가 지급 등록</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* 자녀 선택 */}
          {childMembers.length > 1 && (
            <div className="flex flex-col gap-1">
              <label htmlFor="grant_child" className="text-sm font-medium">받을 자녀</label>
              <select
                id="grant_child"
                value={childMemberId}
                onChange={e => { setChildMemberId(e.target.value); setErrors(prev => ({ ...prev, child: undefined })); }}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: errors.child ? "var(--color-error)" : "var(--color-border)", fontSize: "var(--font-size-base)" }}
                disabled={loading}
              >
                <option value="">선택해주세요</option>
                {childMembers.map(m => (
                  <option key={m.member_id} value={m.member_id}>{m.display_name}</option>
                ))}
              </select>
              {errors.child && <p className="text-xs" style={{ color: "var(--color-error)" }}>{errors.child}</p>}
            </div>
          )}

          {/* 항목명 */}
          <div className="flex flex-col gap-1">
            <label htmlFor="grant_name" className="text-sm font-medium">항목명</label>
            <input
              id="grant_name"
              type="text"
              maxLength={50}
              value={name}
              onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
              placeholder="예: 시험 잘 봐서 보너스"
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: errors.name ? "var(--color-error)" : "var(--color-border)", fontSize: "var(--font-size-base)" }}
              disabled={loading}
            />
            {errors.name && <p className="text-xs" style={{ color: "var(--color-error)" }}>{errors.name}</p>}
          </div>

          {/* 금액 */}
          <CurrencyInput
            id="grant_amount"
            label="금액"
            value={amount}
            onChange={(num) => { setAmount(num); setErrors(prev => ({ ...prev, amount: undefined })); }}
            max={10000000}
            error={errors.amount}
            disabled={loading}
          />

          {/* 사유 (선택) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="grant_reason" className="text-sm font-medium">사유 <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>(선택)</span></label>
            <textarea
              id="grant_reason"
              value={reason}
              onChange={e => { setReason(e.target.value); setErrors(prev => ({ ...prev, reason: undefined })); }}
              maxLength={200}
              rows={2}
              placeholder="예: 수학 100점!"
              className="w-full border rounded-md p-2 resize-none"
              style={{ fontSize: "var(--font-size-base)", borderColor: errors.reason ? "var(--color-error)" : "var(--color-border)" }}
              disabled={loading}
            />
            <div className="flex justify-between text-xs" style={{ color: errors.reason ? "var(--color-error)" : "var(--color-text-tertiary)" }}>
              <span>{errors.reason || ""}</span>
              <span>{reason.length}/200</span>
            </div>
          </div>
        </div>

        <div className="modal-footer modal-footer--stretch">
          <button onClick={onClose} className="btn btn--secondary" disabled={loading}>취소</button>
          <button onClick={handleSubmit} className="btn btn--primary" disabled={loading}>
            {loading ? "등록 중..." : "지급 등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
