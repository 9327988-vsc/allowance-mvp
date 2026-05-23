// src/utils/exportImport.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  exportData,
  importData,
  computeChecksum,
  defaultExportFilename,
  validateImportFile,
  recoverFromCrashedImport,
} from "./exportImport";

// authStore/familyContext mock — Phase-2 scoped data 테스트 지원
vi.mock("./authStore", () => ({
  getActiveUser: vi.fn(() => null),
}));
vi.mock("./familyContext", () => ({
  loadFamilyContext: vi.fn(() => null),
}));

import { getActiveUser } from "./authStore";
import { loadFamilyContext } from "./familyContext";

/** File 객체 모방 헬퍼 */
function makeFile(data) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return { text: () => Promise.resolve(text) };
}

/** exportData로 생성한 유효 데이터를 File로 래핑 */
async function makeValidFile(opts = {}) {
  const data = await exportData(opts);
  return makeFile(data);
}

describe("exportData", () => {
  it("기본 export 구조", async () => {
    const data = await exportData();
    expect(data.export_version).toBe(1);
    expect(data.schema_version).toBe(1);
    expect(data.app_version).toBeTruthy();
    expect(data.exported_at).toBeTruthy();
    expect(data.calendars).toEqual({});
    expect(data.checksum).toBeTruthy();
  });

  it("settings 포함", async () => {
    localStorage.setItem("settings_v1", JSON.stringify({ base_allowance: 50000 }));
    const data = await exportData();
    expect(data.settings.base_allowance).toBe(50000);
  });

  it("settings 제외 옵션", async () => {
    localStorage.setItem("settings_v1", JSON.stringify({ base_allowance: 50000 }));
    const data = await exportData({ includeSettings: false });
    expect(data.settings).toBeUndefined();
  });

  it("캘린더 데이터 포함", async () => {
    localStorage.setItem("calendar_v1_2026_05", JSON.stringify({ year: 2026, month: 5, cells: {} }));
    const data = await exportData();
    expect(data.calendars["2026-05"]).toBeTruthy();
    expect(data.calendars["2026-05"].year).toBe(2026);
  });

  it("캘린더 제외 옵션", async () => {
    localStorage.setItem("calendar_v1_2026_05", JSON.stringify({ year: 2026, month: 5, cells: {} }));
    const data = await exportData({ includeCalendars: false });
    expect(Object.keys(data.calendars)).toHaveLength(0);
  });

  it("corrupted 캘린더 키는 제외", async () => {
    localStorage.setItem("calendar_v1_2026_05_corrupted_123", "broken");
    localStorage.setItem("calendar_v1_2026_05", JSON.stringify({ year: 2026, month: 5, cells: {} }));
    const data = await exportData();
    expect(Object.keys(data.calendars)).toHaveLength(1);
  });

  it("meta/custom_categories 포함", async () => {
    localStorage.setItem("meta_v1", JSON.stringify({ schema_version: 1 }));
    localStorage.setItem("custom_categories_v1", JSON.stringify({ categories: [{ name: "간식" }] }));
    const data = await exportData();
    expect(data.meta.schema_version).toBe(1);
    expect(data.custom_categories.categories).toHaveLength(1);
  });

  it("user_accounts에서 인증 필드 제거", async () => {
    localStorage.setItem("user_accounts_v1", JSON.stringify([
      { user_id: "u1", display_name: "홍길동", pin_hash: "secret", pin_salt: "salt123", password_hash: "phash", password_salt: "psalt", birth_date: "2015-01-01" },
    ]));
    const data = await exportData();
    expect(data.user_accounts[0].display_name).toBe("홍길동");
    expect(data.user_accounts[0].pin_hash).toBeUndefined();
    expect(data.user_accounts[0].pin_salt).toBeUndefined();
    expect(data.user_accounts[0].password_hash).toBeUndefined();
    expect(data.user_accounts[0].password_salt).toBeUndefined();
    expect(data.user_accounts[0].birth_date).toBeUndefined();
  });

  it("2단계 데이터 포함 (family_context, submitted_claims)", async () => {
    localStorage.setItem("family_context_v1", JSON.stringify({ family_id: "f1" }));
    localStorage.setItem("submitted_claims_v1", JSON.stringify([{ id: "c1" }]));
    const data = await exportData();
    expect(data.family_context.family_id).toBe("f1");
    expect(data.submitted_claims).toHaveLength(1);
  });

  it("checksum 일관성", async () => {
    localStorage.setItem("settings_v1", JSON.stringify({ base_allowance: 10000 }));
    const data = await exportData();
    const recomputed = await computeChecksum(data);
    expect(data.checksum).toBe(recomputed);
  });
});

describe("computeChecksum", () => {
  it("동일 데이터 → 동일 해시", async () => {
    const data = { a: 1, b: "hello", checksum: "" };
    const h1 = await computeChecksum(data);
    const h2 = await computeChecksum(data);
    expect(h1).toBe(h2);
  });

  it("다른 데이터 → 다른 해시", async () => {
    const h1 = await computeChecksum({ a: 1, checksum: "" });
    const h2 = await computeChecksum({ a: 2, checksum: "" });
    expect(h1).not.toBe(h2);
  });

  it("키 순서 무관", async () => {
    const h1 = await computeChecksum({ a: 1, b: 2, checksum: "" });
    const h2 = await computeChecksum({ b: 2, a: 1, checksum: "" });
    expect(h1).toBe(h2);
  });
});

