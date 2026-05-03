// src/components/inputs/CurrencyInput.jsx
import { useState, useCallback } from "react";

/**
 * 금액 입력 컴포넌트
 * - 표시: 1,000 형태 (콤마 포맷)
 * - 값: 정수 number
 * - iOS 자동 줌 방지: font-size 16px 이상 (index.css 글로벌 가드)
 */
export default function CurrencyInput({ value, onChange, max = 10000000, label, error, disabled = false, id }) {
  const [displayValue, setDisplayValue] = useState(formatDisplay(value));

  function formatDisplay(num) {
    if (num === 0 || num === null || num === undefined) return "";
    return num.toLocaleString("ko-KR");
  }

  const handleChange = useCallback((e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw === "") {
      setDisplayValue("");
      onChange(0);
      return;
    }
    const num = parseInt(raw, 10);
    if (num > max) return;
    setDisplayValue(num.toLocaleString("ko-KR"));
    onChange(num);
  }, [max, onChange]);

  const handleBlur = useCallback(() => {
    setDisplayValue(formatDisplay(value));
  }, [value]);

  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</label>}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-full px-3 py-2 rounded-lg border text-right pr-8"
          style={{
            borderColor: error ? "var(--color-error)" : "var(--color-border)",
            background: disabled ? "var(--color-bg-secondary)" : "var(--color-bg)",
            color: disabled ? "var(--color-text-tertiary)" : "var(--color-text-primary)"
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--color-text-secondary)" }}>원</span>
      </div>
      {error && <p id={`${id}-error`} className="text-xs" style={{ color: "var(--color-error)" }}>{error}</p>}
    </div>
  );
}
