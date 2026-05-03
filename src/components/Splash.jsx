// src/components/Splash.jsx
export default function Splash() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="앱을 불러오는 중"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        background: "var(--color-bg-secondary)",
        gap: "var(--space-3)"
      }}
    >
      <span style={{ fontSize: "48px" }} aria-hidden="true">💰</span>
      <span style={{
        fontSize: "var(--font-size-xl)",
        fontWeight: "var(--font-weight-bold)",
        color: "var(--color-text-primary)"
      }}>
        가족 용돈 청구
      </span>
      <span style={{
        fontSize: "var(--font-size-sm)",
        color: "var(--color-text-secondary)"
      }}>
        불러오는 중...
      </span>
    </div>
  );
}
