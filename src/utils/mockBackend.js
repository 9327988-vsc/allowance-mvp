// src/utils/mockBackend.js — 브라우저 내 mock 백엔드 (Workers 없이 동작)
// localStorage의 "mock_kv:" 네임스페이스를 서버 KV처럼 사용

import { canTransition } from "./claimStateMachine";

const PREFIX = "mock_kv:";

// --- KV 헬퍼 ---
function kvGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[mockBackend] kvGet JSON parse failed for key: ${key}`, e);
    return null;
  }
}

function kvPut(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      console.error(`[mockBackend] localStorage quota exceeded for key: ${key}`);
    }
    throw e;
  }
}

function kvDel(key) {
  localStorage.removeItem(PREFIX + key);
}

function kvAppend(listKey, id) {
  const list = kvGet(listKey) || [];
  if (!list.includes(id)) { list.unshift(id); kvPut(listKey, list); }
}

function kvRemove(listKey, id) {
  const list = kvGet(listKey) || [];
  kvPut(listKey, list.filter(x => x !== id));
}

// --- 코드 생성 (no modulo bias: 256 % 32 = 0) ---
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 chars
function generateCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += ALPHABET[bytes[i] % 32];
  }
  return result;
}

// --- last_seen_at 스로틀 업데이트 (5분 이상 경과 시만) ---
function _updateLastSeen(member, familyId) {
  const now = new Date().toISOString();
  const lastSeen = new Date(member.last_seen_at || 0);
  if (Date.now() - lastSeen.getTime() > 5 * 60 * 1000) {
    member.last_seen_at = now;
    kvPut(`families/${familyId}/members/${member.member_id}`, member);
  }
}

// --- 인증 ---
function authenticate(headers) {
  const deviceId = headers["X-Device-Id"] || headers["x-device-id"];
  const familyCode = headers["X-Family-Code"] || headers["x-family-code"];
  const memberId = headers["X-Member-Id"] || headers["x-member-id"];
  if (!deviceId || !familyCode) return null;

  const familyId = kvGet(`families/by_code/${familyCode}`);
  if (!familyId) return null;

  const family = kvGet(`families/${familyId}`);
  if (!family) return null;

  const memberIds = kvGet(`families/${familyId}/members/list`) || [];

  // X-Member-Id가 있으면 정확히 매칭 (같은 기기 멀티 계정 지원)
  if (memberId) {
    const m = kvGet(`families/${familyId}/members/${memberId}`);
    if (m && m.device_id === deviceId) {
      _updateLastSeen(m, familyId);
      return { family, member: m, familyId };
    }
  }

  // fallback: deviceId로 매칭
  for (const mid of memberIds) {
    const m = kvGet(`families/${familyId}/members/${mid}`);
    if (m && m.device_id === deviceId) {
      _updateLastSeen(m, familyId);
      return { family, member: m, familyId };
    }
  }
  console.warn("[mockBackend] auth failed: deviceId=", deviceId, "familyCode=", familyCode, "memberId=", memberId, "members=", memberIds.map(mid => { const mm = kvGet(`families/${familyId}/members/${mid}`); return mm ? { mid, device_id: mm.device_id, role: mm.role } : mid; }));
  return null;
}

// --- 라우트 핸들러 ---

function handleFamiliesPost(body, headers) {
  if (!body || typeof body !== "object") return err(400, "INVALID_BODY", "요청 본문이 올바르지 않습니다");
  const { creator_display_name, creator_role } = body;
  if (typeof creator_display_name !== "string" || creator_display_name.trim().length === 0 || creator_display_name.length > 20) return err(400, "INVALID_DISPLAY_NAME", "이름은 1~20자");
  if (creator_role !== "child" && creator_role !== "parent") return err(400, "INVALID_ROLE", "역할을 선택해 주세요");

  const deviceId = headers["X-Device-Id"];
  if (!deviceId) return err(400, "MISSING_DEVICE_ID", "X-Device-Id required");

  let familyCode = null;
  for (let i = 0; i < 5; i++) {
    const c = generateCode();
    if (!kvGet(`families/by_code/${c}`)) { familyCode = c; break; }
  }
  if (!familyCode) return err(500, "FAMILY_CODE_GENERATION_FAILED", "가족 코드 발급 실패");

  const now = new Date().toISOString();
  const familyId = `fam_${crypto.randomUUID()}`;
  const memberId = `mem_${crypto.randomUUID()}`;

  const family = { family_id: familyId, family_code: familyCode, created_at: now, created_by_member_id: memberId, schema_version: 1 };
  const member = { member_id: memberId, family_id: familyId, role: creator_role, display_name: creator_display_name, device_id: deviceId, joined_at: now, last_seen_at: now, schema_version: 1 };

  kvPut(`families/by_code/${familyCode}`, familyId);
  kvPut(`families/${familyId}`, family);
  kvPut(`families/${familyId}/members/${memberId}`, member);
  kvPut(`families/${familyId}/members/list`, [memberId]);

  return ok({ family, member }, 201);
}

function handleGetFamilyByCode(code) {
  const familyId = kvGet(`families/by_code/${code}`);
  if (!familyId) return err(404, "FAMILY_NOT_FOUND", "가족 코드를 찾을 수 없어요");

  const family = kvGet(`families/${familyId}`);
  if (!family) return err(404, "FAMILY_DATA_CORRUPTED", "가족 데이터 손상");

  const memberIds = kvGet(`families/${familyId}/members/list`) || [];
  const members = [];
  let hasChild = false;
  for (const mid of memberIds) {
    const m = kvGet(`families/${familyId}/members/${mid}`);
    if (m) {
      members.push({ member_id: m.member_id, role: m.role, display_name: m.display_name, joined_at: m.joined_at });
      if (m.role === "child") hasChild = true;
    }
  }

  return ok({ family: { family_id: family.family_id, family_code: family.family_code, created_at: family.created_at }, members, member_count: members.length, has_child: hasChild, is_full: members.length >= 4 });
}

function handleJoinFamily(code, body, headers) {
  if (!body || typeof body !== "object") return err(400, "INVALID_BODY", "요청 본문이 올바르지 않습니다");
  const { display_name, role } = body;
  if (typeof display_name !== "string" || display_name.trim().length === 0 || display_name.length > 20) return err(400, "INVALID_DISPLAY_NAME", "이름은 1~20자");
  if (role !== "child" && role !== "parent") return err(400, "INVALID_ROLE", "역할을 선택해 주세요");

  const deviceId = headers["X-Device-Id"];
  if (!deviceId) return err(400, "MISSING_DEVICE_ID", "X-Device-Id required");

  const familyId = kvGet(`families/by_code/${code}`);
  if (!familyId) return err(404, "FAMILY_NOT_FOUND", "가족 코드를 찾을 수 없어요");

  const memberIds = kvGet(`families/${familyId}/members/list`) || [];

  // 같은 device + 같은 role 멱등 (같은 기기에서 자녀/부모 각각 가입 허용)
  for (const mid of memberIds) {
    const m = kvGet(`families/${familyId}/members/${mid}`);
    if (m && m.device_id === deviceId && m.role === role) return ok({ family_id: familyId, member: m, already_member: true });
  }

  if (memberIds.length >= 4) return err(400, "FAMILY_FULL", "가족 인원이 가득 찼어요 (4명까지)");

  if (role === "child") {
    for (const mid of memberIds) {
      const m = kvGet(`families/${familyId}/members/${mid}`);
      if (m && m.role === "child") return err(400, "CHILD_ALREADY_EXISTS", "이미 자녀가 등록되어 있어요");
    }
  }

  const now = new Date().toISOString();
  const memberId = `mem_${crypto.randomUUID()}`;
  const member = { member_id: memberId, family_id: familyId, role, display_name, device_id: deviceId, joined_at: now, last_seen_at: now, schema_version: 1 };

  kvPut(`families/${familyId}/members/${memberId}`, member);
  kvAppend(`families/${familyId}/members/list`, memberId);

  return ok({ family_id: familyId, member, already_member: false }, 201);
}

function handleGetFamily(ctx) {
  const memberIds = kvGet(`families/${ctx.familyId}/members/list`) || [];
  const members = [];
  for (const mid of memberIds) {
    const m = kvGet(`families/${ctx.familyId}/members/${mid}`);
    if (m) members.push({ member_id: m.member_id, role: m.role, display_name: m.display_name, joined_at: m.joined_at, last_seen_at: m.last_seen_at });
  }
  return ok({ family: ctx.family, members, member_count: members.length });
}

function handlePatchMember(ctx, memberId, body) {
  if (!body || typeof body !== "object") return err(400, "INVALID_BODY", "요청 본문이 올바르지 않습니다");
  if (ctx.member.member_id !== memberId) return err(400, "CAN_ONLY_EDIT_SELF", "본인 정보만 수정할 수 있어요");
  const { display_name } = body;
  if (typeof display_name !== "string" || display_name.trim().length === 0 || display_name.length > 20) return err(400, "INVALID_DISPLAY_NAME", "이름은 1~20자");

  const member = kvGet(`families/${ctx.familyId}/members/${memberId}`);
  if (!member) return err(404, "MEMBER_NOT_FOUND", "멤버를 찾을 수 없어요");
  member.display_name = display_name;
  kvPut(`families/${ctx.familyId}/members/${memberId}`, member);
  return ok({ member });
}

function handleLeaveFamily(ctx, memberId) {
  if (ctx.member.member_id !== memberId) return err(400, "CAN_ONLY_LEAVE_SELF", "본인만 탈퇴 가능");
  kvRemove(`families/${ctx.familyId}/members/list`, memberId);
  kvDel(`families/${ctx.familyId}/members/${memberId}`);

  // Mark claims referencing the departed member (preserve history for parent)
  const claimsList = kvGet(`families/${ctx.familyId}/claims/list`) || [];
  for (const cid of claimsList) {
    const claim = kvGet(`families/${ctx.familyId}/claims/${cid}`);
    if (claim && claim.child_member_id === memberId) {
      claim.member_departed = true;
      kvPut(`families/${ctx.familyId}/claims/${cid}`, claim);
    }
  }

  const remaining = kvGet(`families/${ctx.familyId}/members/list`) || [];
  if (remaining.length === 0) {
    // 가족 해산 — by_code 인덱스도 제거
    const family = kvGet(`families/${ctx.familyId}`);
    if (family && family.family_code) {
      kvDel(`families/by_code/${family.family_code}`);
    }
    kvDel(`families/${ctx.familyId}`);
  }
  return ok({ success: true, family_dissolved: remaining.length === 0 });
}

function handleSubmitClaim(ctx, body) {
  const { claim_id, year, month, is_extra, snapshot } = body;
  if (!claim_id || !year || !month || !snapshot) return err(400, "VALIDATION_ERROR", "필수 필드 누락");
  if (typeof year !== "number" || year < 2024 || year > 2099) return err(400, "VALIDATION_ERROR", "year는 2024~2099 사이 숫자");
  if (typeof month !== "number" || month < 1 || month > 12) return err(400, "VALIDATION_ERROR", "month는 1~12 사이 숫자");
  if (ctx.member.role !== "child") return err(400, "CHILD_ONLY", "자녀만 청구 제출 가능");

  // snapshot 크기 제한 (100KB)
  const snapshotSize = new Blob([JSON.stringify(snapshot)]).size;
  if (snapshotSize > 100 * 1024) return err(400, "SNAPSHOT_TOO_LARGE", "스냅샷이 100KB를 초과합니다");

  // claim_id 중복 검사 — 클라이언트가 제공한 ID가 이미 존재하면 거부
  const existingClaim = kvGet(`families/${ctx.familyId}/claims/${claim_id}`);
  if (existingClaim) {
    return err(409, "DUPLICATE_CLAIM_ID", "이미 존재하는 청구 ID입니다");
  }

  // NOTE: N+1 issue — currently loads all claims to check for duplicates.
  // When scaling, add a by-month index (e.g. claims/by-month/YYYY-MM/{claim_id})
  // and use prefix scan instead of iterating the full claims list.
  if (!is_extra) {
    const claimsList = kvGet(`families/${ctx.familyId}/claims/list`) || [];
    for (const cid of claimsList) {
      const c = kvGet(`families/${ctx.familyId}/claims/${cid}`);
      if (c && c.year === year && c.month === month && !c.is_extra && (c.status === "pending" || c.status === "approved")) {
        return err(409, "DUPLICATE_CLAIM", "이미 검토 중인 청구가 있습니다");
      }
    }
  }

  const now = new Date().toISOString();
  const claim = {
    claim_id, family_id: ctx.familyId, child_member_id: ctx.member.member_id,
    year, month, is_extra: !!is_extra, snapshot, status: "pending",
    submitted_at: now, decided_at: null, paid_at: null, received_at: null,
    decided_by_member_id: null, paid_by_member_id: null, rejection_reason: null,
    comments: [], schema_version: 1, updated_at: now,
  };

  kvPut(`families/${ctx.familyId}/claims/${claim_id}`, claim);
  kvAppend(`families/${ctx.familyId}/claims/list`, claim_id);
  return ok(claim, 201);
}

function handleListClaims(ctx) {
  const claimsList = kvGet(`families/${ctx.familyId}/claims/list`) || [];
  let claims = [];
  for (const cid of claimsList) {
    const c = kvGet(`families/${ctx.familyId}/claims/${cid}`);
    if (c) {
      const { snapshot, comments, ...summary } = c;
      if (c.type === "grant") {
        // grant uses amount directly (no snapshot calculation)
        summary.total = c.amount || 0;
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

  return ok({ claims });
}

function handleGetClaim(ctx, claimId) {
  const claim = kvGet(`families/${ctx.familyId}/claims/${claimId}`);
  if (!claim) return err(404, "CLAIM_NOT_FOUND", "청구를 찾을 수 없습니다");
  return ok(claim);
}

function handlePatchClaim(ctx, claimId, body) {
  const { status: nextStatus, rejection_reason, expected_updated_at } = body;
  if (!nextStatus) return err(400, "MISSING_FIELD", "status는 필수입니다");
  const claim = kvGet(`families/${ctx.familyId}/claims/${claimId}`);
  if (!claim) return err(404, "CLAIM_NOT_FOUND", "청구를 찾을 수 없습니다");
  if (!expected_updated_at) return err(400, "MISSING_FIELD", "expected_updated_at는 필수입니다");
  if (claim.updated_at !== expected_updated_at) return err(409, "CONFLICT", "다른 사용자가 먼저 처리했습니다");

  if (!canTransition(claim.status, nextStatus)) return err(400, "INVALID_STATUS", `${claim.status} → ${nextStatus} 전이 불가`);

  if ((nextStatus === "approved" || nextStatus === "rejected") && ctx.member.role !== "parent") return err(400, "PARENT_ONLY", "부모만 가능");
  if (nextStatus === "paid" && ctx.member.role !== "parent") return err(400, "PARENT_ONLY", "부모만 가능");
  // undo_reject: rejected → pending 는 부모만 가능
  if (claim.status === "rejected" && nextStatus === "pending" && ctx.member.role !== "parent") return err(400, "PARENT_ONLY", "부모만 가능");
  if (nextStatus === "rejected" && (!rejection_reason || rejection_reason.length > 200)) return err(400, "VALIDATION_ERROR", "거절 사유 1~200자 필수");

  const now = new Date().toISOString();
  claim.status = nextStatus;
  claim.updated_at = now;
  if (nextStatus === "rejected") claim.rejection_reason = rejection_reason;
  // undo_reject: rejected → pending 시 결정 정보 초기화
  if (nextStatus === "pending") { claim.decided_at = null; claim.decided_by_member_id = null; claim.rejection_reason = null; }
  if (nextStatus === "approved" || nextStatus === "rejected") { claim.decided_at = now; claim.decided_by_member_id = ctx.member.member_id; }
  if (nextStatus === "paid") {
    claim.paid_at = now;
    claim.paid_by_member_id = ctx.member.member_id;
    if (body.paid_amount !== undefined) claim.paid_amount = body.paid_amount;
  }

  kvPut(`families/${ctx.familyId}/claims/${claimId}`, claim);
  return ok(claim);
}

function handleReceiveClaim(ctx, claimId, body) {
  const claim = kvGet(`families/${ctx.familyId}/claims/${claimId}`);
  if (!claim) return err(404, "CLAIM_NOT_FOUND", "청구를 찾을 수 없습니다");
  if (!body.expected_updated_at) return err(400, "MISSING_FIELD", "expected_updated_at는 필수입니다");
  if (claim.updated_at !== body.expected_updated_at) return err(409, "CONFLICT", "충돌");
  if (ctx.member.role !== "child") return err(400, "CHILD_ONLY", "자녀만 가능");
  if (claim.status !== "paid") return err(400, "INVALID_STATUS", "지급 완료 상태만 수령 가능");
  if (claim.received_at) return err(400, "ALREADY_RECEIVED", "이미 수령 확인함");
  if (claim.child_member_id !== ctx.member.member_id) return err(400, "NOT_OWNER", "본인 청구만 수령 가능");

  const now = new Date().toISOString();
  claim.status = "received";
  claim.received_at = now;
  claim.received_by_member_id = ctx.member.member_id;
  claim.updated_at = now;
  kvPut(`families/${ctx.familyId}/claims/${claimId}`, claim);
  return ok(claim);
}

function handleAddComment(ctx, claimId, body) {
  if (!body || typeof body !== "object") return err(400, "INVALID_BODY", "요청 본문이 올바르지 않습니다");
  const { comment_id, text } = body;
  if (typeof comment_id !== "string" || !comment_id) return err(400, "VALIDATION_ERROR", "comment_id 필수");
  if (typeof text !== "string" || text.trim().length === 0 || text.length > 200) return err(400, "VALIDATION_ERROR", "댓글 1~200자 필수");

  const claim = kvGet(`families/${ctx.familyId}/claims/${claimId}`);
  if (!claim) return err(404, "CLAIM_NOT_FOUND", "청구를 찾을 수 없습니다");
  if (!body.expected_updated_at) return err(400, "MISSING_FIELD", "expected_updated_at는 필수입니다");
  if (claim.updated_at !== body.expected_updated_at) return err(409, "CONFLICT", "다른 사용자가 먼저 처리했습니다");

  const now = new Date().toISOString();
  const comment = { comment_id, author_member_id: ctx.member.member_id, author_display_name: ctx.member.display_name, text, created_at: now };
  claim.comments = claim.comments || [];
  claim.comments.push(comment);
  claim.updated_at = now;
  kvPut(`families/${ctx.familyId}/claims/${claimId}`, claim);
  return ok(comment, 201);
}

function handleToggleReaction(ctx, claimId, body) {
  const { emoji } = body;
  if (!emoji) return err(400, "VALIDATION_ERROR", "emoji는 필수");

  const claim = kvGet(`families/${ctx.familyId}/claims/${claimId}`);
  if (!claim) return err(404, "CLAIM_NOT_FOUND", "청구를 찾을 수 없습니다");
  if (!body.expected_updated_at) return err(400, "MISSING_FIELD", "expected_updated_at는 필수입니다");
  if (claim.updated_at !== body.expected_updated_at) return err(409, "CONFLICT", "다른 사용자가 먼저 처리했습니다");

  const now = new Date().toISOString();
  claim.reactions = claim.reactions || [];
  const existing = claim.reactions.findIndex(r => r.member_id === ctx.member.member_id && r.emoji === emoji);
  if (existing >= 0) {
    claim.reactions.splice(existing, 1);
  } else {
    claim.reactions.push({
      member_id: ctx.member.member_id,
      member_display_name: ctx.member.display_name,
      emoji,
      created_at: now,
    });
  }
  claim.updated_at = now;
  kvPut(`families/${ctx.familyId}/claims/${claimId}`, claim);
  return ok({ reactions: claim.reactions });
}

function handleSubmitGrant(ctx, body) {
  const { grant_id, child_member_id, name, amount, reason } = body;
  if (!grant_id || !child_member_id || !name || !amount) return err(400, "VALIDATION_ERROR", "필수 필드 누락");
  if (ctx.member.role !== "parent") return err(400, "PARENT_ONLY", "부모만 추가 지급 등록 가능");

  // 중복 grant_id 검사
  const existingGrant = kvGet(`families/${ctx.familyId}/claims/${grant_id}`);
  if (existingGrant) return err(409, "DUPLICATE_GRANT_ID", "이미 존재하는 지급 ID입니다");

  // child_member_id 유효성 검사
  const childMember = kvGet(`families/${ctx.familyId}/members/${child_member_id}`);
  if (!childMember) return err(400, "MEMBER_NOT_FOUND", "해당 자녀를 찾을 수 없습니다");

  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 100 || amount > 10000000) return err(400, "VALIDATION_ERROR", "금액은 100원~10,000,000원 정수");
  if (typeof name !== "string" || name.length < 1 || name.length > 50) return err(400, "VALIDATION_ERROR", "항목명은 1~50자");

  // XSS 방지용 정제
  const sanitizedName = name.replace(/<[^>]*>?/g, "").replace(/on\w+\s*=/gi, "").replace(/javascript\s*:/gi, "").trim();

  const now = new Date().toISOString();
  const grant = {
    claim_id: grant_id, family_id: ctx.familyId, child_member_id,
    type: "grant", name: sanitizedName, amount, reason: reason || "",
    status: "granted", granted_by_member_id: ctx.member.member_id,
    granted_at: now, received_at: null, received_by_member_id: null,
    comments: [], schema_version: 1, updated_at: now,
  };

  kvPut(`families/${ctx.familyId}/claims/${grant_id}`, grant);
  kvAppend(`families/${ctx.familyId}/claims/list`, grant_id);
  return ok(grant, 201);
}

function handleReceiveGrant(ctx, grantId, body) {
  const grant = kvGet(`families/${ctx.familyId}/claims/${grantId}`);
  if (!grant) return err(404, "GRANT_NOT_FOUND", "지급 내역을 찾을 수 없습니다");
  if (grant.type !== "grant") return err(400, "NOT_A_GRANT", "지급 내역이 아닙니다");
  if (!body.expected_updated_at) return err(400, "MISSING_FIELD", "expected_updated_at는 필수입니다");
  if (grant.updated_at !== body.expected_updated_at) return err(409, "CONFLICT", "충돌");
  if (ctx.member.role !== "child") return err(400, "CHILD_ONLY", "자녀만 수령 확인 가능");
  if (grant.status !== "granted") return err(400, "INVALID_STATUS", "대기 중인 지급만 수령 가능");
  if (grant.received_at) return err(400, "ALREADY_RECEIVED", "이미 수령 확인함");
  if (grant.child_member_id !== ctx.member.member_id) return err(400, "NOT_OWNER", "본인 지급만 수령 가능");

  const now = new Date().toISOString();
  grant.status = "received";
  grant.received_at = now;
  grant.received_by_member_id = ctx.member.member_id;
  grant.updated_at = now;
  kvPut(`families/${ctx.familyId}/claims/${grantId}`, grant);
  return ok(grant);
}

function handleMigrate(ctx, body) {
  const { idempotency_key, claims } = body;
  if (!idempotency_key) return err(400, "VALIDATION_ERROR", "idempotency_key 필수");
  if (!Array.isArray(claims) || claims.length === 0) return err(400, "VALIDATION_ERROR", "마이그레이션할 청구 없음");
  if (ctx.member.role !== "child") return err(400, "CHILD_ONLY", "자녀만 가능");

  const memberId = ctx.member.member_id;
  const migKey = `families/${ctx.familyId}/migrations/${memberId}/${idempotency_key}`;
  const existing = kvGet(migKey);
  if (existing) return ok({ migrated: false, message: "이미 완료", idempotency_key, migrated_count: existing.migrated_count });

  const now = new Date().toISOString();
  let count = 0;
  for (const c of claims) {
    if (!c.claim_id || !c.year || !c.month || !c.snapshot) continue;
    // claim_id 형식 검증
    if (typeof c.claim_id !== "string" || !/^cl_[a-zA-Z0-9_-]+$/.test(c.claim_id)) continue;
    // year/month 범위 검증
    if (typeof c.year !== "number" || c.year < 2024 || c.year > 2099) continue;
    if (typeof c.month !== "number" || c.month < 1 || c.month > 12) continue;
    const claim = {
      claim_id: c.claim_id, family_id: ctx.familyId, child_member_id: ctx.member.member_id,
      year: c.year, month: c.month, is_extra: !!c.is_extra, snapshot: c.snapshot,
      status: "pending", submitted_at: c.submitted_at || now,
      decided_at: null, paid_at: null, received_at: null,
      decided_by_member_id: null, paid_by_member_id: null, rejection_reason: null,
      comments: [], schema_version: 1, updated_at: now, migrated_from_local: true,
    };
    kvPut(`families/${ctx.familyId}/claims/${c.claim_id}`, claim);
    kvAppend(`families/${ctx.familyId}/claims/list`, c.claim_id);
    count++;
  }

  kvPut(migKey, { idempotency_key, migrated_count: count, migrated_at: now, member_id: memberId });
  return ok({ migrated: true, idempotency_key, migrated_count: count }, 201);
}

// --- 응답 헬퍼 ---
function ok(data, status = 200) { return { status, body: data }; }
function err(status, code, message) { return { status, body: { error: code, message } }; }

// --- 라우터 ---
function route(method, path, body, headers) {
  let m;

  // Public routes
  if (method === "POST" && path === "/api/families") return handleFamiliesPost(body, headers);

  m = path.match(/^\/api\/families\/by-code\/([2-9A-HJ-NP-Z]{6})$/);
  if (method === "GET" && m) return handleGetFamilyByCode(m[1].toUpperCase());

  m = path.match(/^\/api\/families\/([2-9A-HJ-NP-Z]{6})\/join$/);
  if (method === "POST" && m) return handleJoinFamily(m[1].toUpperCase(), body, headers);

  // Authenticated routes
  const ctx = authenticate(headers);

  m = path.match(/^\/api\/families\/(fam_[a-f0-9-]+)$/);
  if (method === "GET" && m) {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    return handleGetFamily(ctx);
  }

  m = path.match(/^\/api\/families\/(fam_[a-f0-9-]+)\/members\/(mem_[a-f0-9-]+)$/);
  if (m) {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    if (method === "PATCH") return handlePatchMember(ctx, m[2], body);
    if (method === "DELETE") return handleLeaveFamily(ctx, m[2]);
  }

  if (method === "POST" && path === "/api/claims") {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    return handleSubmitClaim(ctx, body);
  }

  m = path.match(/^\/api\/families\/(fam_[a-f0-9-]+)\/claims$/);
  if (method === "GET" && m) {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    return handleListClaims(ctx);
  }

  m = path.match(/^\/api\/claims\/((?:cl|gr)_[a-z0-9]+)$/);
  if (m) {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    if (method === "GET") return handleGetClaim(ctx, m[1]);
    if (method === "PATCH") return handlePatchClaim(ctx, m[1], body);
  }

  m = path.match(/^\/api\/claims\/(cl_[a-z0-9]+)\/receive$/);
  if (method === "PATCH" && m) {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    return handleReceiveClaim(ctx, m[1], body);
  }

  m = path.match(/^\/api\/claims\/(cl_[a-z0-9]+)\/comments$/);
  if (method === "POST" && m) {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    return handleAddComment(ctx, m[1], body);
  }

  m = path.match(/^\/api\/claims\/(cl_[a-z0-9]+)\/reactions$/);
  if (method === "POST" && m) {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    return handleToggleReaction(ctx, m[1], body);
  }

  // --- 추가 지급(Grant) ---
  if (method === "POST" && path === "/api/grants") {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    return handleSubmitGrant(ctx, body);
  }

  m = path.match(/^\/api\/grants\/((?:cl|gr)_[a-z0-9]+)\/receive$/);
  if (method === "PATCH" && m) {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    return handleReceiveGrant(ctx, m[1], body);
  }

  if (method === "POST" && path === "/api/migrations/from-local") {
    if (!ctx) return err(401, "AUTH_REQUIRED", "인증 필요");
    return handleMigrate(ctx, body);
  }

  return err(404, "NOT_FOUND", "Route not found");
}

// --- fetch 인터셉터 ---
let _originalFetch = null;

/**
 * mock 백엔드를 활성화합니다.
 * API 호출을 가로채서 localStorage 기반으로 처리합니다.
 */
export function enableMockBackend(apiBase) {
  _originalFetch = window.fetch;
  const base = apiBase.replace(/\/$/, "");
  console.debug("[MockBackend] 활성화됨 — API:", base);

  window.fetch = async function(input, init = {}) {
    // Request 객체와 일반 문자열 URL 모두 지원 (C-12)
    let url, method, rawHeaders, rawBody;
    if (input instanceof Request) {
      url = input.url;
      method = input.method;
      rawHeaders = Object.fromEntries(input.headers.entries());
      rawBody = await input.text();
    } else {
      url = input;
      method = (init.method || "GET").toUpperCase();
      rawHeaders = init.headers || {};
      rawBody = init.body;
    }

    // API 호출이 아니면 원래 fetch 사용
    if (!url.startsWith(base)) {
      return _originalFetch.call(window, input, init);
    }

    const path = url.slice(base.length);
    method = method.toUpperCase();

    // OPTIONS (CORS preflight) → 즉시 응답
    if (method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    let body = null;
    if (rawBody) {
      try {
        const bodyStr = typeof rawBody === "string" ? rawBody : await new Response(rawBody).text();
        body = JSON.parse(bodyStr);
      } catch {
        return new Response(JSON.stringify({ error: "MALFORMED_JSON", message: "요청 본문이 올바른 JSON이 아닙니다" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const headers = {};
    if (rawHeaders) {
      if (rawHeaders instanceof Headers) {
        rawHeaders.forEach((v, k) => { headers[k] = v; });
      } else {
        Object.assign(headers, rawHeaders);
      }
    }

    // 약간의 지연 (실제 네트워크 느낌, 테스트 환경에서는 생략)
    const mockDelay = import.meta.env.VITEST ? 0 : Math.random() * 100 + 50;
    if (mockDelay > 0) await new Promise(r => setTimeout(r, mockDelay));

    const result = route(method, path, body, headers);

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  };
}

/**
 * mock 백엔드를 비활성화합니다.
 */
export function disableMockBackend() {
  if (_originalFetch) window.fetch = _originalFetch;
  console.debug("[MockBackend] 비활성화됨");
}
