// src/components/PinInput.jsx — 4자리 PIN 입력 위젯
import { useRef, useEffect } from "react";

/**
 * @param {{
 *   value: string,
 *   onChange: (val: string) => void,
 *   error: boolean,
 *   disabled?: boolean,
 *   autoFocus?: boolean
 * }} props
 */
export default function PinInput({ value, onChange, error, disabled = false, autoFocus = true }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  function handleChange(e) {
    const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    onChange(raw);
  }

  function handleKeyDown(e) {
    // 숫자, 백스페이스, 탭만 허용
    if (
      !/^[0-9]$/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "Tab" &&
      e.key !== "Delete" &&
      !e.ctrlKey && !e.metaKey
    ) {
      e.preventDefault();
    }
  }

  return (
    <div
      className={`pin-input${error ? " pin-input--error" : ""}`}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="pin-input__dots">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`pin-input__dot${i < value.length ? " pin-input__dot--filled" : ""}`}
          />
        ))}
      </div>
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        maxLength={4}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="pin-input__hidden"
        aria-label="PIN 입력"
        autoComplete="off"
      />
    </div>
  );
}
