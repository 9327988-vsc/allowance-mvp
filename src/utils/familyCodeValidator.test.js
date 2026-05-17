// src/utils/familyCodeValidator.test.js
import { describe, it, expect } from "vitest";
import { isValidFamilyCode, normalizeFamilyCode } from "./familyCodeValidator";

describe("isValidFamilyCode", () => {
  it("유효한 6자 코드를 통과시킨다", () => {
    expect(isValidFamilyCode("K3M9P2")).toBe(true);
    expect(isValidFamilyCode("ABCDEF")).toBe(true);
    expect(isValidFamilyCode("234567")).toBe(true);
  });

  it("I, O, 0, 1이 포함된 코드를 거부한다", () => {
    expect(isValidFamilyCode("I3M9P2")).toBe(false);
    expect(isValidFamilyCode("O3M9P2")).toBe(false);
    expect(isValidFamilyCode("03M9P2")).toBe(false);
    expect(isValidFamilyCode("13M9P2")).toBe(false);
  });

  it("길이가 6이 아닌 코드를 거부한다", () => {
    expect(isValidFamilyCode("K3M9P")).toBe(false);
    expect(isValidFamilyCode("K3M9P2X")).toBe(false);
    expect(isValidFamilyCode("")).toBe(false);
  });

  it("소문자 코드를 거부한다", () => {
    expect(isValidFamilyCode("k3m9p2")).toBe(false);
  });

  it("비문자열을 거부한다", () => {
    expect(isValidFamilyCode(null)).toBe(false);
    expect(isValidFamilyCode(123456)).toBe(false);
    expect(isValidFamilyCode(undefined)).toBe(false);
  });
});

describe("normalizeFamilyCode", () => {
  it("소문자를 대문자로 변환한다", () => {
    expect(normalizeFamilyCode("k3m9p2")).toBe("K3M9P2");
  });

  it("앞뒤 공백을 제거한다", () => {
    expect(normalizeFamilyCode("  K3M9P2  ")).toBe("K3M9P2");
  });

  it("빈 값은 빈 문자열을 반환한다", () => {
    expect(normalizeFamilyCode("")).toBe("");
    expect(normalizeFamilyCode(null)).toBe("");
    expect(normalizeFamilyCode(undefined)).toBe("");
  });
});
