// src/utils/userPrefs.js — 유저별 맞춤 설정 저장/적용

import { getActiveUser } from "./authStore";
import { setAmountFormat } from "./formatAmount";

const STORAGE_KEY = "user_prefs_v1";

export const PREF_DEFAULTS = {
  accent: "indigo",
  bg_style: "default",
  font_size: "normal",
  emoji: null,
  calendar_start: "sunday",
  amount_format: "won",
  border_style: "round",
  animation: "on",
  cell_size: "normal",
  header_style: "gradient",
  // 프로필 관련
  display_name: "",
  profile_emoji: "😊",
  status_message: "",
  birthday: "",       // "MM-DD" 형식
};

// ── 컬러 프리셋 ──
export const ACCENT_PRESETS = {
  indigo: { primary: "#6366F1", hover: "#4F46E5", light: "#EEF2FF", gradStart: "#6366F1", gradEnd: "#8B5CF6", rgb: "99,102,241",
    dark: { primary: "#818CF8", hover: "#6366F1", light: "#312e81", gradStart: "#4F46E5", gradEnd: "#7C3AED", rgb: "129,140,248" } },
  blue: { primary: "#3B82F6", hover: "#2563EB", light: "#EFF6FF", gradStart: "#3B82F6", gradEnd: "#6366F1", rgb: "59,130,246",
    dark: { primary: "#60A5FA", hover: "#3B82F6", light: "#1e3a5f", gradStart: "#2563EB", gradEnd: "#4F46E5", rgb: "96,165,250" } },
  green: { primary: "#10B981", hover: "#059669", light: "#ECFDF5", gradStart: "#10B981", gradEnd: "#34D399", rgb: "16,185,129",
    dark: { primary: "#34D399", hover: "#10B981", light: "#064e3b", gradStart: "#059669", gradEnd: "#10B981", rgb: "52,211,153" } },
  pink: { primary: "#EC4899", hover: "#DB2777", light: "#FDF2F8", gradStart: "#EC4899", gradEnd: "#F472B6", rgb: "236,72,153",
    dark: { primary: "#F472B6", hover: "#EC4899", light: "#831843", gradStart: "#DB2777", gradEnd: "#EC4899", rgb: "244,114,182" } },
  orange: { primary: "#F97316", hover: "#EA580C", light: "#FFF7ED", gradStart: "#F97316", gradEnd: "#FB923C", rgb: "249,115,22",
    dark: { primary: "#FB923C", hover: "#F97316", light: "#7c2d12", gradStart: "#EA580C", gradEnd: "#F97316", rgb: "251,146,60" } },
  red: { primary: "#EF4444", hover: "#DC2626", light: "#FEF2F2", gradStart: "#EF4444", gradEnd: "#F87171", rgb: "239,68,68",
    dark: { primary: "#F87171", hover: "#EF4444", light: "#7f1d1d", gradStart: "#DC2626", gradEnd: "#EF4444", rgb: "248,113,113" } },
};

// ── 배경 프리셋 ──
export const BG_STYLE_PRESETS = {
  default: {
    light: { bg: "#FAFBFE", bgSecondary: "#F0F2F8", bgCard: "#FFFFFF" },
    dark: { bg: "#0f172a", bgSecondary: "#1e293b", bgCard: "#1e293b" },
  },
  warm: {
    light: { bg: "#FFFBF5", bgSecondary: "#FFF3E0", bgCard: "#FFFFFF" },
    dark: { bg: "#1a1410", bgSecondary: "#2d2418", bgCard: "#2d2418" },
  },
  cool: {
    light: { bg: "#F0F7FF", bgSecondary: "#E3F0FF", bgCard: "#FFFFFF" },
    dark: { bg: "#0c1929", bgSecondary: "#132338", bgCard: "#132338" },
  },
};

// ── 글꼴 크기 스케일 ──
export const FONT_SIZE_SCALES = {
  small: 0.875,
  normal: 1,
  large: 1.125,
};

const BASE_FONT_SIZES = { xs: 12, sm: 14, base: 16, lg: 18, xl: 24, "2xl": 32 };

// ── 모서리 프리셋 ──
export const BORDER_STYLE_PRESETS = {
  round: { sm: "4px", md: "8px", lg: "12px", xl: "16px" },
  more_round: { sm: "8px", md: "14px", lg: "20px", xl: "24px" },
  sharp: { sm: "0px", md: "2px", lg: "4px", xl: "6px" },
};

// ── 셀 크기 프리셋 ──
export const CELL_SIZE_PRESETS = {
  small: { minHeight: "52px", padding: "2px 2px" },
  normal: { minHeight: "64px", padding: "var(--space-1) 3px" },
  large: { minHeight: "80px", padding: "var(--space-2) 4px" },
};

// ── 저장/로드 ──
function loadAllPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAllPrefs(all) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch { /* ignored */ }
}

export function loadUserPrefs(userId) {
  if (!userId) return { ...PREF_DEFAULTS };
  const all = loadAllPrefs();
  return { ...PREF_DEFAULTS, ...(all[userId] || {}) };
}

export function saveUserPrefs(userId, prefs) {
  if (!userId) return;
  const all = loadAllPrefs();
  all[userId] = prefs;
  saveAllPrefs(all);
  applyPrefs(prefs);
}

