// src/utils/spendingLimit.test.js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkSpendingLimit, notifySpendingLimit, _resetSpendingLimitNotifications } from "./spendingLimit";

// showToast mock
vi.mock("./toastManager", () => ({
  showToast: vi.fn(),
}));
import { showToast } from "./toastManager";

beforeEach(() => {
  _resetSpendingLimitNotifications();
  showToast.mockClear();
});

describe("checkSpendingLimit", () => {
  it("한도 미설정 → exceeded false, limit null", () => {
    const r = checkSpendingLimit(50000, {});
    expect(r.exceeded).toBe(false);
    expect(r.limit).toBeNull();
  });

  it("한도 0 → limit null", () => {
    expect(checkSpendingLimit(1000, { spending_limit: 0 }).limit).toBeNull();
  });

  it("한도 음수 → limit null", () => {
    expect(checkSpendingLimit(1000, { spending_limit: -1 }).limit).toBeNull();
  });

  it("한도 미만 → exceeded false", () => {
    const r = checkSpendingLimit(40000, { spending_limit: 50000 });
    expect(r.exceeded).toBe(false);
    expect(r.percent).toBe(80);
    expect(r.remaining).toBe(10000);
    expect(r.limit).toBe(50000);
  });

  it("한도 초과 → exceeded true", () => {
    const r = checkSpendingLimit(60000, { spending_limit: 50000 });
    expect(r.exceeded).toBe(true);
    expect(r.percent).toBe(120);
    expect(r.remaining).toBe(-10000);
  });

  it("정확히 한도 → exceeded false (> 아닌 == 이므로)", () => {
    const r = checkSpendingLimit(50000, { spending_limit: 50000 });
    expect(r.exceeded).toBe(false);
    expect(r.percent).toBe(100);
  });

  it("currentTotal이 문자열 → 0 처리", () => {
    const r = checkSpendingLimit("invalid", { spending_limit: 50000 });
    expect(r.percent).toBe(0);
    expect(r.exceeded).toBe(false);
  });
});

describe("notifySpendingLimit", () => {
  it("한도 미설정 → 토스트 안 뜸", () => {
    notifySpendingLimit(2026, 5, 50000, {});
    expect(showToast).not.toHaveBeenCalled();
  });

  it("한도 초과 → 경고 토스트", () => {
    notifySpendingLimit(2026, 5, 60000, { spending_limit: 50000 });
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0].type).toBe("warning");
    expect(showToast.mock.calls[0][0].message).toContain("초과");
  });

  it("80% 도달 → 경고 토스트", () => {
    notifySpendingLimit(2026, 5, 40000, { spending_limit: 50000 });
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0].message).toContain("80%");
  });

  it("79% → 토스트 안 뜸", () => {
    notifySpendingLimit(2026, 5, 39000, { spending_limit: 50000 });
    expect(showToast).not.toHaveBeenCalled();
  });

  it("동일 월 중복 알림 안 뜸 (세션당 1회)", () => {
    notifySpendingLimit(2026, 5, 60000, { spending_limit: 50000 });
    notifySpendingLimit(2026, 5, 70000, { spending_limit: 50000 });
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it("다른 월로 전환 시 알림 초기화", () => {
    notifySpendingLimit(2026, 5, 60000, { spending_limit: 50000 });
    expect(showToast).toHaveBeenCalledTimes(1);
    // 6월로 전환 — 5월 알림 키 제거됨
    notifySpendingLimit(2026, 6, 60000, { spending_limit: 50000 });
    expect(showToast).toHaveBeenCalledTimes(2);
  });

  it("리셋 후 다시 알림 가능", () => {
    notifySpendingLimit(2026, 5, 60000, { spending_limit: 50000 });
    _resetSpendingLimitNotifications();
    notifySpendingLimit(2026, 5, 60000, { spending_limit: 50000 });
    expect(showToast).toHaveBeenCalledTimes(2);
  });
});
