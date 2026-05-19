import { formatAmount } from "../../utils/formatAmount";

const STATUS_LABELS = {
  pending: "⏳ 대기",
  approved: "✅ 승인",
  rejected: "❌ 거절",
  paid: "💰 지급",
  received: "🎉 수령",
};

export default function DiagStatsSection({ allClaims }) {
  return (
    <div className="diag-section-body">
      {/* 상태별 요약 */}
      <h3 className="diag-sub-title">상태별 요약</h3>
      <div className="diag-stats-grid">
        {["pending", "approved", "rejected", "paid", "received"].map(s => {
          const count = allClaims.filter(c => c.status === s).length;
          const total = allClaims.filter(c => c.status === s).reduce((sum, c) => sum + (c.snapshot?.calculation?.total ?? 0), 0);
          return (
            <div key={s} className={`diag-stat-card diag-stat-card--${s}`}>
              <div className="diag-stat-label">{STATUS_LABELS[s]}</div>
              <div className="diag-stat-count">{count}건</div>
              <div className="diag-stat-total">{formatAmount(total)}</div>
            </div>
          );
        })}
      </div>

      {/* 월별 추이 */}
      <h3 className="diag-sub-title" style={{ marginTop: 20 }}>월별 청구 추이</h3>
      {(() => {
        const monthly = {};
        allClaims.forEach(c => {
          const key = `${c.year}-${String(c.month).padStart(2, "0")}`;
          if (!monthly[key]) monthly[key] = { count: 0, total: 0, approved: 0 };
          monthly[key].count++;
          monthly[key].total += c.snapshot?.calculation?.total ?? 0;
          if (c.status === "approved" || c.status === "paid" || c.status === "received") {
            monthly[key].approved += c.snapshot?.calculation?.total ?? 0;
          }
        });
        const sorted = Object.entries(monthly).sort((a, b) => b[0].localeCompare(a[0]));
        if (sorted.length === 0) return <p className="diag-empty">데이터 없음</p>;
        const maxTotal = Math.max(...sorted.map(([, v]) => v.total), 1);
        return (
          <div className="diag-monthly-chart">
            {sorted.map(([month, data]) => (
              <div key={month} className="diag-monthly-row">
                <span className="diag-monthly-label">{month}</span>
                <div className="diag-monthly-bar-wrap">
                  <div className="diag-monthly-bar" style={{ width: `${(data.total / maxTotal) * 100}%` }} />
                  <div className="diag-monthly-bar diag-monthly-bar--approved" style={{ width: `${(data.approved / maxTotal) * 100}%` }} />
                </div>
                <span className="diag-monthly-value">{formatAmount(data.total)} ({data.count}건)</span>
              </div>
            ))}
            <div className="diag-chart-legend">
              <span><span className="diag-legend-dot diag-legend-dot--total" /> 청구</span>
              <span><span className="diag-legend-dot diag-legend-dot--approved" /> 승인</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
