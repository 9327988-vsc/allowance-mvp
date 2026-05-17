// src/components/modals/SpendingStatsModal.jsx — 통계 모달 (지출 통계 + 부모용 청구 차트 + 월간 리포트)
import { useState, useEffect, useMemo } from "react";
import { formatAmountShort } from "../../utils/formatAmount";
import DonutChart, { DonutLegend } from "../charts/DonutChart";
import LineChart from "../charts/LineChart";
import { generateMonthlyReport, generateReportText } from "../../utils/reportGenerator";
import { copyToClipboard } from "../../utils/clipboard";
import { showToast } from "../../utils/toastManager";

/**
 * localStorage에서 calendar_v1 데이터를 스캔하여 카테고리별 지출 집계
 */
function getMonthlySpending(year, month) {
  const key = `calendar_v1_${year}_${String(month).padStart(2, "0")}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { categories: new Map(), total: 0, incomeTotal: 0 };

  let cal;
  try { cal = JSON.parse(raw); } catch { return { categories: new Map(), total: 0, incomeTotal: 0 }; }

  const categories = new Map();
  let total = 0;
  let incomeTotal = 0;

  for (const cell of Object.values(cal.cells || {})) {
    for (const item of (cell.extra_items || [])) {
      const amount = Math.abs(item.amount || 0);
      if (amount === 0) continue;

      if (item.type === "income") {
        incomeTotal += amount;
        continue;
      }

      total += amount;
      const cat = item.category || "기타";
      categories.set(cat, (categories.get(cat) || 0) + amount);
    }
  }

  return { categories, total, incomeTotal };
}

/**
 * 최근 N개월 월별 지출 추이
 */
function getMonthlyTrend(currentYear, currentMonth, months = 6) {
  const trend = [];
  let y = currentYear;
  let m = currentMonth;

  for (let i = 0; i < months; i++) {
    const { total } = getMonthlySpending(y, m);
    trend.unshift({ year: y, month: m, total });
    m--;
    if (m === 0) { m = 12; y--; }
  }

  return trend;
}

export default function SpendingStatsModal({ role, familyContext, claims, onClose }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState("spending"); // "spending" | "claims" | "report"

  useEffect(() => {
    function handleEsc(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const spending = useMemo(() => getMonthlySpending(viewYear, viewMonth), [viewYear, viewMonth]);
  const trend = useMemo(() => getMonthlyTrend(viewYear, viewMonth, 6), [viewYear, viewMonth]);

  const sortedCategories = useMemo(() => {
    return [...spending.categories.entries()]
      .sort((a, b) => b[1] - a[1]);
  }, [spending.categories]);

  // 부모용 청구 차트 데이터
  const currentYear = now.getFullYear();
  const claimsData = useMemo(() => {
    if (!claims) return null;
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1, total: 0, approved: 0, rejected: 0, pending: 0, count: 0,
    }));
    claims.forEach((c) => {
      if (c.year !== currentYear) return;
      const idx = c.month - 1;
      if (idx < 0 || idx > 11) return;
      data[idx].count++;
      data[idx].total += c.total || 0;
      if (c.status === "approved" || c.status === "paid") data[idx].approved += c.total || 0;
      else if (c.status === "rejected") data[idx].rejected += c.total || 0;
      else data[idx].pending += c.total || 0;
    });
    return data;
  }, [claims, currentYear]);

  const maxClaimsTotal = claimsData ? Math.max(...claimsData.map(d => d.total), 1) : 1;
  const yearTotal = claimsData ? claimsData.reduce((s, d) => s + d.total, 0) : 0;
  const yearApproved = claimsData ? claimsData.reduce((s, d) => s + d.approved, 0) : 0;
  const currentMonthIdx = now.getMonth();

  function handlePrevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }

  function handleNextMonth() {
    const nextM = viewMonth === 12 ? 1 : viewMonth + 1;
    const nextY = viewMonth === 12 ? viewYear + 1 : viewYear;
    const maxDate = new Date();
    if (nextY > maxDate.getFullYear() || (nextY === maxDate.getFullYear() && nextM > maxDate.getMonth() + 1)) return;
    setViewYear(nextY);
    setViewMonth(nextM);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 480, width: "95%", maxHeight: "90vh", overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="통계"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 className="modal-title">📊 통계</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        {/* 탭 전환 */}
        <div className="general-type-toggle" style={{ margin: "0 var(--space-4)", marginTop: "var(--space-3)" }}>
          <button
            className={`general-type-toggle__btn${tab === "spending" ? " general-type-toggle__btn--active" : ""}`}
            onClick={() => setTab("spending")}
          >
            지출 통계
          </button>
          {role === "parent" && claims && (
            <button
              className={`general-type-toggle__btn${tab === "claims" ? " general-type-toggle__btn--active" : ""}`}
              onClick={() => setTab("claims")}
            >
              청구 차트
            </button>
          )}
          <button
            className={`general-type-toggle__btn${tab === "report" ? " general-type-toggle__btn--active" : ""}`}
            onClick={() => setTab("report")}
          >
            리포트
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "var(--space-4)" }}>
          {/* 월 네비게이터 (claims 탭 제외) */}
          {tab !== "claims" && (
            <div className="flex items-center justify-between mb-4">
              <button onClick={handlePrevMonth} className="header-btn" aria-label="이전 달">◀</button>
              <span className="font-medium">{viewYear}년 {viewMonth}월</span>
              <button onClick={handleNextMonth} className="header-btn" aria-label="다음 달">▶</button>
            </div>
          )}

          {tab === "spending" && (
            <>
              {/* 요약 카드 */}
              <div className="stats-summary-cards">
                <div className="stats-summary-card">
                  <span className="stats-summary-card__icon">📉</span>
                  <span className="stats-summary-card__label">지출</span>
                  <span className="stats-summary-card__value" style={{ color: "var(--color-expense, #c62828)" }}>
                    {formatAmountShort(spending.total)}원
                  </span>
                </div>
                {spending.incomeTotal > 0 && (
                  <div className="stats-summary-card">
                    <span className="stats-summary-card__icon">📈</span>
                    <span className="stats-summary-card__label">수입</span>
                    <span className="stats-summary-card__value" style={{ color: "var(--color-income, #2e7d32)" }}>
                      {formatAmountShort(spending.incomeTotal)}원
                    </span>
                  </div>
                )}
                <div className="stats-summary-card">
                  <span className="stats-summary-card__icon">📊</span>
                  <span className="stats-summary-card__label">카테고리</span>
                  <span className="stats-summary-card__value">{sortedCategories.length}개</span>
                </div>
              </div>

              {/* 카테고리별 도넛 차트 */}
              {sortedCategories.length > 0 ? (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                    카테고리별 지출
                  </h3>
                  <div className="donut-chart-wrap">
                    <DonutChart
                      data={sortedCategories.map(([label, value]) => ({ label, value }))}
                      size={160}
                    />
                    <DonutLegend
                      data={sortedCategories.map(([label, value]) => ({ label, value }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="modal-empty mb-4">
                  <div className="modal-empty__icon">📭</div>
                  <p className="modal-empty__text">이번 달 지출 데이터가 없어요</p>
                  <div className="stats-guide">
                    <p className="stats-guide__title">💡 데이터 입력 방법</p>
                    <ol className="stats-guide__steps">
                      <li>캘린더에서 날짜를 탭하세요</li>
                      <li>&ldquo;+ 임시 항목 추가&rdquo;를 누르세요</li>
                      <li>지출/수입을 선택하고 금액을 입력하세요</li>
                      <li>저장하면 여기에 통계가 표시돼요!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* 월별 추이 꺾은선 차트 */}
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  최근 6개월 추이
                </h3>
                <LineChart
                  data={trend.map(t => ({ label: `${t.month}월`, value: t.total }))}
                  height={160}
                />
              </div>
            </>
          )}
          {tab === "claims" && (
            <>
              {/* 연간 요약 */}
              <div className="chart-summary">
                <div className="chart-summary__item">
                  <span className="chart-summary__label">총 청구</span>
                  <span className="chart-summary__value">{formatAmountShort(yearTotal)}<span className="amount-unit">원</span></span>
                </div>
                <div className="chart-summary__item">
                  <span className="chart-summary__label">승인 합계</span>
                  <span className="chart-summary__value chart-summary__value--success">{formatAmountShort(yearApproved)}<span className="amount-unit">원</span></span>
                </div>
              </div>

              {/* 바 차트 */}
              <div className="monthly-chart">
                {claimsData && claimsData.map((d, i) => (
                  <div
                    key={d.month}
                    className={`monthly-chart__col${i === currentMonthIdx ? " monthly-chart__col--current" : ""}`}
                  >
                    <div className="monthly-chart__bar-wrap">
                      {d.total > 0 && (
                        <span className="monthly-chart__bar-label">
                          {formatAmountShort(d.total)}
                        </span>
                      )}
                      <div className="monthly-chart__bar-track">
                        {d.approved > 0 && (
                          <div
                            className="monthly-chart__bar monthly-chart__bar--approved"
                            style={{ height: `${(d.approved / maxClaimsTotal) * 100}%` }}
                          />
                        )}
                        {d.pending > 0 && (
                          <div
                            className="monthly-chart__bar monthly-chart__bar--pending"
                            style={{ height: `${(d.pending / maxClaimsTotal) * 100}%` }}
                          />
                        )}
                        {d.rejected > 0 && (
                          <div
                            className="monthly-chart__bar monthly-chart__bar--rejected"
                            style={{ height: `${(d.rejected / maxClaimsTotal) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="monthly-chart__label">{d.month}월</span>
                    {d.count > 0 && <span className="monthly-chart__count">{d.count}건</span>}
                  </div>
                ))}
              </div>

              {/* 범례 */}
              <div className="chart-legend">
                <span className="chart-legend__item"><span className="chart-legend__dot chart-legend__dot--approved" />승인/지급</span>
                <span className="chart-legend__item"><span className="chart-legend__dot chart-legend__dot--pending" />대기</span>
                <span className="chart-legend__item"><span className="chart-legend__dot chart-legend__dot--rejected" />거절</span>
              </div>
            </>
          )}
          {tab === "report" && (
            <ReportTab year={viewYear} month={viewMonth} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReportTab({ year, month }) {
  const report = useMemo(() => generateMonthlyReport(year, month), [year, month]);
  const [copying, setCopying] = useState(false);

  async function handleCopy() {
    const text = generateReportText(report);
    if (!text) return;
    setCopying(true);
    try {
      const result = await copyToClipboard(text);
      if (result.success) {
        showToast({ type: "success", message: "📋 리포트가 클립보드에 복사되었어요! 카톡에 붙여넣기 하세요" });
      } else {
        showToast({ type: "error", message: "복사 실패" });
      }
    } finally {
      setCopying(false);
    }
  }

  if (!report || report.total === 0) {
    return (
      <div className="modal-empty">
        <div className="modal-empty__icon">📭</div>
        <p className="modal-empty__text">{year}년 {month}월 지출 데이터가 없어요</p>
        <div className="stats-guide">
          <p className="stats-guide__title">💡 데이터 입력 방법</p>
          <ol className="stats-guide__steps">
            <li>캘린더에서 날짜를 탭하세요</li>
            <li>&ldquo;+ 임시 항목 추가&rdquo;를 누르세요</li>
            <li>지출/수입을 선택하고 금액을 입력하세요</li>
            <li>저장하면 리포트가 자동 생성돼요!</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="report-tab">
      <h3 className="report-tab__title">📊 {year}년 {month}월 리포트</h3>

      {/* 핵심 지표 */}
      <div className="report-metrics">
        <div className="report-metric">
          <span className="report-metric__label">총 지출</span>
          <span className="report-metric__value">{formatAmountShort(report.total)}원</span>
        </div>
        <div className="report-metric">
          <span className="report-metric__label">일평균</span>
          <span className="report-metric__value">{formatAmountShort(report.avgDaily)}원</span>
        </div>
        <div className="report-metric">
          <span className="report-metric__label">항목 수</span>
          <span className="report-metric__value">{report.itemCount}건</span>
        </div>
        <div className="report-metric">
          <span className="report-metric__label">지출일</span>
          <span className="report-metric__value">{report.daysWithSpending}일</span>
        </div>
      </div>

      {/* 카테고리 순위 */}
      {report.categories.length > 0 && (
        <div className="report-categories">
          <h4 className="report-section-title">🏷 카테고리 순위</h4>
          {report.categories.map((cat, i) => (
            <div key={cat.name} className="report-category-row">
              <span className="report-category-rank">{i + 1}</span>
              <span className="report-category-name">{cat.name}</span>
              <span className="report-category-bar">
                <span className="report-category-bar__fill" style={{ width: `${cat.pct}%` }} />
              </span>
              <span className="report-category-pct">{cat.pct}%</span>
            </div>
          ))}
        </div>
      )}

      {/* 카톡 복사 */}
      <button
        className="btn btn--primary report-copy-btn"
        onClick={handleCopy}
        disabled={copying}
      >
        {copying ? "복사 중..." : "📋 카카오톡에 공유하기"}
      </button>
      <p className="report-copy-hint">복사 후 카카오톡 대화방에 붙여넣기 하세요</p>
    </div>
  );
}
