// src/components/Splash.jsx
export default function Splash() {
  return (
    <div className="account-switcher" role="status" aria-live="polite" aria-label="앱을 불러오는 중">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: "var(--space-3)" }} aria-hidden="true">💰</div>
        <div style={{
          fontSize: "var(--font-size-xl)",
          fontWeight: "var(--font-weight-bold)",
          color: "var(--color-text-primary)",
          marginBottom: "var(--space-4)",
        }}>
          가족 용돈 청구
        </div>
        <span className="spinner spinner--md" />
      </div>
    </div>
  );
}
