// src/components/inputs/WeekdayPicker.jsx

const WEEKDAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" }
];

/**
 * 요일 선택기
 * @param {Object} props
 * @param {string[]} props.value - 선택된 요일 배열 ["mon","tue",...]
 * @param {Function} props.onChange - 변경 콜백
 * @param {boolean} props.includeSatSun - 토/일 포함 여부 (학원용)
 * @param {string} props.label
 */
export default function WeekdayPicker({ value = [], onChange, includeSatSun = false, label }) {
  const days = includeSatSun ? WEEKDAYS : WEEKDAYS.slice(0, 5);

  const toggle = (day) => {
    if (value.includes(day)) {
      onChange(value.filter(d => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      {label && <legend className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</legend>}
      <div className="flex gap-1 flex-wrap" role="group">
        {days.map(d => {
          const selected = value.includes(d.key);
          return (
            <button
              key={d.key}
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-label={d.label}
              onClick={() => toggle(d.key)}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: selected ? "var(--color-primary)" : "var(--color-bg-secondary)",
                color: selected ? "#fff" : "var(--color-text-primary)",
                border: `1px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
                minWidth: "40px"
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
