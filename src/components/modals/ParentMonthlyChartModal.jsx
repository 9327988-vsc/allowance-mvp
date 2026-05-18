// src/components/modals/ParentMonthlyChartModal.jsx — 월별 지출 차트 모달
import { useMemo } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { formatAmountShort } from "../../utils/formatAmount";

/**
 * @param {{
 *   claims: Array,
 *   onClose: () => void
 * }} props
 */
export default function ParentMonthlyChartModal({ claims, onClose }) {
  const contentRef = useModalBase(onClose);

  const currentYear = new Date().getFullYear();

  // 월별 데이터 집계 (올해 기준)
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      count: 0,
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

  const maxTotal = Math.max(...monthlyData.map((d) => d.total), 1);
  const yearTotal = monthlyData.reduce((s, d) => s + d.total, 0);
  const yearApproved = monthlyData.reduce((s, d) => s + d.approved, 0);
  const currentMonth = new Date().getMonth(); // 0-based

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 480, width: "92%", padding: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="monthly-chart-title"
      >
        <div className="modal-header">
          <h2 id="monthly-chart-title" className="modal-title">
            📊 {currentYear}년 월별 지출
          </h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        <div className="modal-body">
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
            {monthlyData.map((d, i) => (
              <div
                key={d.month}
                className={`monthly-chart__col${i === currentMonth ? " monthly-chart__col--current" : ""}`}
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
                        style={{ height: `${(d.approved / maxTotal) * 100}%` }}
                      />
                    )}
                    {d.pending > 0 && (
                      <div
                        className="monthly-chart__bar monthly-chart__bar--pending"
                        style={{ height: `${(d.pending / maxTotal) * 100}%` }}
                      />
                    )}
                    {d.rejected > 0 && (
                      <div
                        className="monthly-chart__bar monthly-chart__bar--rejected"
                        style={{ height: `${(d.rejected / maxTotal) * 100}%` }}
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
        </div>
      </div>
    </div>
  );
}
