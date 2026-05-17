// src/utils/submittedClaims.js — 제출된 청구 로컬 캐시

const STORAGE_KEY = "submitted_claims_v1";

/**
 * 제출된 청구 참조 목록 로드
 * @returns {Array<{claim_id: string, year: number, month: number, is_extra: boolean, status: string, submitted_at: string}>}
 */
export function loadSubmittedClaims() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("loadSubmittedClaims: parse failed:", e);
    return [];
  }
}

/**
 * 청구 참조 추가/업데이트 (claim_id 기준 upsert)
 */
export function upsertSubmittedClaim(ref) {
  const list = loadSubmittedClaims();
  const idx = list.findIndex((c) => c.claim_id === ref.claim_id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...ref };
  } else {
    list.unshift(ref);
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { console.warn("upsertSubmittedClaim: save failed:", e); }
}

/**
 * 특정 월의 제출 상태 조회 (is_extra=false 정기 청구만)
 * @returns {object|null}
 */
export function getSubmittedClaimForMonth(year, month) {
  const list = loadSubmittedClaims();
  return list.find(
    (c) => c.year === year && c.month === month && !c.is_extra
  ) || null;
}

/**
 * 서버에서 받은 최신 상태로 로컬 캐시 동기화
 */
export function syncSubmittedClaims(serverClaims) {
  const list = loadSubmittedClaims();
  let changed = false;

  const serverIds = new Set(serverClaims.map((sc) => sc.claim_id));
  const syncFields = ["status", "received_at", "decided_at", "paid_at", "rejection_reason"];

  for (const sc of serverClaims) {
    const idx = list.findIndex((c) => c.claim_id === sc.claim_id);
    if (idx >= 0) {
      for (const field of syncFields) {
        if (sc[field] !== undefined && list[idx][field] !== sc[field]) {
          list[idx][field] = sc[field];
          changed = true;
        }
      }
    }
  }

  // 서버에 없는 로컬 청구 제거
  // Only prune if server returned data (non-empty response means sync is authoritative)
  // Don't prune if server returned an empty array AND we have local data (could be a server error)
  const shouldPrune = serverClaims.length > 0 || list.length === 0;
  const prunedList = shouldPrune
    ? list.filter((c) => serverIds.has(c.claim_id))
    : list;
  if (prunedList.length !== list.length) {
    changed = true;
  }

  if (changed) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prunedList)); } catch (e) { console.warn("syncSubmittedClaims: save failed:", e); }
  }
}
