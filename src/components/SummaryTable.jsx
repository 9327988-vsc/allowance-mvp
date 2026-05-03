// src/components/SummaryTable.jsx — S-401 정산표 + S-403 빈 상태
import { getCategoryIcon } from "../constants/categories";
import { loadCustomCategories } from "../utils/storage";

function shouldShowEmptyState(calc) {
  return (
    calc.base_allowance === 0 &&
    calc.school_total === 0 &&
    calc.academy_total === 0 &&
    calc.extra_items_total === 0
  );
}

export default function SummaryTable({ month, calc, settings }) {
  if (!calc) return null;

  // S-403 빈 상태
  if (shouldShowEmptyState(calc)) {
    return (
      <div className="summary-table summary-table--empty">
        <div className="text-center py-8" style={{ color: "var(--color-text-secondary)" }}>
          <div className="text-3xl mb-2">📭</div>
          <p>이번 달 청구할 항목이 없습니다.</p>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)" }}>
            학교 등교일이나 임시 항목을 등록하면 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  // 임시 항목 그룹화 (카테고리별 합산)
  const customCategories = loadCustomCategories();
  const allExtras = [];
  (calc.cells || []).forEach(c => {
    (c.extra_items || []).forEach(item => {
      allExtras.push({ ...item, date: c.date });
    });
  });
  allExtras.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : (a.created_at || "").localeCompare(b.created_at || "");
  });

  // 카테고리별 그룹
  const categoryGroups = {};
  allExtras.forEach(item => {
    const cat = item.category;
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = { count: 0, total: 0, icon: getCategoryIcon(cat, customCategories) };
    }
    categoryGroups[cat].count++;
    categoryGroups[cat].total += item.amount;
  });

  const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

  return (
    <div className="summary-table">
      <h2 className="summary-table__title">{month}월 정산</h2>

      <div className="summary-table__rows">
        {/* 기본 용돈 */}
        <SummaryRow
          icon="💰"
          label="기본 용돈"
          formula={isDesktop ? `${calc.base_allowance.toLocaleString()} × 1` : null}
          amount={calc.base_allowance}
        />

        {/* 학교 버스 */}
        {calc.school_total > 0 && (
          <SummaryRow
            icon="🏫"
            label="학교 버스"
            formula={isDesktop ? `${settings.school.fare.toLocaleString()} × ${settings.school.round_trip ? 2 : 1} × ${calc.school_days_count}일` : null}
            amount={calc.school_total}
          />
        )}

        {/* 학원 버스 */}
        {calc.academy_total > 0 && (
          <SummaryRow
            icon="📚"
            label="학원 버스"
            formula={isDesktop ? `${settings.academy.fare.toLocaleString()} × ${settings.academy.round_trip ? 2 : 1} × ${calc.academy_days_count}일` : null}
            amount={calc.academy_total}
          />
        )}

        {/* 임시 항목 (카테고리별) */}
        {Object.entries(categoryGroups).map(([cat, g]) => (
          <SummaryRow
            key={cat}
            icon={g.icon}
            label={g.count > 1 ? `${cat} ${g.count}건` : cat}
            amount={g.total}
          />
        ))}

        {/* 구분선 */}
        <div className="summary-table__divider" />

        {/* 합계 */}
        <div className="summary-table__total">
          <span>합계</span>
          <span className="font-bold">{calc.total.toLocaleString()}원</span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, formula, amount }) {
  return (
    <div className="summary-row">
      <span className="summary-row__label">
        {icon} {label}
      </span>
      {formula && (
        <span className="summary-row__formula">{formula}</span>
      )}
      <span className="summary-row__amount">{amount.toLocaleString()}원</span>
    </div>
  );
}
