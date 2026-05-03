// src/components/inputs/RadioGroup.jsx

/**
 * 라디오 그룹 컴포넌트
 * @param {Object} props
 * @param {string} props.name - 라디오 그룹 name
 * @param {Array<{value: string|boolean, label: string}>} props.options
 * @param {string|boolean} props.value - 현재 선택값
 * @param {Function} props.onChange - 변경 콜백
 * @param {string} props.label - 그룹 라벨
 * @param {boolean} props.disabled
 */
export default function RadioGroup({ name, options, value, onChange, label, disabled = false }) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      {label && <legend className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</legend>}
      <div className="flex gap-3" role="radiogroup">
        {options.map(opt => (
          <label
            key={String(opt.value)}
            className="flex items-center gap-2 cursor-pointer text-sm"
            style={{
              color: disabled ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
              cursor: disabled ? "not-allowed" : "pointer"
            }}
          >
            <input
              type="radio"
              name={name}
              value={String(opt.value)}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="accent-[var(--color-primary)]"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
