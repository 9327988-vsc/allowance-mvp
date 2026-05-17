// src/utils/xss.js — XSS 방어 (4.18, v2.1 ME-22)

const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
};

/**
 * HTML 특수문자 이스케이프
 * 적용 대상: display_name, comment.text, rejection_reason
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== "string") return "";
  return unsafe.replace(/[&<>"'/]/g, (ch) => ESCAPE_MAP[ch]);
}
