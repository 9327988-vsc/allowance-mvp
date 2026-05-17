// src/utils/idGenerator.js

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export function nanoid(length = 6) {
  let id = "";
  const mask = (1 << Math.ceil(Math.log2(ALPHABET.length))) - 1;
  let maxIter = length * 10;
  while (id.length < length) {
    if (--maxIter <= 0) throw new Error("ID generation failed: max iterations exceeded");
    const arr = new Uint8Array(length - id.length);
    crypto.getRandomValues(arr);
    for (let i = 0; i < arr.length && id.length < length; i++) {
      const idx = arr[i] & mask;
      if (idx < ALPHABET.length) {
        id += ALPHABET[idx];
      }
    }
  }
  return id;
}

export function newExtraItemId() {
  return `ex_${nanoid(6)}`;
}

export function newCategoryId() {
  return `cat_${nanoid(6)}`;
}

// --- 2단계 ID 생성 ---

export function generateClaimId() {
  return `cl_${nanoid(8)}`;
}

export function generateCommentId() {
  return `cm_${nanoid(6)}`;
}

export function generateGrantId() {
  return `gr_${nanoid(8)}`;
}

function uuidFallback() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 폴백: nanoid 기반 UUID-like ID
  return `${nanoid(8)}-${nanoid(4)}-${nanoid(4)}-${nanoid(4)}-${nanoid(12)}`;
}

export function generateMemberId() {
  return `mem_${uuidFallback()}`;
}

export function generateFamilyId() {
  return `fam_${uuidFallback()}`;
}
