// src/utils/formatAmount.test.js
import { describe, it, expect, beforeEach } from "vitest";
import {
  formatAmount,
  formatAmountShort,
  setAmountFormat,
  getAmountFormat,
  _resetAmountFormat,
} from "./formatAmount";

beforeEach(() => {
  _resetAmountFormat();
});

describe("setAmountFormat / getAmountFormat", () => {
  it("기본값 won", () => {
    expect(getAmountFormat()).toBe("won");
  });

  it("man 설정", () => {
    setAmountFormat("man");
    expect(getAmountFormat()).toBe("man");
  });

  it("잘못된 값 → won", () => {
    setAmountFormat("invalid");
    expect(getAmountFormat()).toBe("won");
  });
});

describe("formatAmount (won 모드)", () => {
  it("일반 금액", () => {
    expect(formatAmount(10000)).toBe("10,000원");
  });

  it("0원", () => {
    expect(formatAmount(0)).toBe("0원");
  });

  it("음수", () => {
    expect(formatAmount(-5000)).toBe("-5,000원");
  });

  it("소수 반올림", () => {
    expect(formatAmount(1234.6)).toBe("1,235원");
  });

  it("NaN → 0원", () => {
    expect(formatAmount(NaN)).toBe("0원");
  });

  it("Infinity → 0원", () => {
    expect(formatAmount(Infinity)).toBe("0원");
  });

  it("문자열 → 0원", () => {
    expect(formatAmount("1000")).toBe("0원");
  });

  it("null → 0원", () => {
    expect(formatAmount(null)).toBe("0원");
  });
});

describe("formatAmount (man 모드)", () => {
  beforeEach(() => setAmountFormat("man"));

  it("10000원 → 1만원", () => {
    expect(formatAmount(10000)).toBe("1만원");
  });

  it("50000원 → 5만원", () => {
    expect(formatAmount(50000)).toBe("5만원");
  });

  it("15000원 → 1만 5,000원", () => {
    expect(formatAmount(15000)).toBe("1만 5,000원");
  });

  it("9999원 → 9,999원 (1만 미만은 원 표시)", () => {
    expect(formatAmount(9999)).toBe("9,999원");
  });

  it("음수 -30000 → -3만원", () => {
    expect(formatAmount(-30000)).toBe("-3만원");
  });

  it("음수 -25000 → -2만 5,000원", () => {
    expect(formatAmount(-25000)).toBe("-2만 5,000원");
  });
});

describe("formatAmountShort (won 모드)", () => {
  it("일반 금액 (단위 없음)", () => {
    expect(formatAmountShort(10000)).toBe("10,000");
  });

  it("0", () => {
    expect(formatAmountShort(0)).toBe("0");
  });

  it("NaN → 0", () => {
    expect(formatAmountShort(NaN)).toBe("0");
  });

  it("null → 0", () => {
    expect(formatAmountShort(null)).toBe("0");
  });
});

describe("formatAmountShort (man 모드)", () => {
  beforeEach(() => setAmountFormat("man"));

  it("10000 → 1만", () => {
    expect(formatAmountShort(10000)).toBe("1만");
  });

  it("15000 → 1만 5,000", () => {
    expect(formatAmountShort(15000)).toBe("1만 5,000");
  });

  it("9999 → 9,999 (1만 미만)", () => {
    expect(formatAmountShort(9999)).toBe("9,999");
  });

  it("음수 -20000 → -2만", () => {
    expect(formatAmountShort(-20000)).toBe("-2만");
  });
});