export function removeUserPrefs(userId) {
  if (!userId) return;
  const all = loadAllPrefs();
  delete all[userId];
  saveAllPrefs(all);
}

// ── CSS 변수 런타임 적용 ──
export function applyPrefs(prefs) {
  if (!prefs) return;
  const root = document.documentElement;
  const isDark = root.getAttribute("data-theme") === "dark";

  // 1. 테마 컬러
  const accent = ACCENT_PRESETS[prefs.accent] || ACCENT_PRESETS.indigo;
  const colors = isDark && accent.dark ? accent.dark : accent;
  root.style.setProperty("--color-primary", colors.primary);
  root.style.setProperty("--color-primary-hover", colors.hover);
  root.style.setProperty("--color-primary-light", colors.light);
  root.style.setProperty("--gradient-primary-start", colors.gradStart);
  root.style.setProperty("--gradient-primary-end", colors.gradEnd);
  root.style.setProperty("--gradient-primary-hover-start", colors.hover);
  root.style.setProperty("--gradient-primary-hover-end", colors.gradEnd);
  root.style.setProperty("--color-primary-rgb", colors.rgb);

  // 2. 배경 스타일
  const bgPreset = BG_STYLE_PRESETS[prefs.bg_style] || BG_STYLE_PRESETS.default;
  const bgColors = isDark ? bgPreset.dark : bgPreset.light;
  root.style.setProperty("--color-bg", bgColors.bg);
  root.style.setProperty("--color-bg-secondary", bgColors.bgSecondary);
  root.style.setProperty("--color-bg-card", bgColors.bgCard);

  // 3. 글꼴 크기
  const scale = FONT_SIZE_SCALES[prefs.font_size] || 1;
  Object.entries(BASE_FONT_SIZES).forEach(([key, base]) => {
    root.style.setProperty(`--font-size-${key}`, `${Math.round(base * scale)}px`);
  });

  // 4. 금액 형식
  setAmountFormat(prefs.amount_format || "won");

  // 5. 모서리 스타일
  const borderPreset = BORDER_STYLE_PRESETS[prefs.border_style] || BORDER_STYLE_PRESETS.round;
  root.style.setProperty("--radius-sm", borderPreset.sm);
  root.style.setProperty("--radius-md", borderPreset.md);
  root.style.setProperty("--radius-lg", borderPreset.lg);
  root.style.setProperty("--radius-xl", borderPreset.xl);

  // 6. 애니메이션
  if (prefs.animation === "off") {
    root.style.setProperty("--transition-duration", "0s");
    root.style.setProperty("--animation-bubble", "0s");
    root.classList.add("anim-off");
    root.classList.remove("anim-reduced");
  } else if (prefs.animation === "reduced") {
    root.style.setProperty("--transition-duration", "0.05s");
    root.style.setProperty("--animation-bubble", "0s");
    root.classList.add("anim-reduced");
    root.classList.remove("anim-off");
  } else {
    root.style.removeProperty("--transition-duration");
    root.style.removeProperty("--animation-bubble");
    root.classList.remove("anim-off", "anim-reduced");
  }

  // 7. 캘린더 셀 크기
  const cellPreset = CELL_SIZE_PRESETS[prefs.cell_size] || CELL_SIZE_PRESETS.normal;
  root.style.setProperty("--cell-min-height", cellPreset.minHeight);
  root.style.setProperty("--cell-padding", cellPreset.padding);

  // 8. 헤더 스타일
  if (prefs.header_style === "solid") {
    root.style.setProperty("--header-bg", "var(--color-primary)");
    root.style.setProperty("--header-bg-image", "none");
  } else {
    root.style.setProperty("--header-bg", "transparent");
    root.style.setProperty("--header-bg-image", `linear-gradient(135deg, var(--gradient-primary-start), var(--gradient-primary-end))`);
  }
}

/** 현재 활성 유저의 prefs를 다시 적용 (테마 전환 시 호출) */
export function reapplyCurrentPrefs() {
  const userId = getActiveUser();
  applyPrefs(loadUserPrefs(userId)); // userId가 null이면 PREF_DEFAULTS 적용
}

/** CSS 변수 오버라이드 초기화 (로그아웃 시) */
export function clearPrefsOverrides() {
  const root = document.documentElement;
  const props = [
    "--color-primary", "--color-primary-hover", "--color-primary-light",
    "--gradient-primary-start", "--gradient-primary-end",
    "--gradient-primary-hover-start", "--gradient-primary-hover-end", "--color-primary-rgb",
    "--color-bg", "--color-bg-secondary", "--color-bg-card",
    "--font-size-xs", "--font-size-sm", "--font-size-base",
    "--font-size-lg", "--font-size-xl", "--font-size-2xl",
    "--radius-sm", "--radius-md", "--radius-lg", "--radius-xl",
    "--animation-bubble", "--transition-duration",
    "--cell-min-height", "--cell-padding",
    "--header-bg", "--header-bg-image",
  ];
  props.forEach(p => root.style.removeProperty(p));
  root.classList.remove("anim-off", "anim-reduced");
  setAmountFormat("won");
}
