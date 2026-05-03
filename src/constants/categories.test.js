// src/constants/categories.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { addCustomCategory, deleteCustomCategory, getCategoryIcon } from "./categories";

describe("addCustomCategory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("정상 추가", () => {
    const r = addCustomCategory({ name: "동아리 회비", icon: "🎵" });

    expect(r.success).toBe(true);
    expect(r.category.id).toMatch(/^cat_[a-z0-9]{6}$/);
    expect(r.category.name).toBe("동아리 회비");
    expect(r.category.icon).toBe("🎵");
    expect(r.category.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // localStorage 저장 확인
    const stored = JSON.parse(localStorage.getItem("custom_categories_v1"));
    expect(stored.categories).toHaveLength(1);
    expect(stored.categories[0].name).toBe("동아리 회비");
  });

  it("빈 이름 → 검증 실패", () => {
    const r = addCustomCategory({ name: "", icon: "🎵" });
    expect(r.success).toBe(false);
    expect(r.errors.name).toBeTruthy();
  });

  it("21자 이름 → 검증 실패", () => {
    const r = addCustomCategory({ name: "a".repeat(21), icon: "🎵" });
    expect(r.success).toBe(false);
    expect(r.errors.name).toBeTruthy();
  });

  it("중복 이름 → 검증 실패", () => {
    addCustomCategory({ name: "동아리 회비", icon: "🎵" });
    const r2 = addCustomCategory({ name: "동아리 회비", icon: "🎨" });
    expect(r2.success).toBe(false);
    expect(r2.errors.name).toContain("이미 존재");
  });

  it("아이콘 빈 값 → 검증 실패", () => {
    const r = addCustomCategory({ name: "동아리", icon: "" });
    expect(r.success).toBe(false);
    expect(r.errors.icon).toBeTruthy();
  });

  it("이름 trim 처리", () => {
    const r = addCustomCategory({ name: "  동아리  ", icon: "🎵" });
    expect(r.success).toBe(true);
    expect(r.category.name).toBe("동아리"); // 공백 제거됨
  });
});

describe("deleteCustomCategory", () => {
  beforeEach(() => localStorage.clear());

  it("삭제 후 임시 항목 표시는 깨지지 않음 (이름 저장 정책)", () => {
    const { category } = addCustomCategory({ name: "동아리", icon: "🎵" });

    // 임시 항목이 "동아리" name으로 저장된 상태
    const itemCategoryName = "동아리";
    expect(getCategoryIcon(itemCategoryName, [category])).toBe("🎵");

    // 카테고리 삭제
    deleteCustomCategory(category.id);

    // 임시 항목의 category="동아리"는 그대로
    // getCategoryIcon은 ✨ fallback 반환 (3.5 정책)
    expect(getCategoryIcon(itemCategoryName, [])).toBe("✨");
  });
});
