// src/components/modals/BudgetSettingsModal.jsx — 예산 + 급여 실수령액 계산
import { useState, useMemo } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { loadSettingsForUser, saveSettingsForUser } from "../../utils/storage";
import { calculateNetSalary } from "../../utils/salaryCalculator";
import { showToast } from "../../utils/toastManager";
import CurrencyInput from "../inputs/CurrencyInput";

/** 금액을 읽기 쉽게 표시 (예: 3,500,000 → "350만") */
function readableAmount(value) {
  if (!value || value <= 0) return "";
  const abs = Math.abs(value);
  if (abs >= 100000000) {
    const eok = Math.floor(abs / 100000000);
    const rest = abs % 100000000;
    const man = Math.floor(rest / 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
  }
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const rest = abs % 10000;
    return rest > 0 ? `${man.toLocaleString()}만 ${rest.toLocaleString()}` : `${man.toLocaleString()}만`;
  }
  return abs.toLocaleString();
}

/** 금액 포맷 (콤마 + 원) */
function fmt(value) {
  if (typeof value !== "number" || isNaN(value)) return "0원";
  return `${Math.round(value).toLocaleString()}원`;
}

export default function BudgetSettingsModal({ userId, onClose, onSaved }) {
  const contentRef = useModalBase(onClose);
  const [settings, setSettings] = useState(() => loadSettingsForUser(userId) || {});
  const [budget, setBudget] = useState(settings.monthly_budget || 0);
  const [grossSalary, setGrossSalary] = useState(settings.salary_gross || 0);
  const [showSalaryCalc, setShowSalaryCalc] = useState(!!settings.salary_gross);

  const salaryResult = useMemo(() => calculateNetSalary(grossSalary), [grossSalary]);


  function handleSave() {
    const updated = {
      ...settings,
      monthly_budget: budget,
      salary_gross: grossSalary,
      updated_at: new Date().toISOString(),
    };
    const result = saveSettingsForUser(userId, updated);
    if (result.success) {
      showToast({ type: "success", message: "예산 설정이 저장되었습니다" });
      onSaved(updated);
    } else {
      showToast({ type: "error", message: "저장 실패" });
    }
  }

  function handleSetBudgetFromNet() {
    if (salaryResult.net > 0) {
      setBudget(salaryResult.net);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 460, width: "95%" }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="예산 관리"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 className="modal-title">📊 예산 관리</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        <div style={{ padding: "var(--space-4)" }}>
          {/* 월 예산 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">월 예산</label>
            <CurrencyInput
              value={budget}
              onChange={setBudget}
              max={999999999}
              placeholder="월 예산 금액"
            />
            {budget > 0 && (
              <p className="text-xs mt-1" style={{ color: "var(--color-primary)" }}>
                = {readableAmount(budget)}원
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>
              매월 사용 가능한 총 금액을 설정하세요
            </p>
          </div>

          {/* 급여 계산기 토글 */}
          <button
            type="button"
            className="w-full text-left text-sm font-medium mb-3 p-2 rounded-md"
            style={{ background: "var(--color-bg-secondary)", color: "var(--color-primary)" }}
            onClick={() => setShowSalaryCalc(!showSalaryCalc)}
          >
            {showSalaryCalc ? "▼" : "▶"} 급여 실수령액 계산기
          </button>

          {showSalaryCalc && (
            <div className="salary-calculator">
              {/* 세전 급여 입력 */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">세전 급여 (월)</label>
                <CurrencyInput
                  value={grossSalary}
                  onChange={setGrossSalary}
                  max={999999999}
                  placeholder="세전 월급"
                />
                {grossSalary > 0 && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-primary)" }}>
                    = {readableAmount(grossSalary)}원
                  </p>
                )}
              </div>

              {/* 공제 내역 */}
              {grossSalary > 0 && (
                <div className="salary-breakdown">
                  <div className="salary-breakdown__header">
                    <span>공제 항목</span>
                    <span>금액</span>
                  </div>

                  {Object.entries(salaryResult.deductions).map(([key, value]) => (
                    <div key={key} className="salary-breakdown__row">
                      <span className="salary-breakdown__label">{key}</span>
                      <span className="salary-breakdown__value">-{fmt(value)}</span>
                    </div>
                  ))}

                  <div className="salary-breakdown__divider" />

                  <div className="salary-breakdown__row salary-breakdown__row--total">
                    <span>총 공제액</span>
                    <span style={{ color: "var(--color-expense, #c62828)" }}>
                      -{fmt(salaryResult.totalDeduction)}
                    </span>
                  </div>
                  {salaryResult.totalDeduction >= 10000 && (
                    <div className="salary-breakdown__row">
                      <span />
                      <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                        = {readableAmount(salaryResult.totalDeduction)}원
                      </span>
                    </div>
                  )}

                  <div className="salary-breakdown__row salary-breakdown__row--net">
                    <span>실수령액</span>
                    <span style={{ color: "var(--color-income, #2e7d32)", fontWeight: 700 }}>
                      {fmt(salaryResult.net)}
                    </span>
                  </div>
                  {salaryResult.net >= 10000 && (
                    <div className="salary-breakdown__row">
                      <span />
                      <span className="text-xs" style={{ color: "var(--color-income, #2e7d32)" }}>
                        = {readableAmount(salaryResult.net)}원
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn--secondary w-full mt-3"
                    onClick={handleSetBudgetFromNet}
                  >
                    실수령액으로 예산 설정
                  </button>

                  <p className="text-xs mt-2" style={{ color: "var(--color-text-tertiary)" }}>
                    * 간이세액 기준 추정치이며, 실제 금액과 다를 수 있습니다
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="modal-footer modal-footer--end" style={{ padding: "var(--space-3) var(--space-4)" }}>
          <button onClick={onClose} className="btn btn--secondary">취소</button>
          <button onClick={handleSave} className="btn btn--primary">저장</button>
        </div>
      </div>
    </div>
  );
}
