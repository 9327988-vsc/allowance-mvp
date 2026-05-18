// src/components/widgets/DashboardSummary.jsx — 홈 상단 합계 카드 (그라데이션 + 상세 펼침)
import { useState, useMemo } from "react";
import { formatAmountShort } from "../../utils/formatAmount";
import { getCategoryIcon } from "../../constants/categories";
import { loadCustomCategories } from "../../utils/storage";
import { checkSpendingLimit } from "../../utils/spendingLimit";
import StatusBadge from "./StatusBadge";

export default function DashboardSummary({ calc, viewMonth, settings, claimStatus }) {
  const [expandedItem, setExpandedItem] = useState(null);
  const customCategories = useMemo(() => loadCustomCategories(), []);

  if (!calc) return null;

  const { base_allowance, school_total, academy_total, extra_items_total, recurring_extras_total, total, school_days_count, academy_days_count } = calc;
  const recTotal = recurring_extras_total || 0;
  const recurringExtras = calc.recurring_extras ?? [];

  // 빠진 날
  const skippedDays = (calc.cells || []).filter(c => c.skip_school || c.skip_academy);
  const schoolSkipped = skippedDays.filter(c => c.skip_school).length;
  const academySkipped = skippedDays.filter(c => c.skip_academy).length;

  // 임시 항목 카테고리별 그룹
  const extraGroups = {};
  (calc.cells || []).forEach(c => {
    (c.extra_items || []).forEach(item => {
      const cat = item.category;
      if (!extraGroups[cat]) {
        extraGroups[cat] = { count: 0, total: 0, icon: getCategoryIcon(cat, customCategories) };
      }
      extraGroups[cat].count++;
      extraGroups[cat].total += item.amount;
    });
  });

  // 지출 한도 체크
  const limitInfo = checkSpendingLimit(extra_items_total, settings);

  function toggleExpand(key) {
    setExpandedItem(prev => prev === key ? null : key);
  }

  return (
    <div className="dashboard-summary">
      <div className="dashboard-summary__inner">

      {/* 합계 */}
      <div className="dashboard-summary__total">
        <div className="dashboard-summary__total-left">
          <span className="dashboard-summary__label">{viewMonth}월 합계</span>
          {claimStatus && <StatusBadge status={claimStatus} size="sm" />}
        </div>
        <span className="dashboard-summary__amount">
          {formatAmountShort(total)}<span className="amount-unit">원</span>
        </span>
      </div>

      {/* 항목 버튼들 */}
      <div className="dashboard-summary__items">
        {base_allowance > 0 && (
          <SummaryItem
            icon="💰"
            label="기본"
            amount={base_allowance}
            color="var(--color-primary)"
            active={expandedItem === "base"}
            onClick={() => toggleExpand("base")}
          />
        )}
        {school_total > 0 && (
          <SummaryItem
            icon="🏫"
            label="학교"
            amount={school_total}
            color="var(--color-school)"
            active={expandedItem === "school"}
            onClick={() => toggleExpand("school")}
          />
        )}
        {academy_total > 0 && (
          <SummaryItem
            icon="✏️"
            label="학원"
            amount={academy_total}
            color="var(--color-academy)"
            active={expandedItem === "academy"}
            onClick={() => toggleExpand("academy")}
          />
        )}
        {extra_items_total > 0 && (
          <SummaryItem
            icon="🎒"
            label="기타"
            amount={extra_items_total}
            color="var(--color-extra)"
            active={expandedItem === "extra"}
            onClick={() => toggleExpand("extra")}
          />
        )}
        {recTotal > 0 && (
          <SummaryItem
            icon="💵"
            label="정기"
            amount={recTotal}
            color="var(--color-success)"
            active={expandedItem === "recurring"}
            onClick={() => toggleExpand("recurring")}
          />
        )}
      </div>

      {/* 펼침 상세 */}
      {expandedItem && (
        <div className="dashboard-summary__detail">
          {expandedItem === "base" && (
            <div className="dashboard-summary__detail-content">
              <p>매월 고정 기본 용돈</p>
              <p className="dashboard-summary__detail-formula">
                {formatAmountShort(base_allowance)}원 × 1개월
              </p>
            </div>
          )}
          {expandedItem === "school" && (
            <div className="dashboard-summary__detail-content">
              <p>🏫 등교일 <strong>{school_days_count}일</strong> × {formatAmountShort(settings?.school?.fare)}원 × {settings?.school?.round_trip ? "왕복" : "편도"}</p>
              {schoolSkipped > 0 && (
                <p className="dashboard-summary__detail-skip">🚫 결석 {schoolSkipped}일 제외됨</p>
              )}
              <p className="dashboard-summary__detail-formula">
                {(Array.isArray(settings?.school?.days) ? settings.school.days : []).map(d => ({sun:"일",mon:"월",tue:"화",wed:"수",thu:"목",fri:"금",sat:"토"}[d])).join("·")} 등교
              </p>
            </div>
          )}
          {expandedItem === "academy" && (
            <div className="dashboard-summary__detail-content">
              <p>✏️ 등원일 <strong>{academy_days_count}일</strong> × {formatAmountShort(settings?.academy?.fare)}원 × {settings?.academy?.round_trip ? "왕복" : "편도"}</p>
              {academySkipped > 0 && (
                <p className="dashboard-summary__detail-skip">🚫 결석 {academySkipped}일 제외됨</p>
              )}
              <p className="dashboard-summary__detail-formula">
                {(Array.isArray(settings?.academy?.days) ? settings.academy.days : []).map(d => ({sun:"일",mon:"월",tue:"화",wed:"수",thu:"목",fri:"금",sat:"토"}[d])).join("·")} 등원
              </p>
            </div>
          )}
          {expandedItem === "extra" && (
            <div className="dashboard-summary__detail-content">
              {Object.entries(extraGroups).map(([cat, g]) => (
                <p key={cat}>{g.icon} {cat} {g.count}건 — {formatAmountShort(g.total)}원</p>
              ))}
              {limitInfo.limit && limitInfo.percent >= 80 && (
                <p className="dashboard-summary__detail-skip">
                  {limitInfo.exceeded ? "⚠️" : "💡"} 한도 {limitInfo.percent}% 사용
                  ({limitInfo.exceeded ? "초과" : `잔여 ${limitInfo.remaining.toLocaleString()}원`})
                </p>
              )}
            </div>
          )}
          {expandedItem === "recurring" && (
            <div className="dashboard-summary__detail-content">
              {recurringExtras.map((item, i) => (
                <p key={i}>💵 {item.name} — {formatAmountShort(item.amount)}원</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 빠진 날 요약 */}
      {skippedDays.length > 0 && !expandedItem && (
        <div className="dashboard-summary__skip">
          🚫 빠진 날 {skippedDays.length}일 반영됨
        </div>
      )}

      </div>{/* /__inner */}
    </div>
  );
}

function SummaryItem({ icon, label, amount, color, active, onClick }) {
  return (
    <button
      className={`dashboard-summary__btn${active ? " dashboard-summary__btn--active" : ""}`}
      onClick={onClick}
      style={{ "--item-color": color }}
    >
      <span className="dashboard-summary__btn-icon">{icon}</span>
      <span className="dashboard-summary__btn-label">{label}</span>
      <span className="dashboard-summary__btn-amount">{formatAmountShort(amount)}</span>
    </button>
  );
}
