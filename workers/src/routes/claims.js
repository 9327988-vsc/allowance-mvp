// workers/src/routes/claims.js — 청구 관련 라우트 핸들러

import { kvGetJson, kvPutJson, kvAppendToList } from "../lib/kv.js";
import { jsonResponse, ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../lib/errors.js";
import { canTransition, canPerformAction } from "../domain/claimStateMachine.js";
import { isValidRejectionReason, isValidCommentText } from "../lib/validators.js";

// --- POST /api/claims (submitClaim) ---
export async function handleSubmitClaim(request, env, ctx) {
  const body = await request.json();
  const { claim_id, year, month, is_extra, snapshot } = body;

  // 기본 검증
  if (!claim_id || !year || !month || !snapshot) {
    throw new ValidationError("VALIDATION_ERROR", "필수 필드 누락");
  }

  // claim_id 형식 검증
  if (typeof claim_id !== "string" || claim_id.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(claim_id)) {
    throw new ValidationError("VALIDATION_ERROR", "claim_id 형식이 유효하지 않습니다");
  }

  if (typeof year !== "number" || year < 2024 || year > 2099) {
    throw new ValidationError("VALIDATION_ERROR", "유효하지 않은 연도");
  }
  if (typeof month !== "number" || month < 1 || month > 12) {
    throw new ValidationError("VALIDATION_ERROR", "유효하지 않은 월");
  }

  // snapshot 크기 제한 (100KB)
  const snapshotStr = JSON.stringify(snapshot);
  if (snapshotStr.length > 102400) {
    throw new ValidationError("PAYLOAD_TOO_LARGE", "snapshot 크기가 100KB를 초과합니다");
  }

  // 자녀만 제출 가능
  if (ctx.member.role !== "child") {
    throw new ValidationError("CHILD_ONLY", "자녀만 청구를 제출할 수 있습니다");
  }

  // 중복 청구 검사
  const claimsList = (await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/list`)) || [];
  for (const cid of claimsList) {
    const existing = await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${cid}`);
    if (!existing || existing.year !== year || existing.month !== month) continue;

    // 정기 청구: 같은 월에 pending/approved가 있으면 거부
    if (!is_extra && !existing.is_extra && (existing.status === "pending" || existing.status === "approved")) {
      throw new ConflictError("DUPLICATE_CLAIM", "이미 검토 중인 청구가 있습니다");
    }

    // 추가 청구: 같은 자녀가 60초 내 제출한 pending 추가 청구가 있으면 거부
    if (is_extra && existing.is_extra && existing.status === "pending"
      && existing.child_member_id === ctx.member.member_id
      && existing.submitted_at > new Date(Date.now() - 60000).toISOString()) {
      throw new ConflictError("DUPLICATE_EXTRA_CLAIM", "방금 제출한 추가 청구가 있습니다. 잠시 후 다시 시도해주세요");
    }
  }

  const now = new Date().toISOString();
  const claim = {
    claim_id,
    family_id: ctx.familyId,
    child_member_id: ctx.member.member_id,
    year,
    month,
    is_extra: !!is_extra,
    snapshot,
    status: "pending",
    submitted_at: now,
    decided_at: null,
    paid_at: null,
    received_at: null,
    decided_by_member_id: null,
    paid_by_member_id: null,
    rejection_reason: null,
    comments: [],
    schema_version: 1,
    updated_at: now,
  };

  await kvPutJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${claim_id}`, claim);
  await kvAppendToList(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/list`, claim_id);

  return jsonResponse(claim, 201);
}

// --- GET /api/families/:fid/claims (listClaims) ---
export async function handleListClaims(env, ctx) {
  const claimsList = (await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/list`)) || [];

  let claims = [];
  for (const cid of claimsList) {
    const claim = await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${cid}`);
    if (claim) {
      // 목록에서는 snapshot 제외 (용량 절약)
      const { snapshot, comments, ...summary } = claim;
      if (claim.type === "grant") {
        summary.total = claim.amount || 0;
      } else {
        summary.total = snapshot?.calculation?.total ?? 0;
      }
      summary.comment_count = (comments || []).length;
      claims.push(summary);
    }
  }

  // 자녀인 경우 본인 청구만 필터링
  if (ctx.member && ctx.member.role === "child") {
    claims = claims.filter(c => c.child_member_id === ctx.member.member_id);
  }

  return jsonResponse({ claims });
}

