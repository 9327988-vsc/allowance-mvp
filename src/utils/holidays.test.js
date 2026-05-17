// src/utils/holidays.test.js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadHolidays, getHolidays, _resetHolidaysCache } from "./holidays";

describe("holidays.js", () => {
  beforeEach(() => {
    _resetHolidaysCache();
    global.fetch = vi.fn();
  });

  it("loadHolidays: 정상 로드 + 캐시", async () => {
    const sample = { "2026-05-05": { name: "어린이날", type: "legal" } };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sample
    });

    const r1 = await loadHolidays();
    expect(r1).toEqual(sample);

    // 두 번째 호출은 캐시 사용 (fetch 추가 호출 X)
    const r2 = await loadHolidays();
    expect(r2).toBe(r1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("loadHolidays: 404 → throw", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(loadHolidays()).rejects.toThrow(/404/);
  });

  it("getHolidays: loadHolidays 호출 전 → 빈 객체 반환", () => {
    expect(getHolidays()).toEqual({});
  });
});
