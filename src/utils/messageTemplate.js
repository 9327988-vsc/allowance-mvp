// src/utils/messageTemplate.js
import { getCategoryIcon } from "../constants/categories";

/**
 * 청구 메시지 생성 (카톡 복사용)
 */
export function generateMessage(year, month, calc, settings, holidays, customCategories = []) {
  if (!calc || calc.total === 0) {
    return "";
  }

  const lines = [];

  // 헤더
  if (settings.child_name && settings.child_name.trim()) {
    lines.push(`📅 ${settings.child_name} ${year}년 ${month}월 용돈 청구`);
  } else {
    lines.push(`📅 ${year}년 ${month}월 용돈 청구`);
  }
  lines.push("");

  // 기본 용돈
  if (calc.base_allowance > 0) {
    lines.push(`💰 기본 용돈           ${formatCurrency(calc.base_allowance)}원`);
    lines.push(`   = ${formatNumber(calc.base_allowance)} × 1`);
    lines.push("");
  }

  // 학교 버스
  if (calc.school_total > 0) {
    const schoolLabel = (settings.school && settings.school.label) || "학교";
    const tripText = settings.school.round_trip ? "왕복" : "편도";
    const multiplier = settings.school.round_trip ? 2 : 1;
    lines.push(`🏫 ${schoolLabel} 버스비         ${formatCurrency(calc.school_total)}원`);
    lines.push(`   = ${formatNumber(settings.school.fare)} × ${multiplier}(${tripText}) × ${calc.school_days_count}일`);
    lines.push("");
  }

  // 학원 버스
  if (calc.academy_total > 0) {
    const academyLabel = (settings.academy && settings.academy.label) || "학원";
    const tripText = settings.academy.round_trip ? "왕복" : "편도";
    const multiplier = settings.academy.round_trip ? 2 : 1;
    lines.push(`📚 ${academyLabel} 버스비         ${formatCurrency(calc.academy_total)}원`);
    lines.push(`   = ${formatNumber(settings.academy.fare)} × ${multiplier}(${tripText}) × ${calc.academy_days_count}일`);
    lines.push("");
  }

  // 정기 추가 용돈
  const recurringExtras = calc.recurring_extras ?? [];
  if (recurringExtras.length > 0) {
    recurringExtras.forEach(item => {
      lines.push(`💵 ${item.name}           ${formatCurrency(item.amount)}원`);
    });
    lines.push("");
  }

  // 임시 항목 정렬 (date asc → created_at asc)
  const allExtras = [];
  calc.cells.forEach(c => {
    c.extra_items.forEach(item => {
      allExtras.push({ ...item, date: c.date });
    });
  });
  allExtras.sort((a, b) => {
    const d = (a.date || "").localeCompare(b.date || "");
    return d !== 0 ? d : (a.created_at || "").localeCompare(b.created_at || "");
  });

  if (allExtras.length > 0) {
    allExtras.forEach(item => {
      const dateText = formatDateShort(item.date);
      const icon = getCategoryIcon(item.category, customCategories);
      lines.push(`${icon} ${item.name} (${dateText})    ${formatCurrency(item.amount)}원`);
    });
    lines.push("");
  }

  // 구분선 + 합계
  lines.push("─".repeat(30));
  lines.push(`합계                  ${formatCurrency(calc.total)}원`);

  // 비고: 공휴일
  const monthHolidays = getHolidaysInMonth(year, month, holidays);
  if (monthHolidays.length > 0) {
    lines.push("");
    const text = monthHolidays
      .map(h => `${parseInt(h.date.split("-")[2])}일(${h.name})`)
      .join(", ");
    lines.push(`※ ${month}월 공휴일: ${text}`);
  }

  return lines.join("\n");
}

function formatNumber(n) {
  return n.toLocaleString("ko-KR");
}
const formatCurrency = formatNumber;

function formatDateShort(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "날짜 없음";
  const [, month, day] = dateStr.split("-");
  const m = parseInt(month);
  const d = parseInt(day);
  if (isNaN(m) || isNaN(d)) return "날짜 없음";
  return `${m}/${d}`;
}

function getHolidaysInMonth(year, month, holidays) {
  if (!holidays) return [];
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return Object.entries(holidays)
    .filter(([date]) => date.startsWith(prefix))
    .map(([date, info]) => ({ date, name: info.name }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