// --- GET /api/claims/:cid (getClaim) ---
export async function handleGetClaim(env, ctx, claimId) {
  const claim = await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${claimId}`);
  if (!claim) {
    throw new NotFoundError("CLAIM_NOT_FOUND", "청구를 찾을 수 없습니다");
  }
  return jsonResponse(claim);
}

// --- PATCH /api/claims/:cid (patchClaim: approve/reject/pay) ---
export async function handlePatchClaim(request, env, ctx, claimId) {
  const body = await request.json();
  const { status: nextStatus, rejection_reason, expected_updated_at } = body;

  if (!nextStatus) {
    throw new ValidationError("VALIDATION_ERROR", "status 필드 필수");
  }

  const claim = await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${claimId}`);
  if (!claim) {
    throw new NotFoundError("CLAIM_NOT_FOUND", "청구를 찾을 수 없습니다");
  }

  // LWW 충돌 검사 — expected_updated_at 필수
  if (!expected_updated_at) {
    throw new ValidationError("MISSING_FIELD", "expected_updated_at는 필수입니다");
  }
  if (claim.updated_at !== expected_updated_at) {
    throw new ConflictError("CONFLICT", "다른 사용자가 먼저 처리했습니다. 새로고침 후 다시 시도해주세요");
  }

  // 상태 전이 유효성
  if (!canTransition(claim.status, nextStatus)) {
    throw new ValidationError("INVALID_STATUS", `${claim.status} → ${nextStatus} 전이 불가`);
  }

  // 역할 기반 행동 검사
  const actionMap = { approved: "approve", rejected: "reject", paid: "pay", pending: "undo_reject" };
  const action = actionMap[nextStatus];
  const check = canPerformAction(action, claim, ctx.member.role, ctx.member.member_id);
  if (!check.allowed) {
    throw new ValidationError(check.reason, `권한 부족: ${check.reason}`);
  }

  // 거절 시 사유 필수
  if (nextStatus === "rejected") {
    if (!rejection_reason || !isValidRejectionReason(rejection_reason)) {
      throw new ValidationError("VALIDATION_ERROR", "거절 사유는 1~200자 필수");
    }
    claim.rejection_reason = rejection_reason;
  }

  const now = new Date().toISOString();
  claim.status = nextStatus;
  claim.updated_at = now;

  if (nextStatus === "approved" || nextStatus === "rejected") {
    claim.decided_at = now;
    claim.decided_by_member_id = ctx.member.member_id;
  }
  if (nextStatus === "paid") {
    claim.paid_at = now;
    claim.paid_by_member_id = ctx.member.member_id;
  }
  if (nextStatus === "pending") {
    // undo_reject: 거절 사유 초기화
    claim.rejection_reason = null;
    claim.decided_at = null;
    claim.decided_by_member_id = null;
  }

  await kvPutJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${claimId}`, claim);

  return jsonResponse(claim);
}

// --- PATCH /api/claims/:cid/receive ---
export async function handleReceiveClaim(request, env, ctx, claimId) {
  const body = await request.json();
  const { expected_updated_at } = body;

  const claim = await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${claimId}`);
  if (!claim) {
    throw new NotFoundError("CLAIM_NOT_FOUND", "청구를 찾을 수 없습니다");
  }

  // grant는 별도 엔드포인트 사용
  if (claim.type === "grant") {
    throw new ForbiddenError("WRONG_ENDPOINT", "grant는 /api/grants/:id/receive 경로를 사용하세요");
  }

  // LWW 충돌 검사 — expected_updated_at 필수
  if (!expected_updated_at) {
    throw new ValidationError("MISSING_FIELD", "expected_updated_at는 필수입니다");
  }
  if (claim.updated_at !== expected_updated_at) {
    throw new ConflictError("CONFLICT", "충돌 발생. 새로고침 후 다시 시도해주세요");
  }

  const check = canPerformAction("receive", claim, ctx.member.role, ctx.member.member_id);
  if (!check.allowed) {
    throw new ValidationError(check.reason, `수령 확인 불가: ${check.reason}`);
  }

  const now = new Date().toISOString();
  claim.status = "received";
  claim.received_at = now;
  claim.received_by_member_id = ctx.member.member_id;
  claim.updated_at = now;

  await kvPutJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${claimId}`, claim);

  return jsonResponse(claim);
}

// --- POST /api/grants (submitGrant) ---
export async function handleSubmitGrant(request, env, ctx) {
  const body = await request.json();
  const { grant_id, child_member_id, name, amount, reason } = body;

  // 기본 검증
  if (!grant_id || !child_member_id || !name || !amount) {
    throw new ValidationError("VALIDATION_ERROR", "필수 필드 누락 (grant_id, child_member_id, name, amount)");
  }

  // grant_id 형식 검증
  if (typeof grant_id !== "string" || grant_id.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(grant_id)) {
    throw new ValidationError("VALIDATION_ERROR", "grant_id 형식이 유효하지 않습니다");
  }

  // 부모만 등록 가능
  if (ctx.member.role !== "parent") {
    throw new ValidationError("PARENT_ONLY", "부모만 추가 지급을 등록할 수 있습니다");
  }

  // R-3: 중복 grant_id 검사
  const existingGrant = await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${grant_id}`);
  if (existingGrant) {
    throw new ConflictError("DUPLICATE_GRANT", "이미 존재하는 지급 ID입니다");
  }

  // R-2: child_member_id가 가족 멤버에 존재하는지 검증 (KV members list 사용)
  const membersList = await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/members/list`) || [];
  if (!membersList.includes(child_member_id)) {
    throw new ValidationError("INVALID_MEMBER", "해당 자녀가 가족 멤버에 존재하지 않습니다");
  }
  // 대상 멤버가 자녀 역할인지 검증
  const targetMember = await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/members/${child_member_id}`);
  if (!targetMember || targetMember.role !== "child") {
    throw new ValidationError("INVALID_MEMBER", "지급 대상은 자녀 역할이어야 합니다");
  }

  // 금액 검증
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 100 || amount > 10000000) {
    throw new ValidationError("VALIDATION_ERROR", "금액은 100원~10,000,000원 사이 정수여야 합니다");
  }

  // 이름 검증 + HTML 태그 제거
  if (typeof name !== "string") {
    throw new ValidationError("VALIDATION_ERROR", "항목명은 1~50자 필수");
  }
  const sanitizedName = name.replace(/<[^>]*>/g, "");
  if (sanitizedName.length < 1 || sanitizedName.length > 50) {
    throw new ValidationError("VALIDATION_ERROR", "항목명은 1~50자 필수");
  }

  // 사유 검증 (선택) — 최대 200자
  if (reason !== undefined && reason !== null && reason !== "") {
    if (typeof reason !== "string" || reason.length > 200) {
      throw new ValidationError("VALIDATION_ERROR", "사유는 200자 이내");
    }
  }

  const now = new Date().toISOString();
  const grant = {
    claim_id: grant_id,
    family_id: ctx.familyId,
    child_member_id,
    type: "grant",
    name: sanitizedName,
    amount,
    reason: reason || "",
    status: "granted",
    granted_by_member_id: ctx.member.member_id,
    granted_at: now,
    received_at: null,
    received_by_member_id: null,
    comments: [],
    schema_version: 1,
    updated_at: now,
  };

  // Reuse claims storage path for unified listing
  await kvPutJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${grant_id}`, grant);
  await kvAppendToList(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/list`, grant_id);

  return jsonResponse(grant, 201);
}

