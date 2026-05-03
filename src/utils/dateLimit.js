// src/utils/dateLimit.js

/**
 * 주어진 (year, month)가 "오늘 +12개월" 한도를 초과하는지 판정
 *
 * 정책 (C4-03 확정):
 * - 비교 기준: 월 단위 (날짜는 무시)
 * - 한도: 오늘이 속한 월 + 12개월
 * - 예: 오늘 2026-05-15 → 2027-05까지 가능, 2027-06부터 비활성
 *
 * @param {number} year - 검사할 연도 (예: 2027)
 * @param {number} month - 검사할 월 (1~12)
 * @param {Date} today - 기준 날짜 (기본: 현재 시각). 테스트용 주입 가능
 * @returns {boolean} 한도 초과면 true (= 비활성 대상)
 */
export function isAtFutureLimit(year, month, today = new Date()) {
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1; // 1~12

  // 월 인덱스 (year * 12 + month-1)로 비교
  const target = year * 12 + (month - 1);
  const limit = todayY * 12 + (todayM - 1) + 12; // +12개월

  return target > limit;
}

/**
 * 다음 달 버튼 비활성 여부 (BTN-H-003 활성 조건)
 *
 * @param {number} currentY - 현재 표시 월의 연도
 * @param {number} currentM - 현재 표시 월 (1~12)
 * @param {Date} today
 * @returns {boolean} 비활성이면 true
 */
export function isNextMonthDisabled(currentY, currentM, today = new Date()) {
  // 다음 달 = 현재 월 + 1
  const nextY = currentM === 12 ? currentY + 1 : currentY;
  const nextM = currentM === 12 ? 1 : currentM + 1;
  return isAtFutureLimit(nextY, nextM, today);
}
