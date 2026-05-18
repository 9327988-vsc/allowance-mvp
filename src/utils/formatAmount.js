// src/utils/formatAmount.js — 금액 포맷 유틸리티

let _format = "won"; // "won" | "man"

export function setAmountFormat(format) {
  _format = format === "man" ? "man" : "won";
}

export function getAmountFormat() {
  return _format;
}

/** 테스트용 상태 리셋 */
export function _resetAmountFormat() {
  _format = "won";
}

/** 계정 전환 시 포맷 초기화 */
export function resetAmountFormat() {
  _format = "won";
}

/**
 * 금액을 현재 설정에 맞게 포맷 (단위 포함)
 * @param {number} value
 * @returns {string} "10,000원" 또는 "1만원"
 */
export function formatAmount(value) {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) return "0원";
  value = Math.round(value); // KRW has no subunits
  if (_format === "man" && Math.abs(value) >= 10000) {
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value);
    const man = Math.floor(abs / 10000);
    const rest = abs % 10000;
    if (rest === 0) return `${sign}${man.toLocaleString()}만원`;
    return `${sign}${man}만 ${rest.toLocaleString()}원`;
  }
  return `${value.toLocaleString()}원`;
}

/**
 * 숫자만 포맷 (단위 없이)
 * @param {number} value
 * @returns {string} "10,000" 또는 "1만"
 */
export function formatAmountShort(value) {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) return "0";
  value = Math.round(value); // KRW has no subunits
  if (_format === "man" && Math.abs(value) >= 10000) {
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value);
    const man = Math.floor(abs / 10000);
    const rest = abs % 10000;
    if (rest === 0) return `${sign}${man.toLocaleString()}만`;
    return `${sign}${man}만 ${rest.toLocaleString()}`;
  }
  return value.toLocaleString();
}
