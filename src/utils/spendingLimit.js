// src/utils/spendingLimit.js — 지출 한도 관리

import { showToast } from "./toastManager";

/**
 * 지출 한도 초과 여부 체크 + 알림
 * @param {number} currentTotal - 이번 달 현재 총 지출
 * @param {object} settings - 사용자 설정
 * @returns {{ exceeded: boolean, percent: number, remaining: number }}
 */
export function checkSpendingLimit(currentTotal, settings) {
  const limit = settings?.spending_limit;
  if (!limit || limit <= 0) return { exceeded: false, percent: 0, remaining: null, limit: null };

  const total = Number(currentTotal) || 0;
  const percent = Math.round((total / limit) * 100);
  const remaining = limit - total;
  const exceeded = total > limit;

  return { exceeded, percent, remaining, limit };
}

/**
 * 한도 도달/초과 시 토스트 알림 (세션당 1회만)
 */
const _notified = new Set();

export function notifySpendingLimit(year, month, currentTotal, settings) {
  const result = checkSpendingLimit(currentTotal, settings);
  if (!result.limit) return result;

  // 오래된 알림 키 정리 (현재 월 외 제거)
  const key = `${year}-${String(month).padStart(2, '0')}`;
  for (const k of _notified) {
    if (!k.startsWith(key)) _notified.delete(k);
  }

  if (result.exceeded && !_notified.has(`${key}_over`)) {
    _notified.add(`${key}_over`);
    showToast({
      type: "warning",
      message: `이번 달 지출이 한도(${result.limit.toLocaleString("ko-KR")}원)를 초과했어요!`,
      duration: 5000,
    });
  } else if (result.percent >= 80 && !result.exceeded && !_notified.has(`${key}_warn`)) {
    _notified.add(`${key}_warn`);
    showToast({
      type: "warning",
      message: `이번 달 지출이 한도의 ${result.percent}%에 도달했어요`,
      duration: 4000,
    });
  }

  return result;
}

/** 테스트용 리셋 */
export function _resetSpendingLimitNotifications() {
  _notified.clear();
}

/** 계정 전환 시 캐시 리셋 */
export function resetSpendingLimitCache() {
  _notified.clear();
}
