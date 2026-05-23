// workers/src/routes/migrations.js — 1단계 → 2단계 데이터 마이그레이션 (CR-23 멱등)

import { kvGetJson, kvPutJson, kvAppendToList } from "../lib/kv.js";
import { jsonResponse, ValidationError, ConflictError } from "../lib/errors.js";

function errorResponse(status, code, message) {
  return jsonResponse({ error: code, message }, status);
}

/**
 * POST /api/migrations/from-local
 * 1단계 로컬 데이터를 서버에 마이그레이션 (멱등)
 *
 * Body: {
 *   idempotency_key: string,   // 중복 실행 방지
 *   claims: Array<{
 *     claim_id, year, month, is_extra, snapshot, submitted_at
 *   }>
 * }
 */
export async function handleMigrateFromLocal(request, env, ctx) {
  const body = await request.json();
  const { idempotency_key, claims } = body;

  if (!idempotency_key) {
    throw new ValidationError("VALIDATION_ERROR", "idempotency_key 필수");
  }

  if (!Array.isArray(claims) || claims.length === 0) {
    throw new ValidationError("VALIDATION_ERROR", "마이그레이션할 청구가 없습니다");
  }

  // 자녀만 마이그레이션 가능
  if (ctx.member.role !== "child") {
    throw new ValidationError("CHILD_ONLY", "자녀만 마이그레이션할 수 있습니다");
  }

  const memberId = ctx.member.member_id;

  // 멱등성 검사 — 같은 키로 이미 마이그레이션 완료된 경우 (member_id 포함으로 자녀 간 충돌 방지)
  const migrationKey = `families/${ctx.familyId}/migrations/${memberId}/${idempotency_key}`;
  const existing = await kvGetJson(env.ALLOWANCE_KV, migrationKey);
  if (existing) {
    return jsonResponse({
      migrated: false,
      message: "이미 마이그레이션 완료",
      idempotency_key,
      migrated_count: existing.migrated_count,
    });
  }

  const now = new Date().toISOString();
  let migratedCount = 0;

  for (const c of claims) {
    if (!c.claim_id || !c.year || !c.month || !c.snapshot) continue;

    // C-6: 클라이언트 입력 검증
    if (typeof c.claim_id !== "string" || c.claim_id.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(c.claim_id)) {
      return errorResponse(400, "INVALID_DATA", "잘못된 claim_id");
    }
    if (c.year < 2024 || c.year > 2030) {
      return errorResponse(400, "INVALID_DATA", "잘못된 연도");
    }
    if (c.month < 1 || c.month > 12) {
      return errorResponse(400, "INVALID_DATA", "잘못된 월");
    }
    if (JSON.stringify(c.snapshot).length > 100000) {
      return errorResponse(400, "PAYLOAD_TOO_LARGE", "스냅샷이 너무 큽니다");
    }

    const claim = {
      claim_id: c.claim_id,
      family_id: ctx.familyId,
      child_member_id: ctx.member.member_id,
      year: c.year,
      month: c.month,
      is_extra: !!c.is_extra,
      snapshot: c.snapshot,
      status: "pending",
      submitted_at: c.submitted_at || now,
      decided_at: null,
      paid_at: null,
      received_at: null,
      decided_by_member_id: null,
      paid_by_member_id: null,
      rejection_reason: null,
      comments: [],
      schema_version: 1,
      updated_at: now,
      migrated_from_local: true,
    };

    await kvPutJson(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/${c.claim_id}`, claim);
    await kvAppendToList(env.ALLOWANCE_KV, `families/${ctx.familyId}/claims/list`, c.claim_id);
    migratedCount++;
  }

  // 멱등성 기록 저장 (90일 보존)
  await kvPutJson(env.ALLOWANCE_KV, migrationKey, {
    idempotency_key,
    migrated_count: migratedCount,
    migrated_at: now,
    member_id: ctx.member.member_id,
  });

  return jsonResponse({
    migrated: true,
    idempotency_key,
    migrated_count: migratedCount,
  }, 201);
}
