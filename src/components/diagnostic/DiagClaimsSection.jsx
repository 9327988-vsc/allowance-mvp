import { formatAmount } from "../../utils/formatAmount";

const STATUS_LABELS = {
  pending: "⏳ 대기",
  approved: "✅ 승인",
  rejected: "❌ 거절",
  paid: "💰 지급",
  received: "🎉 수령",
};

export default function DiagClaimsSection({ allClaims, claimFilter, setClaimFilter }) {
  return (
    <div className="diag-section-body">
      {/* 필터 */}
      <div className="diag-filter-bar">
        {["all", "pending", "approved", "rejected", "paid", "received"].map(f => (
          <button
            key={f}
            className={`diag-filter-btn${claimFilter === f ? " diag-filter-btn--active" : ""}`}
            onClick={() => setClaimFilter(f)}
          >
            {f === "all" ? "전체" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {(() => {
        const filtered = claimFilter === "all" ? allClaims : allClaims.filter(c => c.status === claimFilter);
        if (filtered.length === 0) return <p className="diag-empty">해당 조건의 청구가 없습니다</p>;
        return (
          <div className="diag-table-wrap">
            <table className="diag-table">
              <thead>
                <tr><th>날짜</th><th>기간</th><th>상태</th><th>금액</th><th>가족</th></tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map(c => (
                  <tr key={c.claim_id}>
                    <td>{c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : "-"}</td>
                    <td>{c.year}-{String(c.month).padStart(2, "0")}{c.is_extra ? " (추가)" : ""}</td>
                    <td>{STATUS_LABELS[c.status] || c.status}</td>
                    <td className="diag-amount">{formatAmount(c.snapshot?.calculation?.total ?? 0)}</td>
                    <td>{c._family_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 50 && <p className="diag-detail" style={{ marginTop: 8 }}>...외 {filtered.length - 50}건</p>}
          </div>
        );
      })()}
      <p className="diag-detail" style={{ marginTop: 8 }}>총 {allClaims.length}건</p>
    </div>
  );
}
