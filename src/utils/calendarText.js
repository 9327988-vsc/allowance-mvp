// src/utils/calendarText.js — 캘린더 텍스트 생성 (복사용)
import { getWeekdayKor } from "./calculator";

/**
 * 캘린더를 텍스트 표로 생성
 * @param {number} year
 * @param {number} month
 * @param {object} calc - calculateMonthlyAllowance 결과
 * @param {object} settings
 * @param {object} holidays
 * @returns {string}
 */
export function generateCalendarText(year, month, calc, settings, _holidays) {
  if (!calc) return "";

  const lines = [];
  const childName = settings.child_name?.trim();

  // 헤더
  if (childName) {
    lines.push(`📅 ${childName} ${year}년 ${month}월 캘린더`);
  } else {
    lines.push(`📅 ${year}년 ${month}월 캘린더`);
  }
  lines.push("");

  // 일별 내역
  for (const cell of calc.cells) {
    const day = parseInt(cell.date.split("-")[2], 10);
    const wdKor = getWeekdayKor(cell.weekday);
    const parts = [];

    if (cell.is_holiday) {
      parts.push(`🔴${cell.holiday_name || "공휴일"}`);
    }
    if (cell.school_fee > 0) {
      parts.push(`🏫${cell.school_fee.toLocaleString("ko-KR")}원`);
    }
    if (cell.academy_fee > 0) {
      parts.push(`✏️${cell.academy_fee.toLocaleString("ko-KR")}원`);
    }
    if (cell.extra_items.length > 0) {
      for (const item of cell.extra_items) {
        parts.push(`🎒${item.name} ${item.amount.toLocaleString("ko-KR")}원`);
      }
    }

    if (parts.length === 0) continue; // 아무것도 없는 날은 건너뛰기

    const dayStr = `${day}일(${wdKor})`;
    lines.push(`${dayStr.padEnd(7)} ${parts.join("  ")}`);
  }

  // 하단 요약
  lines.push("");
  lines.push("─".repeat(28));

  const summaryParts = [];
  if (calc.base_allowance > 0) summaryParts.push(`💰기본 ${calc.base_allowance.toLocaleString("ko-KR")}원`);
  const recurringTotal = calc.recurring_extras_total || 0;
  if (recurringTotal > 0) summaryParts.push(`💵정기 ${recurringTotal.toLocaleString("ko-KR")}원`);
  if (calc.school_total > 0) summaryParts.push(`🏫학교 ${calc.school_total.toLocaleString("ko-KR")}원`);
  if (calc.academy_total > 0) summaryParts.push(`✏️학원 ${calc.academy_total.toLocaleString("ko-KR")}원`);
  if (calc.extra_items_total > 0) summaryParts.push(`🎒기타 ${calc.extra_items_total.toLocaleString("ko-KR")}원`);

  lines.push(summaryParts.join(" | "));
  lines.push(`합계: ${calc.total.toLocaleString("ko-KR")}원`);

  return lines.join("\n");
}
