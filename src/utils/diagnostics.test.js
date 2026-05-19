// src/utils/diagnostics.test.js
import { describe, it, expect, vi } from "vitest";
import { checkDataStatus, getSystemInfo, recoverFromBackup, discardBackup } from "./diagnostics";

// listAllAppKeys를 모킹하여 localStorage 키 목록 제어
vi.mock("./storage", () => ({
  listAllAppKeys: () =>
    Object.keys(localStorage).filter(
      (k) =>
        k.startsWith("calendar_v1_") ||
        k === "custom_categories_v1" ||
        k === "meta_v1" ||
        k === "settings_v1" ||
        k.includes("_corrupted_")
    ),
}));

describe("diagnostics.js", () => {
  // ─── checkDataStatus ───

  describe("checkDataStatus", () => {
    it("정상 calendar 데이터 — valid: true + itemCount 계산", () => {
      const calData = {
        cells: {
          "2026-05-01": { extra_items: [{ id: 1 }, { id: 2 }] },
          "2026-05-02": { extra_items: [{ id: 3 }] },
        },
      };
      localStorage.setItem("calendar_v1_2026-05", JSON.stringify(calData));

      const results = checkDataStatus();
      const entry = results.find((r) => r.key === "calendar_v1_2026-05");

      expect(entry).toBeDefined();
      expect(entry.valid).toBe(true);
      expect(entry.itemCount).toBe(3);
      expect(entry.size).toBeGreaterThan(0);
    });

    it("정상 custom_categories 데이터 — itemCount = 카테고리 수", () => {
      const catData = { categories: [{ id: "a" }, { id: "b" }] };
      localStorage.setItem("custom_categories_v1", JSON.stringify(catData));

      const results = checkDataStatus();
      const entry = results.find((r) => r.key === "custom_categories_v1");

      expect(entry.valid).toBe(true);
      expect(entry.itemCount).toBe(2);
    });

    it("손상 데이터 (JSON 파싱 실패) — valid: false + error 포함", () => {
      localStorage.setItem("settings_v1", "NOT_JSON{{{");

      const results = checkDataStatus();
      const entry = results.find((r) => r.key === "settings_v1");

      expect(entry.valid).toBe(false);
      expect(entry.error).toBeDefined();
      expect(entry.size).toBeGreaterThan(0);
    });

    it("앱 키가 없으면 빈 배열 반환", () => {
      // localStorage는 afterEach에서 clear되므로 비어 있음
      const results = checkDataStatus();
      expect(results).toEqual([]);
    });

    it("calendar에 cells/extra_items 없으면 itemCount 0", () => {
      localStorage.setItem("calendar_v1_2026-01", JSON.stringify({}));

      const results = checkDataStatus();
      const entry = results.find((r) => r.key === "calendar_v1_2026-01");

      expect(entry.valid).toBe(true);
      expect(entry.itemCount).toBe(0);
    });
  });

  // ─── getSystemInfo ───

  describe("getSystemInfo", () => {
    it("meta 있을 때 — daysSinceFirstUse 계산", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const meta = {
        first_used_at: threeDaysAgo.toISOString(),
        last_used_at: new Date().toISOString(),
      };
      localStorage.setItem("meta_v1", JSON.stringify(meta));

      const info = getSystemInfo();

      expect(info.appVersion).toBeDefined();
      expect(info.schemaVersion).toBe(1);
      expect(info.daysSinceFirstUse).toBe(3);
      expect(info.firstUsedAt).toBe(meta.first_used_at);
      expect(info.lastUsedAt).toBe(meta.last_used_at);
      expect(info.userAgent).toBeDefined();
    });

    it("meta 없을 때 — daysSinceFirstUse 0, firstUsedAt undefined", () => {
      const info = getSystemInfo();

      expect(info.daysSinceFirstUse).toBe(0);
      expect(info.firstUsedAt).toBeUndefined();
      expect(info.lastUsedAt).toBeUndefined();
      expect(info.appVersion).toBeDefined();
    });

    it("meta 손상 (JSON 파싱 실패) — daysSinceFirstUse 0", () => {
      localStorage.setItem("meta_v1", "BROKEN");

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const info = getSystemInfo();

      expect(info.daysSinceFirstUse).toBe(0);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  // ─── recoverFromBackup ───

  describe("recoverFromBackup", () => {
    it("백업 있으면 가장 최근 백업으로 복구 + 사용된 백업 삭제", () => {
      const data = { cells: { "2026-01-01": {} } };
      localStorage.setItem(
        "calendar_v1_2026-01_corrupted_1000",
        JSON.stringify({ old: true })
      );
      localStorage.setItem(
        "calendar_v1_2026-01_corrupted_2000",
        JSON.stringify(data)
      );

      const result = recoverFromBackup("calendar_v1_2026-01");

      expect(result.success).toBe(true);
      expect(result.restoredFrom).toBe("calendar_v1_2026-01_corrupted_2000");
      // 복구된 데이터 확인
      expect(JSON.parse(localStorage.getItem("calendar_v1_2026-01"))).toEqual(data);
      // 사용된 백업은 삭제
      expect(localStorage.getItem("calendar_v1_2026-01_corrupted_2000")).toBeNull();
      // 이전 백업은 유지 (retention 정책 내)
      expect(localStorage.getItem("calendar_v1_2026-01_corrupted_1000")).not.toBeNull();
    });

    it("백업 없으면 NO_BACKUP 에러", () => {
      const result = recoverFromBackup("calendar_v1_2026-01");

      expect(result.success).toBe(false);
      expect(result.error).toBe("NO_BACKUP");
    });

    it("백업 값이 손상된 JSON이면 PARSE_FAILED 에러", () => {
      localStorage.setItem(
        "settings_v1_corrupted_9999",
        "NOT_VALID_JSON!!!"
      );

      const result = recoverFromBackup("settings_v1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("PARSE_FAILED");
    });

    it("보존 정책: 복구 후 최신 3개 초과 백업 삭제", () => {
      // 5개 백업 생성
      for (let i = 1; i <= 5; i++) {
        localStorage.setItem(
          `settings_v1_corrupted_${i * 1000}`,
          JSON.stringify({ v: i })
        );
      }

      const result = recoverFromBackup("settings_v1");
      expect(result.success).toBe(true);

      // 가장 최근(5000)은 복구에 사용되어 삭제됨
      // 남은 4개 중 최신 3개(4000, 3000, 2000)만 유지, 1000은 삭제
      expect(localStorage.getItem("settings_v1_corrupted_5000")).toBeNull();
      expect(localStorage.getItem("settings_v1_corrupted_4000")).not.toBeNull();
      expect(localStorage.getItem("settings_v1_corrupted_3000")).not.toBeNull();
      expect(localStorage.getItem("settings_v1_corrupted_2000")).not.toBeNull();
      expect(localStorage.getItem("settings_v1_corrupted_1000")).toBeNull();
    });
  });

  // ─── discardBackup ───

  describe("discardBackup", () => {
    it("corrupted 백업 키 삭제 성공", () => {
      const key = "calendar_v1_2026-01_corrupted_1234";
      localStorage.setItem(key, JSON.stringify({ old: true }));

      const result = discardBackup(key);

      expect(result.success).toBe(true);
      expect(localStorage.getItem(key)).toBeNull();
    });

    it("_corrupted_ 포함하지 않는 키는 거부", () => {
      const result = discardBackup("calendar_v1_2026-01");

      expect(result.success).toBe(false);
      expect(result.error).toBe("NOT_BACKUP_KEY");
    });
  });
});
