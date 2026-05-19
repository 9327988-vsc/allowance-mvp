// src/utils/salaryCalculator.test.js
import { describe, it, expect } from "vitest";
import { calculateNetSalary } from "./salaryCalculator";

describe("calculateNetSalary", () => {
  describe("엣지 케이스", () => {
    it("0 → 모든 값 0", () => {
      const result = calculateNetSalary(0);
      expect(result.gross).toBe(0);
      expect(result.totalDeduction).toBe(0);
      expect(result.net).toBe(0);
      expect(result.deductions.국민연금).toBe(0);
    });

    it("null → 모든 값 0", () => {
      const result = calculateNetSalary(null);
      expect(result.net).toBe(0);
    });

    it("undefined → 모든 값 0", () => {
      const result = calculateNetSalary(undefined);
      expect(result.net).toBe(0);
    });

    it("음수 → 모든 값 0", () => {
      const result = calculateNetSalary(-1000000);
      expect(result.net).toBe(0);
    });
  });

  describe("반환 구조 검증", () => {
    it("필수 필드 존재", () => {
      const result = calculateNetSalary(3000000);
      expect(result).toHaveProperty("gross");
      expect(result).toHaveProperty("deductions");
      expect(result).toHaveProperty("totalDeduction");
      expect(result).toHaveProperty("net");
    });

    it("공제 항목 6가지 존재", () => {
      const result = calculateNetSalary(3000000);
      const keys = Object.keys(result.deductions);
      expect(keys).toContain("국민연금");
      expect(keys).toContain("건강보험");
      expect(keys).toContain("장기요양");
      expect(keys).toContain("고용보험");
      expect(keys).toContain("소득세");
      expect(keys).toContain("지방소득세");
    });

    it("gross가 입력값과 동일", () => {
      const result = calculateNetSalary(5000000);
      expect(result.gross).toBe(5000000);
    });
  });

  describe("계산 정합성", () => {
    it("net = gross - totalDeduction", () => {
      const result = calculateNetSalary(3000000);
      expect(result.net).toBe(result.gross - result.totalDeduction);
    });

    it("totalDeduction = 모든 공제 합", () => {
      const result = calculateNetSalary(4000000);
      const d = result.deductions;
      const sum = d.국민연금 + d.건강보험 + d.장기요양 + d.고용보험 + d.소득세 + d.지방소득세;
      expect(result.totalDeduction).toBe(sum);
    });

    it("지방소득세 = 소득세 * 10%", () => {
      const result = calculateNetSalary(5000000);
      expect(result.deductions.지방소득세).toBe(Math.round(result.deductions.소득세 * 0.1));
    });

    it("모든 공제액은 0 이상", () => {
      const result = calculateNetSalary(2000000);
      for (const val of Object.values(result.deductions)) {
        expect(val).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("국민연금 상한/하한", () => {
    it("하한 미만 급여 → 실제 급여 기준 계산", () => {
      // 370000 미만
      const result = calculateNetSalary(300000);
      expect(result.deductions.국민연금).toBe(Math.round(300000 * 0.045));
    });

    it("상한 초과 급여 → 상한 기준 계산", () => {
      // 5900000 초과
      const result = calculateNetSalary(10000000);
      expect(result.deductions.국민연금).toBe(Math.round(5900000 * 0.045));
    });

    it("범위 내 급여 → 실제 급여 기준 계산", () => {
      const result = calculateNetSalary(3000000);
      expect(result.deductions.국민연금).toBe(Math.round(3000000 * 0.045));
    });
  });

  describe("건강보험/고용보험", () => {
    it("건강보험 = gross * 3.545%", () => {
      const result = calculateNetSalary(4000000);
      expect(result.deductions.건강보험).toBe(Math.round(4000000 * 0.03545));
    });

    it("장기요양 = 건강보험 * 12.81%", () => {
      const result = calculateNetSalary(4000000);
      expect(result.deductions.장기요양).toBe(
        Math.round(result.deductions.건강보험 * 0.1281)
      );
    });

    it("고용보험 = gross * 0.9%", () => {
      const result = calculateNetSalary(4000000);
      expect(result.deductions.고용보험).toBe(Math.round(4000000 * 0.009));
    });
  });

  describe("다양한 급여 구간 테스트", () => {
    it("월급 200만원", () => {
      const result = calculateNetSalary(2000000);
      expect(result.net).toBeGreaterThan(0);
      expect(result.net).toBeLessThan(2000000);
    });

    it("월급 300만원", () => {
      const result = calculateNetSalary(3000000);
      expect(result.net).toBeGreaterThan(0);
      expect(result.net).toBeLessThan(3000000);
    });

    it("월급 1000만원 (고소득)", () => {
      const result = calculateNetSalary(10000000);
      expect(result.net).toBeGreaterThan(0);
      expect(result.net).toBeLessThan(10000000);
      expect(result.deductions.소득세).toBeGreaterThan(0);
    });

    it("최소 급여 (1000원)", () => {
      const result = calculateNetSalary(1000);
      expect(result.net).toBeGreaterThanOrEqual(0);
    });
  });
});
