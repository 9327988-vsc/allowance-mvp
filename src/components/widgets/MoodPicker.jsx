// src/components/widgets/MoodPicker.jsx — 기분 선택 위젯
import { MOODS } from "../../constants/moods";

export default function MoodPicker({ value, onChange, size = "md" }) {
  return (
    <div className={`mood-picker mood-picker--${size}`} role="radiogroup" aria-label="오늘의 기분">
      {MOODS.map(mood => (
        <button
          key={mood.id}
          type="button"
          className={`mood-picker__btn${value === mood.id ? " mood-picker__btn--selected" : ""}`}
          onClick={() => onChange(value === mood.id ? null : mood.id)}
          aria-label={mood.label}
          aria-checked={value === mood.id}
          role="radio"
          title={mood.label}
        >
          <span className="mood-picker__emoji">{mood.emoji}</span>
          {size !== "sm" && <span className="mood-picker__label">{mood.label}</span>}
        </button>
      ))}
    </div>
  );
}