// --- PATCH /api/grants/:gid/receive ---
export async function handleReceiveGrant(request, env, ctx, grantId) {
  const body = await request.json();
  const { expected_updated_at } = body;

  const grant = await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${grantId}`);
  if (!grant) {
    throw new NotFoundError("GRANT_NOT_FOUND", "지급 내역을 찾을 수 없습니다");
  }

  if (grant.type !== "grant") {
    throw new ValidationError("NOT_A_GRANT", "지급 내역이 아닙니다");
  }

  // LWW 충돌 검사
  if (!expected_updated_at) {
    throw new ValidationError("MISSING_FIELD", "expected_updated_at는 필수입니다");
  }
  if (grant.updated_at !== expected_updated_at) {
    throw new ConflictError("CONFLICT", "충돌 발생. 새로고침 후 다시 시도해주세요");
  }

  const check = canPerformAction("grant_receive", grant, ctx.member.role, ctx.member.member_id);
  if (!check.allowed) {
    throw new ValidationError(check.reason, `수령 확인 불가: ${check.reason}`);
  }

  const now = new Date().toISOString();
  grant.status = "received";
  grant.received_at = now;
  grant.received_by_member_id = ctx.member.member_id;
  grant.updated_at = now;

  await kvPutJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${grantId}`, grant);

  return jsonResponse(grant);
}

// --- POST /api/claims/:cid/comments ---
export async function handleAddComment(request, env, ctx, claimId) {
  const body = await request.json();
  const { comment_id, text } = body;

  if (!comment_id || !text || !isValidCommentText(text)) {
    throw new ValidationError("VALIDATION_ERROR", "댓글 내용은 1~200자 필수");
  }

  // comment_id 형식 검증
  if (typeof comment_id !== "string" || comment_id.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(comment_id)) {
    throw new ValidationError("VALIDATION_ERROR", "comment_id 형식이 유효하지 않습니다");
  }

  // HTML 태그 제거
  const sanitizedText = text.replace(/<[^>]*>/g, "");
  if (sanitizedText.length < 1) {
    throw new ValidationError("VALIDATION_ERROR", "댓글 내용은 1~200자 필수");
  }

  const claim = await kvGetJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${claimId}`);
  if (!claim) {
    throw new NotFoundError("CLAIM_NOT_FOUND", "청구를 찾을 수 없습니다");
  }

  // 중복 comment_id 검사
  claim.comments = claim.comments || [];
  if (claim.comments.some(c => c.comment_id === comment_id)) {
    throw new ConflictError("DUPLICATE_COMMENT", "이미 존재하는 댓글 ID입니다");
  }

  // LWW 충돌 검사 — expected_updated_at 필수
  const { expected_updated_at } = body;
  if (!expected_updated_at) {
    throw new ValidationError("MISSING_FIELD", "expected_updated_at는 필수입니다");
  }
  if (claim.updated_at !== expected_updated_at) {
    throw new ConflictError("CONFLICT", "다른 사용자가 먼저 처리했습니다. 새로고침 후 다시 시도해주세요");
  }

  const now = new Date().toISOString();
  const comment = {
    comment_id,
    author_member_id: ctx.member.member_id,
    author_display_name: ctx.member.display_name,
    text: sanitizedText,
    created_at: now,
  };

  claim.comments.push(comment);
  claim.updated_at = now;

  await kvPutJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${claimId}`, claim);

  return jsonResponse(comment, 201);
}
