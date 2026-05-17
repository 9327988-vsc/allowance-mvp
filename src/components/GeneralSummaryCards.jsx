// src/components/GeneralSummaryCards.jsx — 일반계정 월별 요약 카드
import { formatAmount } from "../utils/formatAmount";

export default function GeneralSummaryCards({ calc, budget }) {
  if (!calc) return null;

  const { totalIncome, totalExpense, balance } = calc;
  const hasBudget = budget > 0;
  const budgetRemaining = hasBudget ? budget - totalExpense : 0;
  const budgetPercent = hasBudget ? Math.min(100, Math.round((totalExpense / budget) * 100)) : 0;

  return (
    <div className="general-summary">
      {/* 수입 */}
      <div className="general-summary-card general-summary-card--income">
        <div className="general-summary-card__label">수입</div>
        <div className="general-summary-card__amount">
          {formatAmount(totalIncome)}
        </div>
      </div>

      {/* 지출 */}
      <div className="general-summary-card general-summary-card--expense">
        <div className="general-summary-card__label">지출</div>
        <div className="general-summary-card__amount">
          {formatAmount(totalExpense)}
        </div>
      </div>

      {/* 잔액 */}
      <div className={`general-summary-card ${balance >= 0 ? "general-summary-card--positive" : "general-summary-card--negative"}`}>
        <div className="general-summary-card__label">잔액</div>
        <div className="general-summary-card__amount">
          {balance < 0 ? "-" : ""}{formatAmount(Math.abs(balance))}
        </div>
      </div>

      {/* 예산 (설정 시) */}
      {hasBudget && (
        <div className={`general-summary-card general-summary-card--budget ${budgetRemaining < 0 ? "general-summary-card--over" : ""}`}>
          <div className="general-summary-card__label">
            예산 잔여 {budgetRemaining < 0 ? "(초과)" : ""}
          </div>
          <div className="general-summary-card__amount">
            {budgetRemaining < 0 ? "-" : ""}{formatAmount(Math.abs(budgetRemaining))}
          </div>
          <div className="budget-progress">
            <div
              className={`budget-progress__bar ${budgetPercent >= 100 ? "budget-progress__bar--over" : budgetPercent >= 80 ? "budget-progress__bar--warn" : ""}`}
              style={{ width: `${Math.min(100, budgetPercent)}%` }}
            />
          </div>
          <div className="budget-progress__label">{budgetPercent}% 사용</div>
        </div>
      )}
    </div>
  );
}
