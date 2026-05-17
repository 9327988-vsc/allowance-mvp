// src/utils/claimStateMachine.js — 클라이언트 상태 머신

export const CLAIM_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
  GRANTED: "granted",
  RECEIVED: "received",
};

const VALID_TRANSITIONS = {
  pending: ["approved", "rejected"],
  approved: ["paid"],
  rejected: ["pending"],
  paid: ["received"],
  granted: ["received"],
  received: [],
};

export function canTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}

/**
 * 동일 (year, month, is_extra=false)에 pending 또는 approved 청구가 있는지 확인
 * @param {Array} claims - 청구 목록 (listClaims 결과)
 * @param {number} year
 * @param {number} month
 * @returns {object|null} 중복 청구 또는 null
 */
export function findBlockingClaim(claims, year, month) {
  return claims.find(
    (c) =>
      c.year === year &&
      c.month === month &&
      !c.is_extra &&
      (c.status === "pending" || c.status === "approved")
  ) || null;
}
