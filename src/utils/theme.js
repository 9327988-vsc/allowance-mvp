// src/utils/theme.js — 테마 관리 (라이트/다크 모드)

import { reapplyCurrentPrefs } from "./userPrefs";

const THEME_KEY = "theme_v1";

/**
 * 저장된 테마 로드. 없으면 시스템 prefers-color-scheme 참조, 그마저도 없으면 "light".
 * @returns {"light"|"dark"}
 */
export function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch { /* ignored */ }
  // C-07: 시스템 다크 모드 선호 반영
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

/**
 * 테마 저장 + DOM 적용
 * @param {"light"|"dark"} theme
 */
export function setTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch { /* ignored */ }
  applyTheme(theme);
}

/**
 * DOM에 테마 적용
 * @param {"light"|"dark"} theme
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // 배경/컬러 프리셋이 light/dark별로 다르므로 재적용
  reapplyCurrentPrefs();
}

/**
 * 테마 토글
 * @returns {"light"|"dark"} 새 테마
 */
export function toggleTheme() {
  const current = loadTheme();
  const next = current === "light" ? "dark" : "light";
  setTheme(next);
  return next;
}

/**
 * 앱 시작 시 호출 — 저장된 테마 적용 + OS 테마 변경 리스너 등록
 */
export function initTheme() {
  applyTheme(loadTheme());
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      if (!localStorage.getItem(THEME_KEY)) applyTheme(loadTheme());
    });
  } catch { /* matchMedia 미지원 환경 무시 */ }
}
