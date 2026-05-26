// workers/src/routes/families.js — 가족 CRUD 핸들러

import { kvGetJson, kvPutJson, kvAppendToList, kvRemoveFromList } from "../lib/kv.js";
import { generateFamilyCode } from "../lib/codeGen.js";
import { isValidDisplayName, isValidRole, isValidFamilyCode } from "../lib/validators.js";
import { ValidationError, NotFoundError, ConflictError, jsonResponse } from "../lib/errors.js";
import { optionalUserId } from "../middleware/auth.js";

// --- Rate limiting for family code lookup ---
const _rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 attempts per minute

function checkRateLimit(key) {
  const now = Date.now();
  const entry = _rateLimits.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW;
  }
  entry.count++;
  _rateLimits.set(key, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

/**
 * POST /api/families — 가족 생성 + 첫 멤버 등록
 */
export async function handleFamiliesPost(request, env) {
  const body = await request.json();
  const { creator_display_name, creator_role } = body;

  if (!isValidDisplayName(creator_display_name)) {
    throw new ValidationError("INVALID_DISPLAY_NAME", "이름은 1~20자");
  }
  if (!isValidRole(creator_role)) {
    throw new ValidationError("INVALID_ROLE", "역할을 선택해 주세요");
  }

  const deviceId = request.headers.get("X-Device-Id");
  const userId = await optionalUserId(request, env);

  if (!deviceId && !userId) {
    throw new ValidationError("MISSING_AUTH", "X-Device-Id 또는 Authorization이 필요합니다");
  }

  const kv = env.ALLOWANCE_KV;
  const now = new Date().toISOString();

  // 가족 코드 생성 (충돌 시 최대 5회 재시도)
  let familyCode = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateFamilyCode();
    const existing = await kvGetJson(kv, `families/by_code/${candidate}`);
    if (!existing) {
      familyCode = candidate;
      break;
    }
  }
  if (!familyCode) {
    throw new ValidationError("FAMILY_CODE_GENERATION_FAILED", "가족 코드 발급 실패");
  }

  const familyId = `fam_${crypto.randomUUID()}`;
  const memberId = `mem_${crypto.randomUUID()}`;

  const family = {
    family_id: familyId,
    family_code: familyCode,
    created_at: now,
    created_by_member_id: memberId,
    schema_version: 1,
  };

  const member = {
    member_id: memberId,
    family_id: familyId,
    role: creator_role,
    display_name: creator_display_name,
    device_id: deviceId || null,
    user_id: userId || null,
    joined_at: now,
    last_seen_at: now,
    schema_version: 1,
  };

  // KV 저장 (by_code 매핑 먼저)
  await kvPutJson(kv, `families/by_code/${familyCode}`, familyId);
  await kvPutJson(kv, `families/${familyId}`, family);
  await kvPutJson(kv, `families/${familyId}/members/${memberId}`, member);
  await kvPutJson(kv, `families/${familyId}/members/list`, [memberId]);

  if (userId) {
    await kvPutJson(kv, `user_families/${userId}`, [{ family_id: familyId, member_id: memberId }]);
  }

  return jsonResponse({ family, member }, 201);
}

/**
 * GET /api/families/by-code/:code — 가족 코드로 조회 (가입 전 검증)
 */
export async function handleGetFamilyByCode(request, env, code) {
  // Rate limiting per IP (or device_id fallback)
  const rateLimitKey = request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Device-Id")
    || "unknown";
  if (!checkRateLimit(rateLimitKey)) {
    return jsonResponse({ error: "RATE_LIMITED", message: "너무 많은 요청입니다. 잠시 후 다시 시도해 주세요." }, 429);
  }

  if (!isValidFamilyCode(code)) {
    throw new ValidationError("FAMILY_CODE_INVALID", "가족 코드 형식 오류");
  }

  const kv = env.ALLOWANCE_KV;
  const familyId = await kvGetJson(kv, `families/by_code/${code}`);
  if (!familyId) {
    throw new NotFoundError("FAMILY_NOT_FOUND", "가족 코드를 찾을 수 없어요");
  }

  const family = await kvGetJson(kv, `families/${familyId}`);
  if (!family) {
    throw new NotFoundError("FAMILY_DATA_CORRUPTED", "가족 데이터 손상");
  }

  const memberIds = (await kvGetJson(kv, `families/${familyId}/members/list`)) || [];
  const members = [];
  let hasChild = false;
  for (const mid of memberIds) {
    const m = await kvGetJson(kv, `families/${familyId}/members/${mid}`);
    if (m) {
      members.push({
        member_id: m.member_id,
        role: m.role,
        display_name: m.display_name,
        joined_at: m.joined_at,
      });
      if (m.role === "child") hasChild = true;
    }
  }

  return jsonResponse({
    family: { family_id: family.family_id, family_code: family.family_code, created_at: family.created_at },
    members,
    member_count: members.length,
    has_child: hasChild,
    is_full: members.length >= 4,
  });
}

/**
 * POST /api/families/:code/join — 가족 참여
 */
