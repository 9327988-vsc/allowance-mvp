// workers/src/middleware/auth.js — X-Device-Id + X-Family-Code 인증

import { kvGetJson, kvPutJson } from "../lib/kv.js";
import { AuthError } from "../lib/errors.js";

/**
 * 인증 미들웨어: 요청에서 device_id, family_code를 추출하고
 * KV에서 family + member를 조회하여 ctx에 주입
 */
export async function withAuth(request, env) {
  const deviceId = request.headers.get("X-Device-Id");
  if (!deviceId) {
    throw new AuthError("MISSING_DEVICE_ID", "X-Device-Id header required");
  }

  const familyCode = request.headers.get("X-Family-Code");
  if (!familyCode) {
    throw new AuthError("MISSING_FAMILY_CODE", "X-Family-Code header required");
  }

  const kv = env.ALLOWANCE_KV;

  // family_code → family_id
  const familyId = await kvGetJson(kv, `families/by_code/${familyCode}`);
  if (!familyId) {
    throw new AuthError("FAMILY_NOT_FOUND", "Family not found for code");
  }

  const family = await kvGetJson(kv, `families/${familyId}`);
  if (!family) {
    throw new AuthError("FAMILY_DATA_CORRUPTED", "Family data missing");
  }

  // 멤버 목록에서 device_id (+ 선택적 member_id) 매칭
  const memberId = request.headers.get("X-Member-Id");
  const memberIds = (await kvGetJson(kv, `families/${familyId}/members/list`)) || [];
  let member = null;
  for (const mid of memberIds) {
    const m = await kvGetJson(kv, `families/${familyId}/members/${mid}`);
    if (m && m.device_id === deviceId) {
      // X-Member-Id가 지정된 경우 member_id도 일치해야 함
      if (memberId && m.member_id !== memberId) continue;
      member = m;
      break;
    }
  }

  if (!member) {
    throw new AuthError("MEMBER_NOT_FOUND", "No member found for this device");
  }

  // last_seen_at 갱신 (best-effort, 5분 쓰로틀링)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  if (!member.last_seen_at || member.last_seen_at < fiveMinutesAgo) {
    member.last_seen_at = new Date().toISOString();
    kvPutJson(kv, `families/${familyId}/members/${member.member_id}`, member).catch(() => {});
  }

  return { family, member, familyId };
}
