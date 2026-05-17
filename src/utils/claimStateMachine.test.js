// src/utils/claimStateMachine.test.js
import { describe, it, expect } from "vitest";
import { canTransition, findBlockingClaim, CLAIM_STATUSES } from "./claimStateMachine";

describe("canTransition", () => {
  it("pending → approved 허용", () => {
    expect(canTransition("pending", "approved")).toBe(true);
  });

  it("pending → rejected 허용", () => {
    expect(canTransition("pending", "rejected")).toBe(true);
  });

  it("approved → paid 허용", () => {
    expect(canTransition("approved", "paid")).toBe(true);
  });

  it("rejected → pending 허용 (거절 취소)", () => {
    expect(canTransition("rejected", "pending")).toBe(true);
    expect(canTransition("rejected", "approved")).toBe(false);
  });

  it("paid → received 허용 (수령 확인)", () => {
    expect(canTransition("paid", "received")).toBe(true);
    expect(canTransition("paid", "approved")).toBe(false);
    expect(canTransition("paid", "pending")).toBe(false);
  });

  it("pending → paid 직접 전이 불가", () => {
    expect(canTransition("pending", "paid")).toBe(false);
  });

  it("granted → received 허용", () => {
    expect(canTransition("granted", "received")).toBe(true);
  });

  it("received → 어떤 전이도 불가 (최종 상태)", () => {
    expect(canTransition("received", "pending")).toBe(false);
    expect(canTransition("received", "approved")).toBe(false);
  });
});

describe("findBlockingClaim", () => {
  const claims = [
    { claim_id: "cl_1", year: 2026, month: 5, is_extra: false, status: "pending" },
    { claim_id: "cl_2", year: 2026, month: 4, is_extra: false, status: "paid" },
    { claim_id: "cl_3", year: 2026, month: 5, is_extra: true, status: "pending" },
  ];

  it("같은 월에 pending 정기 청구가 있으면 반환", () => {
    expect(findBlockingClaim(claims, 2026, 5)).toEqual(claims[0]);
  });

  it("paid 상태는 차단하지 않음", () => {
    expect(findBlockingClaim(claims, 2026, 4)).toBeNull();
  });

  it("is_extra=true는 차단하지 않음", () => {
    const extraOnly = [claims[2]];
    expect(findBlockingClaim(extraOnly, 2026, 5)).toBeNull();
  });

  it("다른 월에는 차단 없음", () => {
    expect(findBlockingClaim(claims, 2026, 6)).toBeNull();
  });
});

describe("CLAIM_STATUSES", () => {
  it("6개 상태가 정의되어 있다", () => {
    expect(CLAIM_STATUSES.PENDING).toBe("pending");
    expect(CLAIM_STATUSES.APPROVED).toBe("approved");
    expect(CLAIM_STATUSES.REJECTED).toBe("rejected");
    expect(CLAIM_STATUSES.PAID).toBe("paid");
    expect(CLAIM_STATUSES.GRANTED).toBe("granted");
    expect(CLAIM_STATUSES.RECEIVED).toBe("received");
  });
});
