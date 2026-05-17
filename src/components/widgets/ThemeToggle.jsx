// src/components/widgets/ThemeToggle.jsx — 다크/라이트 모드 전환 버튼
import { useState } from "react";
import { loadTheme, toggleTheme } from "../../utils/theme";

export default function ThemeToggle({ size = "sm" }) {
  const [theme, setTheme] = useState(loadTheme);

  function handleToggle() {
    const next = toggleTheme();
    setTheme(next);
  }

  const isDark = theme === "dark";
  const icon = isDark ? "☀️" : "🌙";
  const label = isDark ? "라이트 모드" : "다크 모드";

  return (
    <button
      onClick={handleToggle}
      className={`theme-toggle theme-toggle--${size}`}
      aria-label={label}
      title={label}
    >
      <span className="theme-toggle__icon">{icon}</span>
    </button>
  );
}
