// src/utils/diagnosticHelpers.js — DiagnosticScreen 데이터 접근 헬퍼

export function kvRead(key) {
  try {
    const raw = localStorage.getItem("mock_kv:" + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function kvDelete(key) {
  localStorage.removeItem("mock_kv:" + key);
}

/** 가족 데이터 전체 삭제 (localStorage mock_kv 기반) */
export function deleteFamily(familyId) {
  // 멤버 목록 삭제
  const memberList = kvRead(`families/${familyId}/members/list`) || [];
  for (const mid of memberList) {
    kvDelete(`families/${familyId}/members/${mid}`);
  }
  kvDelete(`families/${familyId}/members/list`);

  // 청구 목록 삭제
  const claimList = kvRead(`families/${familyId}/claims/list`) || [];
  for (const cid of claimList) {
    kvDelete(`families/${familyId}/claims/${cid}`);
  }
  kvDelete(`families/${familyId}/claims/list`);

  // 가족 코드 별 인덱스 삭제
  const family = kvRead(`families/${familyId}`);
  if (family?.family_code) {
    kvDelete(`families/by_code/${family.family_code}`);
  }

  // 마이그레이션 키 삭제
  kvDelete(`families/${familyId}/migrations/idempotency`);

  // 가족 본체 삭제
  kvDelete(`families/${familyId}`);
}

export function collectAllFamilies() {
  const families = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith("mock_kv:families/") || k.includes("/members/") || k.includes("/claims/") || k.includes("/migrations/") || k.includes("/by_code/")) continue;
    const match = k.match(/^mock_kv:families\/(fam_[a-f0-9-]+)$/);
    if (!match) continue;
    const family = kvRead(`families/${match[1]}`);
    if (family) families.push(family);
  }
  return families;
}

export function collectFamilyMembers(familyId) {
  const list = kvRead(`families/${familyId}/members/list`) || [];
  return list.map(mid => kvRead(`families/${familyId}/members/${mid}`)).filter(Boolean);
}

export function collectFamilyClaims(familyId) {
  const list = kvRead(`families/${familyId}/claims/list`) || [];
  return list.map(cid => {
    const c = kvRead(`families/${familyId}/claims/${cid}`);
    return c || null;
  }).filter(Boolean);
}
