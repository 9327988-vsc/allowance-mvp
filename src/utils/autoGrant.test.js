// src/utils/autoGrant.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadSchedules,
  saveSchedules,
  addSchedule,
  removeSchedule,
  toggleSchedule,
  getDueSchedules,
  markScheduleRun,
  resetAutoGrantCache,
} from "./autoGrant";

import { loadFamilyContext } from "./familyContext";

vi.mock("./familyContext", () => ({
  loadFamilyContext: vi.fn(() => ({ family_id: "fam_test123" })),
}));

vi.mock("./idGenerator", () => ({
  nanoid: vi.fn(() => "abc1234567"),
}));

beforeEach(() => {
  localStorage.clear();
  resetAutoGrantCache();
});

describe("loadSchedules", () => {
  it("빈 상태에서 빈 배열 반환", () => {
    expect(loadSchedules()).toEqual([]);
  });

  it("저장된 스케줄 로드", () => {
    const data = [{ id: "sched_1", name: "주간 용돈" }];
    localStorage.setItem("auto_grant_schedules_v1_f_fam_test123", JSON.stringify(data));
    expect(loadSchedules()).toEqual(data);
  });

  it("잘못된 JSON일 때 빈 배열 반환", () => {
    localStorage.setItem("auto_grant_schedules_v1_f_fam_test123", "{{broken");
    expect(loadSchedules()).toEqual([]);
  });
});

describe("saveSchedules", () => {
  it("스케줄 저장 성공", () => {
    const data = [{ id: "sched_1" }];
    const result = saveSchedules(data);
    expect(result).toEqual({ success: true });
    expect(JSON.parse(localStorage.getItem("auto_grant_schedules_v1_f_fam_test123"))).toEqual(data);
  });
});

describe("addSchedule", () => {
  it("유효한 스케줄 추가", () => {
    const result = addSchedule({
      child_member_id: "child_1",
      name: "주간 용돈",
      amount: 5000,
      frequency: "weekly",
      day_of_week: 1,
    });
    expect(result).toEqual({ success: true });
    const saved = loadSchedules();
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe("sched_abc1234567");
    expect(saved[0].enabled).toBe(true);
    expect(saved[0].created_at).toBeTruthy();
  });

  it("필수 필드 누락 시 실패", () => {
    expect(addSchedule(null)).toEqual({ success: false, error: "필수 필드 누락" });
    expect(addSchedule({})).toEqual({ success: false, error: "필수 필드 누락" });
    expect(addSchedule({ child_member_id: "c1" })).toEqual({ success: false, error: "필수 필드 누락" });
  });

  it("금액이 100 미만이면 실패", () => {
    expect(addSchedule({
      child_member_id: "c1", name: "용돈", amount: 50, frequency: "weekly",
    })).toEqual({ success: false, error: "금액이 유효하지 않음" });
  });

  it("금액이 문자열이면 실패", () => {
    expect(addSchedule({
      child_member_id: "c1", name: "용돈", amount: "5000", frequency: "weekly",
    })).toEqual({ success: false, error: "금액이 유효하지 않음" });
  });

  it("잘못된 주기이면 실패", () => {
    expect(addSchedule({
      child_member_id: "c1", name: "용돈", amount: 1000, frequency: "daily",
    })).toEqual({ success: false, error: "주기가 유효하지 않음" });
  });
});

describe("removeSchedule", () => {
  it("스케줄 삭제", () => {
    addSchedule({ child_member_id: "c1", name: "용돈", amount: 1000, frequency: "weekly", day_of_week: 1 });
    expect(loadSchedules()).toHaveLength(1);
    removeSchedule("sched_abc1234567");
    expect(loadSchedules()).toHaveLength(0);
  });

  it("존재하지 않는 ID 삭제 시 에러 없음", () => {
    const result = removeSchedule("nonexistent");
    expect(result).toEqual({ success: true });
  });
});

