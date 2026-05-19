// src/utils/validators.test.js
import { describe, it, expect } from "vitest";
import { validateSettings, validateExtraItem, validateMemo, validateCustomCategory } from "./validators";

const validForm = {
  child_name: "홍길동",
  base_allowance: 80000,
  school: { days: ["mon", "tue", "wed", "thu", "fri"], fare: 1160, round_trip: true },
  academy: { days: ["wed", "fri"], fare: 1160, round_trip: true },
};

describe("validateSettings", () => {
  it("유효한 폼 → valid", () => {
    expect(validateSettings(validForm).valid).toBe(true);
  });

  it("null 폼 → 에러", () => {
    const r = validateSettings(null);
    expect(r.valid).toBe(false);
    expect(r.errors.form).toBeTruthy();
  });

  // child_name
  it("이름 빈값 → 에러", () => {
    expect(validateSettings({ ...validForm, child_name: "" }).errors.child_name).toBeTruthy();
  });

  it("이름 공백만 → 에러", () => {
    expect(validateSettings({ ...validForm, child_name: "   " }).errors.child_name).toBeTruthy();
  });

  it("이름 21자 → 에러", () => {
    expect(validateSettings({ ...validForm, child_name: "가".repeat(21) }).errors.child_name).toContain("20자");
  });

  it("이름 20자 → 통과", () => {
    expect(validateSettings({ ...validForm, child_name: "가".repeat(20) }).valid).toBe(true);
  });

  // base_allowance
  it("기본용돈 소수 → 에러", () => {
    expect(validateSettings({ ...validForm, base_allowance: 1000.5 }).errors.base_allowance).toBeTruthy();
  });

  it("기본용돈 음수 → 에러", () => {
    expect(validateSettings({ ...validForm, base_allowance: -1 }).errors.base_allowance).toContain("0원");
  });

  it("기본용돈 0 → 통과", () => {
    expect(validateSettings({ ...validForm, base_allowance: 0 }).valid).toBe(true);
  });

  it("기본용돈 1,000,001 → 에러", () => {
    expect(validateSettings({ ...validForm, base_allowance: 1000001 }).errors.base_allowance).toContain("1,000,000");
  });

  // school.fare
  it("학교 교통비 음수 → 에러", () => {
    const form = { ...validForm, school: { ...validForm.school, fare: -100 } };
    expect(validateSettings(form).errors["school.fare"]).toContain("0원 이상");
  });

  it("등교일 있는데 교통비 0 → 에러", () => {
    const form = { ...validForm, school: { ...validForm.school, fare: 0 } };
    expect(validateSettings(form).errors["school.fare"]).toContain("1원 이상");
  });

  it("등교일 없으면 교통비 0 허용", () => {
    const form = { ...validForm, school: { days: [], fare: 0 } };
    expect(validateSettings(form).valid).toBe(true);
  });

  it("등교일 없는데 교통비 >0 → 에러", () => {
    const form = { ...validForm, school: { days: [], fare: 1000 } };
    expect(validateSettings(form).errors["school.fare"]).toContain("0이어야");
  });

  it("학교 교통비 100,001 → 에러", () => {
    const form = { ...validForm, school: { ...validForm.school, fare: 100001 } };
    expect(validateSettings(form).errors["school.fare"]).toContain("100,000");
  });

  // academy.fare (동일 패턴)
  it("학원 교통비 음수 → 에러", () => {
    const form = { ...validForm, academy: { ...validForm.academy, fare: -1 } };
    expect(validateSettings(form).errors["academy.fare"]).toContain("0원 이상");
  });

  it("학원일 없으면 교통비 0 허용", () => {
    const form = { ...validForm, academy: { days: [], fare: 0 } };
    expect(validateSettings(form).valid).toBe(true);
  });

  // school/academy 없는 경우 안전 처리
  it("school 필드 없어도 에러 안 남", () => {
    const form = { child_name: "테스트", base_allowance: 0, academy: { days: [], fare: 0 } };
    const r = validateSettings(form);
    expect(r.errors["school.fare"]).toBeUndefined();
  });
});

describe("validateExtraItem", () => {
  it("유효한 항목 → valid", () => {
    expect(validateExtraItem({ category: "간식", name: "과자", amount: 3000 }).valid).toBe(true);
  });

  it("카테고리 빈값 → 에러", () => {
    expect(validateExtraItem({ category: "", name: "과자", amount: 3000 }).errors.category).toBeTruthy();
  });

  it("이름 빈값 → 에러", () => {
    expect(validateExtraItem({ category: "간식", name: "", amount: 3000 }).errors.name).toBeTruthy();
  });

  it("이름 51자 → 에러", () => {
    expect(validateExtraItem({ category: "간식", name: "가".repeat(51), amount: 3000 }).errors.name).toContain("50자");
  });

  it("금액 0 → 에러", () => {
    expect(validateExtraItem({ category: "간식", name: "과자", amount: 0 }).errors.amount).toContain("1원");
  });

  it("금액 소수 → 에러", () => {
    expect(validateExtraItem({ category: "간식", name: "과자", amount: 1.5 }).errors.amount).toBeTruthy();
  });

  it("금액 10,000,001 → 에러", () => {
    expect(validateExtraItem({ category: "간식", name: "과자", amount: 10000001 }).errors.amount).toContain("10,000,000");
  });
});

describe("validateMemo", () => {
  it("null/빈값 → valid", () => {
    expect(validateMemo(null).valid).toBe(true);
    expect(validateMemo("").valid).toBe(true);
  });

  it("200자 이내 → valid", () => {
    expect(validateMemo("가".repeat(200)).valid).toBe(true);
  });

  it("201자 → 에러", () => {
    expect(validateMemo("가".repeat(201)).errors.memo).toContain("200자");
  });
});

describe("validateCustomCategory", () => {
  it("유효한 카테고리 → valid", () => {
    expect(validateCustomCategory({ name: "여행", icon: "✈️" }).valid).toBe(true);
  });

  it("이름 빈값 → 에러", () => {
    expect(validateCustomCategory({ name: "", icon: "✈️" }).errors.name).toBeTruthy();
  });

  it("이름 21자 → 에러", () => {
    expect(validateCustomCategory({ name: "가".repeat(21), icon: "✈️" }).errors.name).toContain("20자");
  });

  it("아이콘 빈값 → 에러", () => {
    expect(validateCustomCategory({ name: "여행", icon: "" }).errors.icon).toBeTruthy();
  });

  it("기본 카테고리 이름 중복 → 에러", () => {
    // DEFAULT_CATEGORIES에 "식비"가 포함됨
    const r = validateCustomCategory({ name: "식비", icon: "🍱" });
    expect(r.valid).toBe(false);
    expect(r.errors.name).toBeTruthy();
  });

  it("기존 카테고리 이름 중복 → 에러", () => {
    const existing = [{ name: "여행" }];
    const r = validateCustomCategory({ name: "여행", icon: "✈️" }, existing);
    expect(r.valid).toBe(false);
    expect(r.errors.name).toBeTruthy();
  });

  it("기존과 다른 이름 → 통과", () => {
    const existing = [{ name: "여행" }];
    expect(validateCustomCategory({ name: "축구", icon: "⚽" }, existing).valid).toBe(true);
  });
});
