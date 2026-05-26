// workers/src/middleware/auth.js — JWT + device_id 이중 인증 미들웨어

import jwt from "@tsndr/cloudflare-worker-jwt";
import { kvGetJson, kvPutJson } from "../lib/kv.js";
import { AuthError } from "../lib/errors.js";

/**
 * 보호된 라우트용 인증. JWT Bearer 우선, 없으면 device_id 폴백.
 * 반환: { family, member, familyId, userId? }
 */
export async function withAuth(request, env) {
  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return await authWithJwt(authHeader.slice(7), request, env);
  }

  return await authWithDevice(request, env);
}

/**
 * 비보호 라우트에서 JWT가 있으면 user_id를 추출 (없어도 에러 안 남).
 */
export async function optionalUserId(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice(7);
    const valid = await jwt.verify(token, env.JWT_SECRET);
    if (!valid) return null;
    const { payload } = jwt.decode(token);
    return payload.sub;
  } catch {
    return null;
  }
}

// --- JWT 인증 ---

async function authWithJwt(token, request, env) {
  const valid = await jwt.verify(token, env.JWT_SECRET);
  if (!valid) {
    throw new AuthError("INVALID_TOKEN", "유효하지 않은 토큰입니다");
  }

  const { payload } = jwt.decode(token);
  const userId = payload.sub;
  const kv = env.ALLOWANCE_KV;

  const families = await kvGetJson(kv, `user_families/${userId}`);
  if (!families || families.length === 0) {
    throw new AuthError("NO_FAMILY", "가입된 가족이 없습니다");
  }

  let target = families[0];

  const familyCode = request.headers.get("X-Family-Code");
  if (familyCode) {
    const familyId = await kvGetJson(kv, `families/by_code/${familyCode}`);
    if (familyId) {
      const found = families.find(f => f.family_id === familyId);
      if (found) target = found;
    }
  }

  const family = await kvGetJson(kv, `families/${target.family_id}`);
  if (!family) {
    throw new AuthError("FAMILY_DATA_CORRUPTED", "가족 데이터를 찾을 수 없습니다");
  }

  const member = await kvGetJson(kv, `families/${target.family_id}/members/${target.member_id}`);
  if (!member) {
    throw new AuthError("MEMBER_NOT_FOUND", "멤버 정보를 찾을 수 없습니다");
  }

  updateLastSeen(kv, target.family_id, member);

  return { family, member, familyId: target.family_id, userId };
}

// --- Device ID 폴백 인증 (레거시) ---

async function authWithDevice(request, env) {
  const deviceId = request.headers.get("X-Device-Id");
  if (!deviceId) {
    throw new AuthError("MISSING_AUTH", "Authorization 헤더 또는 X-Device-Id가 필요합니다");
  }

  const familyCode = request.headers.get("X-Family-Code");
  if (!familyCode) {
    throw new AuthError("MISSING_FAMILY_CODE", "X-Family-Code 헤더가 필요합니다");
  }

  const kv = env.ALLOWANCE_KV;
  const familyId = await kvGetJson(kv, `families/by_code/${familyCode}`);
  if (!familyId) {
    throw new AuthError("FAMILY_NOT_FOUND", "가족을 찾을 수 없습니다");
  }

  const family = await kvGetJson(kv, `families/${familyId}`);
  if (!family) {
    throw new AuthError("FAMILY_DATA_CORRUPTED", "가족 데이터를 찾을 수 없습니다");
  }

  const memberId = request.headers.get("X-Member-Id");
  const memberIds = (await kvGetJson(kv, `families/${familyId}/members/list`)) || [];
  let member = null;
  for (const mid of memberIds) {
    const m = await kvGetJson(kv, `families/${familyId}/members/${mid}`);
    if (m && m.device_id === deviceId) {
      if (memberId && m.member_id !== memberId) continue;
      member = m;
      break;
    }
  }

  if (!member) {
    throw new AuthError("MEMBER_NOT_FOUND", "이 기기로 등록된 멤버를 찾을 수 없습니다");
  }

  updateLastSeen(kv, familyId, member);

  return { family, member, familyId };
}

// --- 공통 ---

function updateLastSeen(kv, familyId, member) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  if (!member.last_seen_at || member.last_seen_at < fiveMinutesAgo) {
    member.last_seen_at = new Date().toISOString();
    kvPutJson(kv, `families/${familyId}/members/${member.member_id}`, member).catch(() => {});
  }
}
