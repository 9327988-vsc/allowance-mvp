// src/utils/diagnosticHelpers.test.js
import { describe, it, expect, beforeEach } from "vitest";
import {
  kvRead,
  kvDelete,
  deleteFamily,
  collectAllFamilies,
  collectFamilyMembers,
  collectFamilyClaims,
} from "./diagnosticHelpers";

beforeEach(() => {
  localStorage.clear();
});

// ─── 헬퍼: localStorage에 mock_kv 데이터 세팅 ───
function kvSet(key, value) {
  localStorage.setItem("mock_kv:" + key, JSON.stringify(value));
}

// ─── kvRead ───
describe("kvRead", () => {
  it("저장된 JSON 값을 파싱하여 반환", () => {
    kvSet("test/key", { a: 1 });
    expect(kvRead("test/key")).toEqual({ a: 1 });
  });

  it("문자열 값도 정상 파싱", () => {
    kvSet("str", "hello");
    expect(kvRead("str")).toBe("hello");
  });

  it("숫자 값 파싱", () => {
    kvSet("num", 42);
    expect(kvRead("num")).toBe(42);
  });

  it("배열 값 파싱", () => {
    kvSet("arr", [1, 2, 3]);
    expect(kvRead("arr")).toEqual([1, 2, 3]);
  });

  it("존재하지 않는 키는 null 반환", () => {
    expect(kvRead("nonexistent")).toBeNull();
  });

  it("파싱 불가능한 값은 null 반환 (try-catch)", () => {
    localStorage.setItem("mock_kv:broken", "{invalid json");
    expect(kvRead("broken")).toBeNull();
  });

  it("빈 문자열 키도 동작", () => {
    kvSet("", "empty-key");
    expect(kvRead("")).toBe("empty-key");
  });

  it("null 값이 저장된 경우 null 반환", () => {
    kvSet("nullval", null);
    expect(kvRead("nullval")).toBeNull();
  });

  it("boolean 값 파싱", () => {
    kvSet("bool", true);
    expect(kvRead("bool")).toBe(true);
  });
});

// ─── kvDelete ───
describe("kvDelete", () => {
  it("저장된 키를 삭제", () => {
    kvSet("del/target", "value");
    expect(kvRead("del/target")).toBe("value");
    kvDelete("del/target");
    expect(kvRead("del/target")).toBeNull();
  });

  it("존재하지 않는 키 삭제 시 에러 없음", () => {
    expect(() => kvDelete("nonexistent")).not.toThrow();
  });

  it("삭제 후 localStorage에서 완전 제거됨", () => {
    kvSet("check", 1);
    kvDelete("check");
    expect(localStorage.getItem("mock_kv:check")).toBeNull();
  });
});