export async function handleJoinFamily(request, env, code) {
  const body = await request.json();
  const { display_name, role } = body;

  if (!isValidDisplayName(display_name)) {
    throw new ValidationError("INVALID_DISPLAY_NAME", "이름은 1~20자");
  }
  if (!isValidRole(role)) {
    throw new ValidationError("INVALID_ROLE", "역할을 선택해 주세요");
  }

  const deviceId = request.headers.get("X-Device-Id");
  const userId = await optionalUserId(request, env);

  if (!deviceId && !userId) {
    throw new ValidationError("MISSING_AUTH", "X-Device-Id 또는 Authorization이 필요합니다");
  }

  const kv = env.ALLOWANCE_KV;
  const familyId = await kvGetJson(kv, `families/by_code/${code}`);
  if (!familyId) {
    throw new NotFoundError("FAMILY_NOT_FOUND", "가족 코드를 찾을 수 없어요");
  }

  const memberIds = (await kvGetJson(kv, `families/${familyId}/members/list`)) || [];

  // 멱등 처리: user_id 또는 device_id+role 매칭
  for (const mid of memberIds) {
    const m = await kvGetJson(kv, `families/${familyId}/members/${mid}`);
    if (!m) continue;
    if (userId && m.user_id === userId && m.role === role) {
      return jsonResponse({ family_id: familyId, member: m, already_member: true });
    }
    if (deviceId && m.device_id === deviceId && m.role === role) {
      return jsonResponse({ family_id: familyId, member: m, already_member: true });
    }
  }

  // 인원 한도 검사
  if (memberIds.length >= 4) {
    throw new ValidationError("FAMILY_FULL", "가족 인원이 가득 찼어요 (2단계는 4명까지)");
  }

  // 자녀 중복 검사
  if (role === "child") {
    for (const mid of memberIds) {
      const m = await kvGetJson(kv, `families/${familyId}/members/${mid}`);
      if (m && m.role === "child") {
        throw new ValidationError("CHILD_ALREADY_EXISTS", "이 가족에는 이미 자녀가 등록되어 있어요");
      }
    }
  }

  const now = new Date().toISOString();
  const memberId = `mem_${crypto.randomUUID()}`;

  const member = {
    member_id: memberId,
    family_id: familyId,
    role,
    display_name,
    device_id: deviceId || null,
    user_id: userId || null,
    joined_at: now,
    last_seen_at: now,
    schema_version: 1,
  };

  await kvPutJson(kv, `families/${familyId}/members/${memberId}`, member);
  await kvAppendToList(kv, `families/${familyId}/members/list`, memberId);

  if (userId) {
    const existing = (await kvGetJson(kv, `user_families/${userId}`)) || [];
    existing.push({ family_id: familyId, member_id: memberId });
    await kvPutJson(kv, `user_families/${userId}`, existing);
  }

  return jsonResponse({ family_id: familyId, member, already_member: false }, 201);
}

/**
 * GET /api/families/:fid — 가족 정보 조회 (인증 필요)
 */
export async function handleGetFamily(env, ctx) {
  const kv = env.ALLOWANCE_KV;
  const familyId = ctx.familyId;

  const memberIds = (await kvGetJson(kv, `families/${familyId}/members/list`)) || [];
  const members = [];
  for (const mid of memberIds) {
    const m = await kvGetJson(kv, `families/${familyId}/members/${mid}`);
    if (m) {
      members.push({
        member_id: m.member_id,
        role: m.role,
        display_name: m.display_name,
        joined_at: m.joined_at,
        last_seen_at: m.last_seen_at,
      });
    }
  }

  return jsonResponse({
    family: ctx.family,
    members,
    member_count: members.length,
  });
}

/**
 * PATCH /api/families/:fid/members/:mid — 멤버 수정 (본인만)
 */
export async function handlePatchMember(request, env, ctx, memberId) {
  if (ctx.member.member_id !== memberId) {
    throw new ValidationError("CAN_ONLY_EDIT_SELF", "본인 정보만 수정할 수 있어요");
  }

  const body = await request.json();
  const { display_name } = body;

  if (!isValidDisplayName(display_name)) {
    throw new ValidationError("INVALID_DISPLAY_NAME", "이름은 1~20자");
  }

  const kv = env.ALLOWANCE_KV;
  const member = await kvGetJson(kv, `families/${ctx.familyId}/members/${memberId}`);
  if (!member) {
    throw new NotFoundError("MEMBER_NOT_FOUND", "멤버를 찾을 수 없어요");
  }

  member.display_name = display_name;
  await kvPutJson(kv, `families/${ctx.familyId}/members/${memberId}`, member);

  return jsonResponse({ member });
}

/**
 * DELETE /api/families/:fid/members/:mid — 가족 탈퇴 (본인만)
 */
export async function handleLeaveFamily(env, ctx, memberId) {
  if (ctx.member.member_id !== memberId) {
    throw new ValidationError("CAN_ONLY_LEAVE_SELF", "본인만 가족을 탈퇴할 수 있어요");
  }

  const kv = env.ALLOWANCE_KV;
  await kvRemoveFromList(kv, `families/${ctx.familyId}/members/list`, memberId);
  await kv.delete(`families/${ctx.familyId}/members/${memberId}`);

  // 마지막 멤버면 가족 해체 (데이터는 보존)
  const remaining = (await kvGetJson(kv, `families/${ctx.familyId}/members/list`)) || [];
  return jsonResponse({ success: true, family_dissolved: remaining.length === 0 });
}
