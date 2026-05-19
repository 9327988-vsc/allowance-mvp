// src/utils/idGenerator.test.js
import { describe, it, expect } from "vitest";
import {
  nanoid,
  newExtraItemId,
  newCategoryId,
  generateClaimId,
  generateCommentId,
  generateGrantId,
  generateMemberId,
  generateFamilyId,
} from "./idGenerator";

describe("nanoid", () => {
  it("기본 길이 6", () => {
    const id = nanoid();
    expect(id).toHaveLength(6);
  });

  it("지정 길이 생성", () => {
    expect(nanoid(10)).toHaveLength(10);
    expect(nanoid(1)).toHaveLength(1);
    expect(nanoid(20)).toHaveLength(20);
  });

  it("허용된 문자만 포함 (0-9, a-z)", () => {
    const id = nanoid(100);
    expect(id).toMatch(/^[0-9a-z]+$/);
  });

  it("매번 다른 ID 생성 (충돌 없음)", () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(nanoid(8));
    }
    expect(ids.size).toBe(100);
  });
});

describe("newExtraItemId", () => {
  it("ex_ 접두사", () => {
    const id = newExtraItemId();
    expect(id).toMatch(/^ex_[0-9a-z]{6}$/);
  });
});

describe("newCategoryId", () => {
  it("cat_ 접두사", () => {
    const id = newCategoryId();
    expect(id).toMatch(/^cat_[0-9a-z]{6}$/);
  });
});

describe("generateClaimId", () => {
  it("cl_ 접두사 + 8자", () => {
    const id = generateClaimId();
    expect(id).toMatch(/^cl_[0-9a-z]{8}$/);
  });
});

describe("generateCommentId", () => {
  it("cm_ 접두사 + 6자", () => {
    const id = generateCommentId();
    expect(id).toMatch(/^cm_[0-9a-z]{6}$/);
  });
});

describe("generateGrantId", () => {
  it("gr_ 접두사 + 8자", () => {
    const id = generateGrantId();
    expect(id).toMatch(/^gr_[0-9a-z]{8}$/);
  });
});

describe("generateMemberId", () => {
  it("mem_ 접두사", () => {
    const id = generateMemberId();
    expect(id.startsWith("mem_")).toBe(true);
    expect(id.length).toBeGreaterThan(4);
  });
});

describe("generateFamilyId", () => {
  it("fam_ 접두사", () => {
    const id = generateFamilyId();
    expect(id.startsWith("fam_")).toBe(true);
    expect(id.length).toBeGreaterThan(4);
  });
});
