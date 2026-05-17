// src/utils/familyContext.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { loadFamilyContext, saveFamilyContext, clearFamilyContext, isInFamily } from "./familyContext";

const SAMPLE_CTX = {
  family_id: "fam_test-123",
  family_code: "K3M9P2",
  member_id: "mem_test-456",
  member_role: "child",
  member_display_name: "자녀A",
  joined_at: "2026-05-03T10:00:00.000Z",
};

describe("familyContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("저장 후 로드하면 동일 데이터를 반환한다", () => {
    saveFamilyContext(SAMPLE_CTX);
    const loaded = loadFamilyContext();
    expect(loaded).toEqual(SAMPLE_CTX);
  });

  it("저장 전에는 null을 반환한다", () => {
    expect(loadFamilyContext()).toBeNull();
  });

  it("clear 후에는 null을 반환한다", () => {
    saveFamilyContext(SAMPLE_CTX);
    clearFamilyContext();
    expect(loadFamilyContext()).toBeNull();
  });

  it("isInFamily는 저장 여부에 따라 boolean을 반환한다", () => {
    expect(isInFamily()).toBe(false);
    saveFamilyContext(SAMPLE_CTX);
    expect(isInFamily()).toBe(true);
  });

  it("손상된 JSON은 null을 반환한다", () => {
    localStorage.setItem("family_context_v1", "{{invalid json");
    expect(loadFamilyContext()).toBeNull();
  });
});
