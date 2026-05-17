// src/constants/statusLabels.js — 청구 상태 라벨 + 색상
// CSS variables: --color-status-pending, --color-status-approved, etc.
// Keep in sync with :root in index.css

export const STATUS_CONFIG = {
  pending: {
    label: "검토 대기 중",
    emoji: "🟡",
    color: "var(--color-warning, #f59e0b)",
    bgColor: "var(--color-warning-bg, #fef3c7)",
  },
  approved: {
    label: "승인됨",
    emoji: "🟢",
    color: "var(--color-success, #10b981)",
    bgColor: "var(--color-success-bg, #d1fae5)",
  },
  rejected: {
    label: "거절됨",
    emoji: "🔴",
    color: "var(--color-error, #ef4444)",
    bgColor: "var(--color-error-bg, #fee2e2)",
  },
  paid: {
    label: "지급 완료",
    emoji: "💰",
    color: "var(--color-primary, #6366f1)",
    bgColor: "var(--color-primary-bg, #e0e7ff)",
  },
  granted: {
    label: "수령 대기",
    emoji: "💝",
    color: "var(--color-grant, #e879a0)",
    bgColor: "var(--color-grant-bg, #fce4ec)",
  },
  received: {
    label: "수령 완료",
    emoji: "✅",
    color: "var(--color-success, #10b981)",
    bgColor: "var(--color-success-bg, #d1fae5)",
  },
};

export function getStatusLabel(status) {
  return STATUS_CONFIG[status]?.label || status;
}

export function getStatusEmoji(status) {
  return STATUS_CONFIG[status]?.emoji || "⚪";
}
