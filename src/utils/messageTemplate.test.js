// src/utils/messageTemplate.test.js
import { describe, it, expect } from "vitest";
import { generateMessage } from "./messageTemplate";
import { calculateMonthlyAllowance } from "./calculator";

const TEST_SETTINGS = {
  child_name: "자녀A",
  school: { days: ["mon","tue","wed","thu","fri"], fare: 1160, round_trip: true, holiday_attend: false },
  academy: { days: ["wed","fri"], fare: 1160, round_trip: true, holiday_attend: true },
  base_allowance: 80000,
  created_at: "2026-04-01T00:00:00.000Z",
  updated_at: "2026-04-01T00:00:00.000Z",
  version: 1
};

const TEST_HOLIDAYS_2026_05 = {
  "2026-05-01": { name: "노동절", type: "legal" },
  "2026-05-05": { name: "어린이날", type: "legal" },
  "2026-05-24": { name: "부처님오신날", type: "legal" },
  "2026-05-25": { name: "부처님오신날 대체공휴일", type: "alternative" }
};

describe("generateMessage", () => {
  it("기본 케이스: 모든 항목 포함", () => {
    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, { cells: {} }, TEST_HOLIDAYS_2026_05);
    const msg = generateMessage(2026, 5, calc, TEST_SETTINGS, TEST_HOLIDAYS_2026_05);

    expect(msg).toContain("📅 자녀A 2026년 5월 용돈 청구");
    expect(msg).toContain("💰 기본 용돈");
    expect(msg).toContain("80,000원");
    expect(msg).toContain("🏫 학교 버스비");
    expect(msg).toContain("📚 학원 버스비");
    expect(msg).toContain("합계                  142,640원");
    expect(msg).toContain("1일(노동절)");
    expect(msg).toContain("5일(어린이날)");
    expect(msg).toContain("24일(부처님오신날)");
    expect(msg).toContain("25일(부처님오신날 대체공휴일)");
  });

  it("자녀 이름 없으면 생략", () => {
    const settings = { ...TEST_SETTINGS, child_name: "" };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, TEST_HOLIDAYS_2026_05);
    const msg = generateMessage(2026, 5, calc, settings, TEST_HOLIDAYS_2026_05);
    expect(msg).toContain("📅 2026년 5월 용돈 청구");
    expect(msg).not.toContain("자녀A");
  });

  it("학원 없으면 학원 행 생략", () => {
    const settings = { ...TEST_SETTINGS, academy: { days: [], fare: 0, round_trip: true, holiday_attend: false } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, TEST_HOLIDAYS_2026_05);
    const msg = generateMessage(2026, 5, calc, settings, TEST_HOLIDAYS_2026_05);
    expect(msg).not.toContain("📚 학원 버스비");
  });

  it("공휴일 없는 달은 비고 생략", () => {
    const calc = calculateMonthlyAllowance(2026, 4, TEST_SETTINGS, { cells: {} }, {});
    const msg = generateMessage(2026, 4, calc, TEST_SETTINGS, {});
    expect(msg).not.toContain("※");
  });

  it("임시 항목 다수 + 날짜순 정렬", () => {
    const calendar = {
      year: 2026, month: 5,
      cells: {
        "2026-05-19": { extra_items: [{ id: "x", category: "수련회", name: "회비", amount: 50000, created_at: "" }], memo: "" },
        "2026-05-14": { extra_items: [{ id: "y", category: "체험학습", name: "박물관", amount: 8000, created_at: "" }], memo: "" }
      },
      created_at: "", updated_at: "", version: 1
    };
    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, calendar, TEST_HOLIDAYS_2026_05);
    const msg = generateMessage(2026, 5, calc, TEST_SETTINGS, TEST_HOLIDAYS_2026_05);

    const idx14 = msg.indexOf("5/14");
    const idx19 = msg.indexOf("5/19");
    expect(idx14).toBeLessThan(idx19);
  });
});