// ─── deleteFamily ───
describe("deleteFamily", () => {
  const familyId = "fam_abc123";

  function setupFamily() {
    // 가족 본체
    kvSet(`families/${familyId}`, {
      id: familyId,
      family_code: "CODE123",
      name: "테스트가족",
    });

    // 멤버
    kvSet(`families/${familyId}/members/list`, ["m1", "m2"]);
    kvSet(`families/${familyId}/members/m1`, { id: "m1", name: "부모" });
    kvSet(`families/${familyId}/members/m2`, { id: "m2", name: "아이" });

    // 청구
    kvSet(`families/${familyId}/claims/list`, ["c1"]);
    kvSet(`families/${familyId}/claims/c1`, { id: "c1", amount: 1000 });

    // 코드 인덱스
    kvSet(`families/by_code/CODE123`, familyId);

    // 마이그레이션
    kvSet(`families/${familyId}/migrations/idempotency`, { v: 1 });
  }

  it("가족 관련 모든 데이터 삭제", () => {
    setupFamily();
    deleteFamily(familyId);

    expect(kvRead(`families/${familyId}`)).toBeNull();
    expect(kvRead(`families/${familyId}/members/list`)).toBeNull();
    expect(kvRead(`families/${familyId}/members/m1`)).toBeNull();
    expect(kvRead(`families/${familyId}/members/m2`)).toBeNull();
    expect(kvRead(`families/${familyId}/claims/list`)).toBeNull();
    expect(kvRead(`families/${familyId}/claims/c1`)).toBeNull();
    expect(kvRead(`families/by_code/CODE123`)).toBeNull();
    expect(kvRead(`families/${familyId}/migrations/idempotency`)).toBeNull();
  });

  it("멤버 없는 가족도 삭제 가능", () => {
    kvSet(`families/${familyId}`, { id: familyId, family_code: "X" });
    kvSet(`families/by_code/X`, familyId);
    // members/list, claims/list 없음
    expect(() => deleteFamily(familyId)).not.toThrow();
    expect(kvRead(`families/${familyId}`)).toBeNull();
    expect(kvRead(`families/by_code/X`)).toBeNull();
  });

  it("family_code 없는 가족도 삭제 가능", () => {
    kvSet(`families/${familyId}`, { id: familyId });
    expect(() => deleteFamily(familyId)).not.toThrow();
    expect(kvRead(`families/${familyId}`)).toBeNull();
  });

  it("가족 본체가 없어도 에러 없이 동작", () => {
    // 가족 본체 없이 멤버만 있는 비정상 상태
    kvSet(`families/${familyId}/members/list`, ["m1"]);
    kvSet(`families/${familyId}/members/m1`, { id: "m1" });
    expect(() => deleteFamily(familyId)).not.toThrow();
    expect(kvRead(`families/${familyId}/members/list`)).toBeNull();
    expect(kvRead(`families/${familyId}/members/m1`)).toBeNull();
  });

  it("청구 목록이 비어있어도 정상 동작", () => {
    kvSet(`families/${familyId}`, { id: familyId });
    kvSet(`families/${familyId}/claims/list`, []);
    expect(() => deleteFamily(familyId)).not.toThrow();
  });

  it("다른 가족 데이터에 영향 없음", () => {
    setupFamily();
    const otherId = "fam_other999";
    kvSet(`families/${otherId}`, { id: otherId, family_code: "OTHER" });
    kvSet(`families/${otherId}/members/list`, ["mx"]);
    kvSet(`families/${otherId}/members/mx`, { id: "mx" });

    deleteFamily(familyId);

    // 다른 가족 데이터 보존
    expect(kvRead(`families/${otherId}`)).toEqual({ id: otherId, family_code: "OTHER" });
    expect(kvRead(`families/${otherId}/members/list`)).toEqual(["mx"]);
    expect(kvRead(`families/${otherId}/members/mx`)).toEqual({ id: "mx" });
  });
});

// ─── collectAllFamilies ───
describe("collectAllFamilies", () => {
  it("저장된 모든 가족 객체 수집", () => {
    kvSet("families/fam_aaa111-bbb222-ccc333", { id: "fam_aaa111-bbb222-ccc333", name: "가족A" });
    kvSet("families/fam_ddd444-eee555-fff666", { id: "fam_ddd444-eee555-fff666", name: "가족B" });

    const result = collectAllFamilies();
    expect(result).toHaveLength(2);
    const names = result.map(f => f.name).sort();
    expect(names).toEqual(["가족A", "가족B"]);
  });

  it("가족 데이터가 없으면 빈 배열 반환", () => {
    expect(collectAllFamilies()).toEqual([]);
  });

  it("members/claims/migrations/by_code 키는 제외", () => {
    kvSet("families/fam_aaa111-bbb222-ccc333", { id: "fam_aaa111-bbb222-ccc333" });
    kvSet("families/fam_aaa111-bbb222-ccc333/members/list", ["m1"]);
    kvSet("families/fam_aaa111-bbb222-ccc333/claims/list", ["c1"]);
    kvSet("families/fam_aaa111-bbb222-ccc333/migrations/idempotency", {});
    kvSet("families/by_code/ABC", "fam_aaa111-bbb222-ccc333");

    const result = collectAllFamilies();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fam_aaa111-bbb222-ccc333");
  });

  it("fam_ 접두사가 아닌 키는 무시", () => {
    kvSet("families/notafamily", { id: "notafamily" });
    kvSet("families/fam_aaa111-bbb222-ccc333", { id: "fam_aaa111-bbb222-ccc333" });

    const result = collectAllFamilies();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fam_aaa111-bbb222-ccc333");
  });

  it("mock_kv 접두사 없는 키는 무시", () => {
    localStorage.setItem("families/fam_aaa111-bbb222-ccc333", JSON.stringify({ id: "test" }));
    expect(collectAllFamilies()).toEqual([]);
  });
});