describe("importData", () => {
  it("유효한 파일 overwrite 성공", async () => {
    localStorage.setItem("settings_v1", JSON.stringify({ base_allowance: 10000 }));
    localStorage.setItem("calendar_v1_2026_05", JSON.stringify({ year: 2026, month: 5, cells: { "2026-05-01": { memo: "old" } } }));
    const file = await makeValidFile();

    localStorage.clear();
    const result = await importData(file, "overwrite");
    expect(result.success).toBe(true);
    expect(result.applied.settings).toBe(1);
    expect(result.applied.calendars).toBe(1);
    expect(JSON.parse(localStorage.getItem("settings_v1")).base_allowance).toBe(10000);
  });

  it("merge 모드 — 기존 데이터 유지", async () => {
    localStorage.setItem("settings_v1", JSON.stringify({ base_allowance: 50000 }));
    localStorage.setItem("calendar_v1_2026_01", JSON.stringify({ year: 2026, month: 1, cells: {} }));
    const file = await makeValidFile();
    localStorage.clear();

    // 새 데이터로 settings/calendar 세팅
    localStorage.setItem("settings_v1", JSON.stringify({ base_allowance: 99999 }));
    const result = await importData(file, "merge");
    expect(result.success).toBe(true);
    // merge 모드에서는 기존 settings 유지
    expect(JSON.parse(localStorage.getItem("settings_v1")).base_allowance).toBe(99999);
  });

  it("잘못된 JSON → INVALID_JSON", async () => {
    const file = makeFile("not json {{{");
    const result = await importData(file);
    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_JSON");
  });

  it("버전 불일치 → VERSION_MISMATCH", async () => {
    const file = makeFile({ export_version: 999, calendars: {} });
    const result = await importData(file);
    expect(result.success).toBe(false);
    expect(result.error).toBe("VERSION_MISMATCH");
  });

  it("calendars 없음 → INVALID_SCHEMA", async () => {
    const file = makeFile({ export_version: 1 });
    const result = await importData(file);
    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_SCHEMA");
  });

  it("체크섬 변조 → CHECKSUM_MISMATCH", async () => {
    localStorage.setItem("settings_v1", JSON.stringify({ base_allowance: 10000 }));
    const data = await exportData();
    data.checksum = "tampered_checksum_value";
    const file = makeFile(data);
    localStorage.clear();
    const result = await importData(file);
    expect(result.success).toBe(false);
    expect(result.error).toBe("CHECKSUM_MISMATCH");
  });

  it("custom_categories merge — 중복 제거", async () => {
    localStorage.setItem("custom_categories_v1", JSON.stringify({ categories: [{ name: "간식", icon: "🍪" }], version: 1 }));
    const file = await makeValidFile();
    localStorage.clear();

    // 기존에 같은 카테고리 + 새 카테고리
    localStorage.setItem("custom_categories_v1", JSON.stringify({ categories: [{ name: "간식", icon: "🍪" }, { name: "교통", icon: "🚌" }], version: 1 }));
    const result = await importData(file, "merge");
    expect(result.success).toBe(true);
    const cats = JSON.parse(localStorage.getItem("custom_categories_v1"));
    // "간식"은 중복이므로 추가 안 됨, "교통"은 유지
    expect(cats.categories).toHaveLength(2);
    expect(cats.categories.map(c => c.name)).toContain("교통");
  });
});

describe("validateImportFile", () => {
  it("유효 파일 통과", async () => {
    localStorage.setItem("settings_v1", JSON.stringify({ base_allowance: 30000 }));
    localStorage.setItem("calendar_v1_2026_03", JSON.stringify({ year: 2026, month: 3, cells: {} }));
    const file = await makeValidFile();
    localStorage.clear();

    const result = await validateImportFile(file);
    expect(result.valid).toBe(true);
    expect(result.summary.settings).toBe(1);
    expect(result.summary.calendars).toBe(1);
  });

  it("잘못된 JSON", async () => {
    const result = await validateImportFile(makeFile("broken"));
    expect(result.valid).toBe(false);
    expect(result.error).toBe("INVALID_JSON");
  });

  it("버전 불일치", async () => {
    const result = await validateImportFile(makeFile({ export_version: 2, calendars: {} }));
    expect(result.valid).toBe(false);
    expect(result.error).toBe("VERSION_MISMATCH");
  });
});

describe("recoverFromCrashedImport", () => {
  it("백업 없으면 false", () => {
    expect(recoverFromCrashedImport()).toBe(false);
  });

  it("백업 있으면 복원 후 true", () => {
    const backup = { settings_v1: JSON.stringify({ restored: true }), meta_v1: null };
    localStorage.setItem("_import_backup_v1", JSON.stringify(backup));
    localStorage.setItem("meta_v1", JSON.stringify({ old: true }));

    expect(recoverFromCrashedImport()).toBe(true);
    expect(JSON.parse(localStorage.getItem("settings_v1")).restored).toBe(true);
    expect(localStorage.getItem("meta_v1")).toBeNull(); // null → 삭제
    expect(localStorage.getItem("_import_backup_v1")).toBeNull(); // 백업 키 정리
  });

  it("깨진 백업 → false + 백업 키 정리", () => {
    localStorage.setItem("_import_backup_v1", "not-json{{{");
    expect(recoverFromCrashedImport()).toBe(false);
    expect(localStorage.getItem("_import_backup_v1")).toBeNull();
  });
});

describe("defaultExportFilename", () => {
  it("날짜 포함 파일명", () => {
    const name = defaultExportFilename();
    expect(name).toMatch(/^allowance-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
