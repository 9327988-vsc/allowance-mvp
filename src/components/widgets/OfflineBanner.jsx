// src/components/widgets/OfflineBanner.jsx — 오프라인 상태 배너
import { useState, useEffect } from "react";
import { isOnline, subscribeOnlineStatus } from "../../utils/onlineStatus";
import { subscribeQueueCount } from "../../utils/offlineStore";

export default function OfflineBanner() {
  const [online, setOnline] = useState(isOnline);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => subscribeOnlineStatus(setOnline), []);
  useEffect(() => subscribeQueueCount(setQueueCount), []);

  if (online && queueCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "sticky",
        top: 0,
        zIndex: "var(--z-toast, 9000)",
        padding: "6px 16px",
        fontSize: "0.8125rem",
        fontWeight: 600,
        textAlign: "center",
        background: online
          ? "var(--color-warning-bg, #fef3c7)"
          : "var(--color-error-bg, #fee2e2)",
        color: online
          ? "var(--color-text-primary, #92400e)"
          : "var(--color-text-primary, #991b1b)",
        borderBottom: `1px solid ${online ? "var(--color-border, #fcd34d)" : "var(--color-border, #fca5a5)"}`,
      }}
    >
      {online
        ? `📤 전송 대기 중인 작업 ${queueCount}건`
        : `📡 오프라인 — ${queueCount > 0 ? `대기 ${queueCount}건` : "연결 시 동기화됩니다"}`}
    </div>
  );
}