// ─── collectFamilyMembers ───
describe("collectFamilyMembers", () => {
  const familyId = "fam_test123";

  it("가족 멤버 목록 수집", () => {
    kvSet(`families/${familyId}/members/list`, ["m1", "m2"]);
    kvSet(`families/${familyId}/members/m1`, { id: "m1", name: "부모" });
    kvSet(`families/${familyId}/members/m2`, { id: "m2", name: "아이" });

    const members = collectFamilyMembers(familyId);
    expect(members).toHaveLength(2);
    expect(members[0]).toEqual({ id: "m1", name: "부모" });
    expect(members[1]).toEqual({ id: "m2", name: "아이" });
  });

  it("멤버 목록이 없으면 빈 배열 반환", () => {
    expect(collectFamilyMembers(familyId)).toEqual([]);
  });

  it("멤버 목록은 있지만 멤버 데이터가 없으면 필터링", () => {
    kvSet(`families/${familyId}/members/list`, ["m1", "m2", "m3"]);
    kvSet(`families/${familyId}/members/m1`, { id: "m1" });
    // m2, m3 데이터 없음

    const members = collectFamilyMembers(familyId);
    expect(members).toHaveLength(1);
    expect(members[0].id).toBe("m1");
  });

  it("빈 멤버 목록이면 빈 배열 반환", () => {
    kvSet(`families/${familyId}/members/list`, []);
    expect(collectFamilyMembers(familyId)).toEqual([]);
  });
});

// ─── collectFamilyClaims ───
describe("collectFamilyClaims", () => {
  const familyId = "fam_claim123";

  it("가족 청구 목록 수집", () => {
    kvSet(`families/${familyId}/claims/list`, ["c1", "c2"]);
    kvSet(`families/${familyId}/claims/c1`, { id: "c1", amount: 1000, desc: "간식" });
    kvSet(`families/${familyId}/claims/c2`, { id: "c2", amount: 2000, desc: "문구" });

    const claims = collectFamilyClaims(familyId);
    expect(claims).toHaveLength(2);
    expect(claims[0]).toEqual({ id: "c1", amount: 1000, desc: "간식" });
    expect(claims[1]).toEqual({ id: "c2", amount: 2000, desc: "문구" });
  });

  it("청구 목록이 없으면 빈 배열 반환", () => {
    expect(collectFamilyClaims(familyId)).toEqual([]);
  });

  it("청구 목록은 있지만 청구 데이터가 없으면 필터링", () => {
    kvSet(`families/${familyId}/claims/list`, ["c1", "c2"]);
    kvSet(`families/${familyId}/claims/c1`, { id: "c1", amount: 500 });
    // c2 데이터 없음

    const claims = collectFamilyClaims(familyId);
    expect(claims).toHaveLength(1);
    expect(claims[0].id).toBe("c1");
  });

  it("빈 청구 목록이면 빈 배열 반환", () => {
    kvSet(`families/${familyId}/claims/list`, []);
    expect(collectFamilyClaims(familyId)).toEqual([]);
  });

  it("여러 청구가 순서대로 반환됨", () => {
    kvSet(`families/${familyId}/claims/list`, ["c3", "c1", "c2"]);
    kvSet(`families/${familyId}/claims/c1`, { id: "c1" });
    kvSet(`families/${familyId}/claims/c2`, { id: "c2" });
    kvSet(`families/${familyId}/claims/c3`, { id: "c3" });

    const claims = collectFamilyClaims(familyId);
    expect(claims).toHaveLength(3);
    expect(claims.map(c => c.id)).toEqual(["c3", "c1", "c2"]);
  });
});
