// workers/src/domain/claimStateMachine.js — 서버측 청구 상태 머신

const VALID_TRANSITIONS = {
  pending: ["approved", "rejected"],
  approved: ["paid"],
  rejected: ["pending"],
  paid: ["received"],
  granted: ["received"],
  received: [],
};

/**
 * 상태 전이가 유효한지 검사
 */
export function canTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}

/**
 * 역할+상태 기반 행동 가능 여부 판단
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canPerformAction(action, claim, memberRole, memberId) {
  switch (action) {
    case "approve":
      if (memberRole !== "parent") return { allowed: false, reason: "PARENT_ONLY" };
      if (claim.status !== "pending") return { allowed: false, reason: "INVALID_STATUS" };
      return { allowed: true };

    case "reject":
      if (memberRole !== "parent") return { allowed: false, reason: "PARENT_ONLY" };
      if (claim.status !== "pending") return { allowed: false, reason: "INVALID_STATUS" };
      return { allowed: true };

    case "pay":
      if (memberRole !== "parent") return { allowed: false, reason: "PARENT_ONLY" };
      if (claim.status !== "approved") return { allowed: false, reason: "INVALID_STATUS" };
      return { allowed: true };

    case "receive":
      if (memberRole !== "child") return { allowed: false, reason: "CHILD_ONLY" };
      if (claim.status !== "paid") return { allowed: false, reason: "INVALID_STATUS" };
      if (claim.received_at) return { allowed: false, reason: "ALREADY_RECEIVED" };
      if (claim.child_member_id !== memberId) return { allowed: false, reason: "NOT_OWNER" };
      return { allowed: true };

    case "undo_reject":
      if (memberRole !== "parent") return { allowed: false, reason: "PARENT_ONLY" };
      if (claim.status !== "rejected") return { allowed: false, reason: "INVALID_STATUS" };
      return { allowed: true };

    case "grant_receive":
      if (memberRole !== "child") return { allowed: false, reason: "CHILD_ONLY" };
      if (claim.type !== "grant") return { allowed: false, reason: "NOT_A_GRANT" };
      if (claim.status !== "granted") return { allowed: false, reason: "INVALID_STATUS" };
      if (claim.received_at) return { allowed: false, reason: "ALREADY_RECEIVED" };
      if (claim.child_member_id !== memberId) return { allowed: false, reason: "NOT_OWNER" };
      return { allowed: true };

    default:
      return { allowed: false, reason: "INVALID_ACTION" };
  }
}
