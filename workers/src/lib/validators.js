// workers/src/lib/validators.js — 서버 입력 검증

const FAMILY_CODE_RE = /^[2-9A-HJ-NP-Z]{6}$/;

export function isValidFamilyCode(code) {
  return typeof code === "string" && FAMILY_CODE_RE.test(code);
}

export function isValidDisplayName(name) {
  return typeof name === "string" && name.length >= 1 && name.length <= 20;
}

export function isValidRole(role) {
  return role === "child" || role === "parent";
}

export function isValidRejectionReason(reason) {
  return typeof reason === "string" && reason.length >= 1 && reason.length <= 200;
}

export function isValidCommentText(text) {
  return typeof text === "string" && text.length >= 1 && text.length <= 200;
}

/**
 * HTML 태그를 제거하여 display_name을 정화
 */
export function sanitizeDisplayName(name) {
  if (typeof name !== "string") return name;
  return name.replace(/<[^>]*>/g, "");
}
