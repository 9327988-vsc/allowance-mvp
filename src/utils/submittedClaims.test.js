// src/utils/submittedClaims.test.js
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadSubmittedClaims,
  upsertSubmittedClaim,
  getSubmittedClaimForMonth,
  syncSubmittedClaims,
} from "./submittedClaims";

describe("submittedClaims", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("초기 상태에서 빈 배열을 반환한다", () => {
    expect(loadSubmittedClaims()).toEqual([]);
  });

  it("upsert로 추가 후 조회 가능", () => {
    upsertSubmittedClaim({
      claim_id: "cl_test1",
      year: 2026,
      month: 5,
      is_extra: false,
      status: "pending",
      submitted_at: "2026-05-03T10:00:00Z",
    });
    const list = loadSubmittedClaims();
    expect(list).toHaveLength(1);
    expect(list[0].claim_id).toBe("cl_test1");
  });

  it("같은 claim_id로 upsert하면 업데이트", () => {
    upsertSubmittedClaim({ claim_id: "cl_test1", status: "pending" });
    upsertSubmittedClaim({ claim_id: "cl_test1", status: "approved" });
    const list = loadSubmittedClaims();
    expect(list).toHaveLength(1);
    expect(list[0].status).toBe("approved");
  });

  it("getSubmittedClaimForMonth는 정기 청구만 반환", () => {
    upsertSubmittedClaim({ claim_id: "cl_a", year: 2026, month: 5, is_extra: false, status: "pending" });
    upsertSubmittedClaim({ claim_id: "cl_b", year: 2026, month: 5, is_extra: true, status: "pending" });

    const found = getSubmittedClaimForMonth(2026, 5);
    expect(found.claim_id).toBe("cl_a");
  });

  it("해당 월에 제출 없으면 null", () => {
    expect(getSubmittedClaimForMonth(2026, 6)).toBeNull();
  });

  it("syncSubmittedClaims는 서버 상태로 로컬 캐시 업데이트", () => {
    upsertSubmittedClaim({ claim_id: "cl_x", year: 2026, month: 5, is_extra: false, status: "pending" });
    syncSubmittedClaims([{ claim_id: "cl_x", status: "approved" }]);
    const list = loadSubmittedClaims();
    expect(list[0].status).toBe("approved");
  });

  it("손상된 JSON은 빈 배열 반환", () => {
    localStorage.setItem("submitted_claims_v1", "{{bad");
    expect(loadSubmittedClaims()).toEqual([]);
  });
});
