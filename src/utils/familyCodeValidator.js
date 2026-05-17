// src/utils/familyCodeValidator.js — 가족 코드 형식 검증 (4.14)

const FAMILY_CODE_RE = /^[2-9A-HJ-NP-Z]{6}$/;

/**
 * 가족 코드 유효성 검사 (6자, I/O/0/1 제외)
 */
export function isValidFamilyCode(code) {
  return typeof code === "string" && FAMILY_CODE_RE.test(code);
}

/**
 * 사용자 입력 정규화 (trim + 대문자)
 */
export function normalizeFamilyCode(input) {
  return (input || "").trim().toUpperCase();
}
