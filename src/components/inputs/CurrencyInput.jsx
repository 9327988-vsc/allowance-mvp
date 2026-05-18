// src/components/inputs/CurrencyInput.jsx
import { useState, useCallback, useEffect, useRef } from "react";

/**
 * 금액 입력 컴포넌트
 * - 표시: 1,000 형태 (콤마 포맷)
 * - 값: 정수 number
 * - iOS 자동 줌 방지: font-size 16px 이상 (index.css 글로벌 가드)
 */
export default function CurrencyInput({ value, onChange, max = 10000000, label, error, disabled = false, id }) {
  const [displayValue, setDisplayValue] = useState(formatDisplay(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setDisplayValue(formatDisplay(value));
    }
  }, [value]);

  function formatDisplay(num) {
    if (num === null || num === undefined) return "";
    if (num === 0) return "0";
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

  const handleFocus = useCallback(() => {
    focusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    focusedRef.current = false;
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
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-full px-3 py-2 rounded-lg border text-right"
          style={{
            paddingRight: 48,
            borderColor: error ? "var(--color-error)" : "var(--color-border)",
            background: disabled ? "var(--color-bg-secondary)" : "var(--color-bg)",
            color: disabled ? "var(--color-text-tertiary)" : "var(--color-text-primary)"
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className="absolute top-1/2 -translate-y-1/2" style={{ right: 14, color: "var(--color-text-tertiary)", fontSize: "0.85em", letterSpacing: "0.5px" }}>원</span>
      </div>
      {error && <p id={`${id}-error`} className="text-xs" style={{ color: "var(--color-error)" }}>{error}</p>}
    </div>
  );
}
