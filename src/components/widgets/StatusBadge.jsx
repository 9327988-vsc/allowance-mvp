// src/components/widgets/StatusBadge.jsx — 청구 상태 배지
import { STATUS_CONFIG } from "../../constants/statusLabels";

/**
 * @param {{ status: string, size?: "sm"|"md" }} props
 */
export default function StatusBadge({ status, size = "sm" }) {
  const config = STATUS_CONFIG[status];
  if (!config) return <span className="status-badge" role="status">⚪ 알 수 없음</span>;

  return (
    <span
      className={`status-badge status-badge--${size} status-badge--${status}`}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
      }}
      role="status"
      aria-label={config.label}
    >
      <span aria-hidden="true">{config.emoji}</span>
      {config.label}
    </span>
  );
}
