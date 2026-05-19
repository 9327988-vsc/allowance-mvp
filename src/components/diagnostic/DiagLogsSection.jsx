import { formatAmount } from "../../utils/formatAmount";

const TYPE_ICONS = { submit: "📤", approve: "✅", reject: "❌", pay: "💰", receive: "🎉", comment: "💬", account: "👤" };

export default function DiagLogsSection({ allClaims, accounts }) {
  const logs = [];
  allClaims.forEach(c => {
    if (c.submitted_at) logs.push({ time: c.submitted_at, type: "submit", desc: `${c.year}-${String(c.month).padStart(2, "0")} 청구 제출 (${formatAmount(c.snapshot?.calculation?.total ?? 0)})` });
    if (c.decided_at && c.status === "approved") logs.push({ time: c.decided_at, type: "approve", desc: `${c.year}-${String(c.month).padStart(2, "0")} 청구 승인` });
    if (c.decided_at && c.status === "rejected") logs.push({ time: c.decided_at, type: "reject", desc: `${c.year}-${String(c.month).padStart(2, "0")} 청구 거절: ${c.rejection_reason || ""}` });
    if (c.paid_at) logs.push({ time: c.paid_at, type: "pay", desc: `${c.year}-${String(c.month).padStart(2, "0")} 용돈 지급` });
    if (c.received_at) logs.push({ time: c.received_at, type: "receive", desc: `${c.year}-${String(c.month).padStart(2, "0")} 수령 확인` });
    (c.comments || []).forEach(cm => {
      logs.push({ time: cm.created_at, type: "comment", desc: `댓글: "${cm.text.slice(0, 30)}${cm.text.length > 30 ? "..." : ""}" — ${cm.author_display_name}` });
    });
  });
  accounts.forEach(a => {
    if (a.created_at) logs.push({ time: a.created_at, type: "account", desc: `계정 생성: ${a.display_name} (${a.role === "parent" ? "부모" : a.role === "general" ? "일반" : "자녀"})` });
  });
  logs.sort((a, b) => b.time.localeCompare(a.time));

  if (logs.length === 0) return <div className="diag-section-body"><p className="diag-empty">활동 기록이 없습니다</p></div>;
  return (
    <div className="diag-section-body">
      <div className="diag-log-list">
        {logs.slice(0, 30).map((log, i) => (
          <div key={i} className="diag-log-item">
            <span className="diag-log-icon">{TYPE_ICONS[log.type] || "📌"}</span>
            <span className="diag-log-time">{new Date(log.time).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            <span className="diag-log-desc">{log.desc}</span>
          </div>
        ))}
        {logs.length > 30 && <p className="diag-detail">...외 {logs.length - 30}건</p>}
      </div>
    </div>
  );
}
