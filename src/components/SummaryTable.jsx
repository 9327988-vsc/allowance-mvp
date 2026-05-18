// src/components/SummaryTable.jsx — S-401 정산표 + S-403 빈 상태
import { useState, useMemo, useEffect } from "react";
import { getCategoryIcon } from "../constants/categories";
import { loadCustomCategories } from "../utils/storage";
import { formatAmountShort } from "../utils/formatAmount";
import { checkSpendingLimit } from "../utils/spendingLimit";
import { generateInsights } from "../utils/reportGenerator";
import { getMonthlyChoreReward } from "../utils/chores";
import StatusBadge from "./widgets/StatusBadge";

function shouldShowEmptyState(calc) {
  return (
    calc.base_allowance === 0 &&
    (calc.recurring_extras_total || 0) === 0 &&
    calc.school_total === 0 &&
    calc.academy_total === 0 &&
    calc.extra_items_total === 0
  );
}

export default function SummaryTable({ year, month, calc, settings, claimStatus, childMemberId }) {
  // 임시 항목 그룹화 (카테고리별 합산)
  const customCategories = useMemo(() => loadCustomCategories(), []);
  const choreReward = useMemo(() => {
    if (!childMemberId || !year || !month) return 0;
    return getMonthlyChoreReward(childMemberId, year, month);
  }, [childMemberId, year, month]);
  const [expanded, setExpanded] = useState(false);
  // 월 변경 시 접기 초기화
  useEffect(() => {
    setExpanded(false);
  }, [month]);

  const insightItems = useMemo(() => {
    if (!year) return [];
    return generateInsights(year, month);
  }, [year, month]);

  if (!calc) return null;

  // S-403 빈 상태
  if (shouldShowEmptyState(calc)) {
    return (
      <div className="summary-table summary-table--empty">
        <div className="empty-state">
          <div className="empty-state__icon">📭</div>
          <div className="empty-state__title">아직 청구할 항목이 없어요</div>
          <div className="empty-state__desc">
            캘린더에서 날짜를 눌러<br />임시 항목을 추가해보세요!
          </div>
          <div className="empty-state__hints">
            <span className="empty-state__hint">🏫 학교 등교일 자동 계산</span>
            <span className="empty-state__hint">✏️ 학원 등원일 자동 계산</span>
            <span className="empty-state__hint">🎒 임시 항목 직접 추가</span>
          </div>
        </div>
      </div>
    );
  }
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

  const isDesktop = useMemo(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches, []);

  return (
    <div className="summary-table">
      {/* 합계 헤더 (항상 표시, 탭하면 상세 토글) */}
      <button
        className="summary-table__header"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
      >
        <span className="summary-table__header-title">{month}월 정산</span>
        {claimStatus && <StatusBadge status={claimStatus} size="sm" />}
        <span className="summary-table__header-spacer" />
        <span className="summary-table__header-amount">
          {formatAmountShort(calc.total + choreReward)}<span className="amount-unit">원</span>
        </span>
        <span className={`summary-table__chevron${expanded ? " summary-table__chevron--open" : ""}`}>▼</span>
      </button>

      {/* 지출 한도 경고 */}
      {(() => {
        const limitInfo = checkSpendingLimit(calc.extra_items_total, settings);
        if (!limitInfo.limit) return null;
        if (limitInfo.exceeded) {
          return (
            <div className="spending-limit-warn spending-limit-warn--over">
              ⚠️ 임시 항목이 한도({limitInfo.limit.toLocaleString()}원)를 {Math.abs(limitInfo.remaining).toLocaleString()}원 초과
            </div>
          );
        }
        if (limitInfo.percent >= 80) {
          return (
            <div className="spending-limit-warn">
              💡 임시 항목 한도 {limitInfo.percent}% 사용 (잔여: {limitInfo.remaining.toLocaleString()}원)
            </div>
          );
        }
        return null;
      })()}

      {/* 상세 항목 (접기/펼치기) */}
      {expanded && (
        <div className="summary-table__rows summary-table__rows--animated">
          {/* 기본 용돈 */}
          <SummaryRow
            icon="💰"
            label="기본 용돈"
            formula={isDesktop ? `${formatAmountShort(calc.base_allowance)} × 1` : null}
            amount={calc.base_allowance}
          />

          {/* 학교 버스 */}
          {calc.school_total > 0 && (
            <SummaryRow
              icon="🏫"
              label="학교 버스"
              formula={isDesktop ? `${formatAmountShort(settings.school.fare)} × ${settings.school.round_trip ? 2 : 1} × ${calc.school_days_count}일` : null}
              amount={calc.school_total}
            />
          )}

          {/* 학원 버스 */}
          {calc.academy_total > 0 && (
            <SummaryRow
              icon="✏️"
              label="학원 버스"
              formula={isDesktop ? `${formatAmountShort(settings.academy.fare)} × ${settings.academy.round_trip ? 2 : 1} × ${calc.academy_days_count}일` : null}
              amount={calc.academy_total}
            />
          )}

          {/* 정기 추가 용돈 */}
          {(calc.recurring_extras ?? []).map((item, i) => (
            <SummaryRow
              key={`recurring_${i}`}
              icon="💵"
              label={item.name}
              amount={item.amount}
            />
          ))}

          {/* 임시 항목 (카테고리별) */}
          {Object.entries(categoryGroups).map(([cat, g]) => (
            <SummaryRow
              key={cat}
              icon={g.icon}
              label={g.count > 1 ? `${cat} ${g.count}건` : cat}
              amount={g.total}
            />
          ))}

          {/* 미션 보상 */}
          {choreReward > 0 && (
            <SummaryRow
              icon="🏠"
              label="미션 보상"
              amount={choreReward}
            />
          )}

          {/* 월간 인사이트 */}
          {insightItems.length > 0 && (
            <div className="summary-insights">
              {insightItems.slice(0, 3).map((ins, i) => (
                <div key={i} className="summary-insights__item">
                  <span>{ins.icon}</span> {ins.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
      <span className="summary-row__amount">
        {formatAmountShort(amount)}<span className="amount-unit">원</span>
      </span>
    </div>
  );
}
