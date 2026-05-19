// src/utils/categoryStats.test.js
import { describe, it, expect } from "vitest";
import { getCategoryUsage, cleanupUnusedCategories } from "./categoryStats";

// 헬퍼: 캘린더 데이터를 localStorage에 직접 세팅
function setCalendar(year, month, cells) {
  const key = `calendar_v1_${year}_${String(month).padStart(2, "0")}`;
  localStorage.setItem(key, JSON.stringify({
    year, month, cells,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    version: 1,
  }));
}

// 헬퍼: 커스텀 카테고리를 localStorage에 직접 세팅
function setCustomCategories(categories) {
  localStorage.setItem("custom_categories_v1", JSON.stringify({
    categories,
    version: 1,
  }));
}

describe("getCategoryUsage", () => {
  it("캘린더 데이터가 없으면 빈 Map을 반환한다", () => {
    const usage = getCategoryUsage();
    expect(usage).toBeInstanceOf(Map);
    expect(usage.size).toBe(0);
  });

  it("여러 캘린더에 걸친 카테고리 사용 횟수를 집계한다", () => {
    setCalendar(2026, 1, {
      "1": { extra_items: [{ category: "식비" }, { category: "교통" }] },
      "15": { extra_items: [{ category: "식비" }] },
    });
    setCalendar(2026, 2, {
      "5": { extra_items: [{ category: "교통" }, { category: "문구" }] },
    });

    const usage = getCategoryUsage();
    expect(usage.get("식비")).toBe(2);
    expect(usage.get("교통")).toBe(2);
    expect(usage.get("문구")).toBe(1);
    expect(usage.size).toBe(3);
  });

  it("category_id가 있으면 id를 기준으로 집계한다", () => {
    setCalendar(2026, 3, {
      "1": { extra_items: [
        { category_id: "cat_001", category: "간식" },
        { category_id: "cat_001", category: "간식" },
        { category: "교통" },
      ]},
    });

    const usage = getCategoryUsage();
    expect(usage.get("cat_001")).toBe(2);
    expect(usage.get("교통")).toBe(1);
    expect(usage.has("간식")).toBe(false);
  });

  it("extra_items가 없는 셀은 무시한다", () => {
    setCalendar(2026, 4, {
      "1": { amount: 1000 },
      "2": { extra_items: [{ category: "식비" }] },
    });

    const usage = getCategoryUsage();
    expect(usage.size).toBe(1);
    expect(usage.get("식비")).toBe(1);
  });
});

describe("cleanupUnusedCategories", () => {
  it("커스텀 카테고리가 없으면 빈 deleted 배열을 반환한다", () => {
    const result = cleanupUnusedCategories();
    expect(result).toEqual({ deleted: [] });
  });

  it("미사용 커스텀 카테고리를 삭제한다", () => {
    setCustomCategories([
      { id: "cat_a", name: "학원비" },
      { id: "cat_b", name: "게임" },
    ]);
    // 캘린더에 아무 데이터 없음 → 둘 다 미사용

    const result = cleanupUnusedCategories();
    expect(result.deleted).toContain("학원비");
    expect(result.deleted).toContain("게임");
    expect(result.deleted).toHaveLength(2);

    // localStorage에 저장된 카테고리도 비어야 함
    const saved = JSON.parse(localStorage.getItem("custom_categories_v1"));
    expect(saved.categories).toEqual([]);
  });

  it("사용 중인 카테고리는 유지하고 미사용만 삭제한다", () => {
    setCustomCategories([
      { id: "cat_a", name: "학원비" },
      { id: "cat_b", name: "게임" },
      { id: "cat_c", name: "저축" },
    ]);
    setCalendar(2026, 5, {
      "10": { extra_items: [{ category_id: "cat_a", category: "학원비" }] },
      "20": { extra_items: [{ category: "저축" }] },
    });

    const result = cleanupUnusedCategories();
    // cat_a는 id로 매칭, 저축은 name으로 매칭 → 유지
    expect(result.deleted).toEqual(["게임"]);

    const saved = JSON.parse(localStorage.getItem("custom_categories_v1"));
    expect(saved.categories).toHaveLength(2);
    expect(saved.categories.map(c => c.name)).toContain("학원비");
    expect(saved.categories.map(c => c.name)).toContain("저축");
  });
});