describe("toggleSchedule", () => {
  it("활성/비활성 토글", () => {
    addSchedule({ child_member_id: "c1", name: "용돈", amount: 1000, frequency: "weekly", day_of_week: 1 });
    expect(loadSchedules()[0].enabled).toBe(true);
    toggleSchedule("sched_abc1234567");
    expect(loadSchedules()[0].enabled).toBe(false);
    toggleSchedule("sched_abc1234567");
    expect(loadSchedules()[0].enabled).toBe(true);
  });
});

describe("getDueSchedules", () => {
  it("오늘 요일에 해당하는 주간 스케줄 반환", () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const schedules = [{
      id: "sched_1", child_member_id: "c1", name: "용돈",
      amount: 1000, frequency: "weekly", day_of_week: dayOfWeek, enabled: true,
    }];
    localStorage.setItem("auto_grant_schedules_v1_f_fam_test123", JSON.stringify(schedules));
    expect(getDueSchedules()).toHaveLength(1);
  });

  it("오늘 날짜에 해당하는 월간 스케줄 반환", () => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const schedules = [{
      id: "sched_2", child_member_id: "c1", name: "월용돈",
      amount: 50000, frequency: "monthly", day_of_month: dayOfMonth, enabled: true,
    }];
    localStorage.setItem("auto_grant_schedules_v1_f_fam_test123", JSON.stringify(schedules));
    expect(getDueSchedules()).toHaveLength(1);
  });

  it("비활성 스케줄 제외", () => {
    const today = new Date();
    const schedules = [{
      id: "sched_1", child_member_id: "c1", name: "용돈",
      amount: 1000, frequency: "weekly", day_of_week: today.getDay(), enabled: false,
    }];
    localStorage.setItem("auto_grant_schedules_v1_f_fam_test123", JSON.stringify(schedules));
    expect(getDueSchedules()).toHaveLength(0);
  });

  it("이미 실행된 스케줄 제외", () => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const schedules = [{
      id: "sched_1", child_member_id: "c1", name: "용돈",
      amount: 1000, frequency: "weekly", day_of_week: today.getDay(), enabled: true,
    }];
    localStorage.setItem("auto_grant_schedules_v1_f_fam_test123", JSON.stringify(schedules));
    localStorage.setItem("auto_grant_last_run_v1_f_fam_test123", JSON.stringify({ sched_1: todayKey }));
    expect(getDueSchedules()).toHaveLength(0);
  });

  it("다른 요일의 스케줄 제외", () => {
    const today = new Date();
    const otherDay = (today.getDay() + 3) % 7;
    const schedules = [{
      id: "sched_1", child_member_id: "c1", name: "용돈",
      amount: 1000, frequency: "weekly", day_of_week: otherDay, enabled: true,
    }];
    localStorage.setItem("auto_grant_schedules_v1_f_fam_test123", JSON.stringify(schedules));
    expect(getDueSchedules()).toHaveLength(0);
  });
});

describe("markScheduleRun", () => {
  it("실행 기록 저장", () => {
    const result = markScheduleRun("sched_1");
    expect(result).toEqual({ success: true });
    const lastRun = JSON.parse(localStorage.getItem("auto_grant_last_run_v1_f_fam_test123"));
    expect(lastRun.sched_1).toBeTruthy();
  });
});

describe("familyContext 없을 때", () => {
  beforeEach(() => {
    loadFamilyContext.mockReturnValue(null);
    resetAutoGrantCache();
  });

  it("loadSchedules는 빈 배열 반환", () => {
    expect(loadSchedules()).toEqual([]);
  });

  it("saveSchedules는 실패 반환", () => {
    expect(saveSchedules([])).toEqual({ success: false, error: "no family context" });
  });

  it("getDueSchedules는 빈 배열 반환", () => {
    expect(getDueSchedules()).toEqual([]);
  });

  it("markScheduleRun은 실패 반환", () => {
    expect(markScheduleRun("sched_1")).toEqual({ success: false });
  });
});
