// src/utils/chores.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadChores,
  saveChores,
  addChore,
  updateChore,
  removeChore,
  toggleChore,
  loadChoreLog,
  submitChoreCompletion,
  approveChoreCompletion,
  getMonthlyChoreReward,
  getPendingChoreApprovals,
  getRecentChoreLog,
} from "./chores";

import { loadFamilyContext } from "./familyContext";

vi.mock("./familyContext", () => ({
  loadFamilyContext: vi.fn(() => ({ family_id: "fam_chore_test" })),
}));

vi.mock("./idGenerator", () => ({
  nanoid: vi.fn(() => "testid1234"),
}));

const CHORES_KEY = "chores_v1_f_fam_chore_test";
const LOG_KEY = "chore_log_v1_f_fam_chore_test";

beforeEach(() => {
  localStorage.clear();
});

describe("loadChores", () => {
  it("빈 상태에서 빈 배열 반환", () => {
    expect(loadChores()).toEqual([]);
  });

  it("저장된 미션 로드", () => {
    const data = [{ id: "chore_1", name: "설거지" }];
    localStorage.setItem(CHORES_KEY, JSON.stringify(data));
    expect(loadChores()).toEqual(data);
  });

  it("잘못된 JSON일 때 빈 배열 반환", () => {
    localStorage.setItem(CHORES_KEY, "broken{");
    expect(loadChores()).toEqual([]);
  });
});

describe("saveChores", () => {
  it("미션 저장 성공", () => {
    const result = saveChores([{ id: "chore_1" }]);
    expect(result).toEqual({ success: true });
  });
});

describe("addChore", () => {
  it("미션 추가 성공", () => {
    const result = addChore({ name: "설거지", reward: 500, icon: "🍽️", frequency: "daily" });
    expect(result).toEqual({ success: true });
    const chores = loadChores();
    expect(chores).toHaveLength(1);
    expect(chores[0].id).toBe("chore_testid1234");
    expect(chores[0].enabled).toBe(true);
    expect(chores[0].max_per_day).toBe(1);
    expect(chores[0].created_at).toBeTruthy();
  });

  it("max_per_day 지정 시 반영", () => {
    addChore({ name: "청소", reward: 1000, max_per_day: 3 });
    expect(loadChores()[0].max_per_day).toBe(3);
  });
});

describe("updateChore", () => {
  it("미션 업데이트 성공", () => {
    addChore({ name: "설거지", reward: 500 });
    const result = updateChore("chore_testid1234", { reward: 1000 });
    expect(result).toEqual({ success: true });
    expect(loadChores()[0].reward).toBe(1000);
  });

  it("존재하지 않는 미션 업데이트 실패", () => {
    const result = updateChore("nonexistent", { reward: 1000 });
    expect(result).toEqual({ success: false, error: "not found" });
  });
});

describe("removeChore", () => {
  it("미션 삭제 성공", () => {
    addChore({ name: "설거지", reward: 500 });
    removeChore("chore_testid1234");
    expect(loadChores()).toHaveLength(0);
  });
});

describe("toggleChore", () => {
  it("활성/비활성 토글", () => {
    addChore({ name: "설거지", reward: 500 });
    expect(loadChores()[0].enabled).toBe(true);
    toggleChore("chore_testid1234");
    expect(loadChores()[0].enabled).toBe(false);
  });
});

describe("submitChoreCompletion", () => {
  beforeEach(() => {
    localStorage.setItem(CHORES_KEY, JSON.stringify([
      { id: "chore_1", name: "설거지", reward: 500, enabled: true, frequency: "daily", max_per_day: 1, child_member_id: null },
      { id: "chore_2", name: "빨래", reward: 1000, enabled: false, frequency: "daily", max_per_day: 1, child_member_id: null },
      { id: "chore_3", name: "청소", reward: 800, enabled: true, frequency: "once", max_per_day: 1, child_member_id: "child_A" },
    ]));
  });

  it("미션 완료 신청 성공", () => {
    const result = submitChoreCompletion("chore_1", "child_A", "꼬마");
    expect(result.success).toBe(true);
    expect(result.entry).toBeTruthy();
    expect(result.entry.status).toBe("pending");
    expect(result.entry.reward).toBe(500);
  });

  it("존재하지 않는 미션 실패", () => {
    const result = submitChoreCompletion("nonexistent", "child_A", "꼬마");
    expect(result.success).toBe(false);
  });

  it("비활성 미션 실패", () => {
    const result = submitChoreCompletion("chore_2", "child_A", "꼬마");
    expect(result.success).toBe(false);
  });

  it("다른 자녀에게 할당된 미션 실패", () => {
    const result = submitChoreCompletion("chore_3", "child_B", "다른아이");
    expect(result.success).toBe(false);
    expect(result.error).toContain("다른 자녀");
  });

  it("할당된 자녀 본인은 성공", () => {
    const result = submitChoreCompletion("chore_3", "child_A", "꼬마");
    expect(result.success).toBe(true);
  });

  it("1회성 미션 중복 완료 실패", () => {
    submitChoreCompletion("chore_3", "child_A", "꼬마");
    const result = submitChoreCompletion("chore_3", "child_A", "꼬마");
    expect(result.success).toBe(false);
    expect(result.error).toContain("1회성");
  });

  it("하루 최대 횟수 초과 시 실패", () => {
    submitChoreCompletion("chore_1", "child_A", "꼬마");
    const result = submitChoreCompletion("chore_1", "child_A", "꼬마");
    expect(result.success).toBe(false);
    expect(result.error).toContain("최대 횟수");
  });
});

describe("approveChoreCompletion", () => {
  it("승인 성공", () => {
    localStorage.setItem(CHORES_KEY, JSON.stringify([
      { id: "chore_1", name: "설거지", reward: 500, enabled: true, frequency: "daily", max_per_day: 2, child_member_id: null },
    ]));
    submitChoreCompletion("chore_1", "child_A", "꼬마");
    const log = loadChoreLog();
    const entryId = log[0].id;
    const result = approveChoreCompletion(entryId, true);
    expect(result).toEqual({ success: true });
    expect(loadChoreLog()[0].status).toBe("approved");
    expect(loadChoreLog()[0].approved_at).toBeTruthy();
  });

  it("거절 성공", () => {
    localStorage.setItem(CHORES_KEY, JSON.stringify([
      { id: "chore_1", name: "설거지", reward: 500, enabled: true, frequency: "daily", max_per_day: 2, child_member_id: null },
    ]));
    submitChoreCompletion("chore_1", "child_A", "꼬마");
    const log = loadChoreLog();
    const result = approveChoreCompletion(log[0].id, false);
    expect(result).toEqual({ success: true });
    expect(loadChoreLog()[0].status).toBe("rejected");
    expect(loadChoreLog()[0].approved_at).toBe(null);
  });

  it("이미 처리된 항목 재처리 실패", () => {
    localStorage.setItem(CHORES_KEY, JSON.stringify([
      { id: "chore_1", name: "설거지", reward: 500, enabled: true, frequency: "daily", max_per_day: 2, child_member_id: null },
    ]));
    submitChoreCompletion("chore_1", "child_A", "꼬마");
    const log = loadChoreLog();
    approveChoreCompletion(log[0].id, true);
    const result = approveChoreCompletion(log[0].id, true);
    expect(result.success).toBe(false);
  });

  it("존재하지 않는 기록 실패", () => {
    const result = approveChoreCompletion("nonexistent", true);
    expect(result.success).toBe(false);
  });
});

describe("getMonthlyChoreReward", () => {
  it("승인된 보상 합계 계산", () => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    localStorage.setItem(LOG_KEY, JSON.stringify([
      { child_member_id: "c1", status: "approved", completed_at: `${prefix}-05T10:00:00Z`, reward: 500 },
      { child_member_id: "c1", status: "approved", completed_at: `${prefix}-10T10:00:00Z`, reward: 1000 },
      { child_member_id: "c1", status: "pending", completed_at: `${prefix}-15T10:00:00Z`, reward: 800 },
      { child_member_id: "c2", status: "approved", completed_at: `${prefix}-05T10:00:00Z`, reward: 300 },
    ]));
    const result = getMonthlyChoreReward("c1", now.getFullYear(), now.getMonth() + 1);
    expect(result).toBe(1500);
  });

  it("해당 월 기록이 없으면 0 반환", () => {
    expect(getMonthlyChoreReward("c1", 2026, 1)).toBe(0);
  });
});

describe("getPendingChoreApprovals", () => {
  it("대기 중인 항목만 반환", () => {
    localStorage.setItem(LOG_KEY, JSON.stringify([
      { id: "1", status: "pending" },
      { id: "2", status: "approved" },
      { id: "3", status: "pending" },
    ]));
    const result = getPendingChoreApprovals();
    expect(result).toHaveLength(2);
  });
});

describe("getRecentChoreLog", () => {
  it("최근 N일 기록 반환", () => {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(recent.getDate() - 3);
    const old = new Date(now);
    old.setDate(old.getDate() - 10);
    localStorage.setItem(LOG_KEY, JSON.stringify([
      { child_member_id: "c1", completed_at: recent.toISOString() },
      { child_member_id: "c1", completed_at: old.toISOString() },
    ]));
    const result = getRecentChoreLog("c1", 7);
    expect(result).toHaveLength(1);
  });

  it("다른 자녀 기록 제외", () => {
    const now = new Date();
    localStorage.setItem(LOG_KEY, JSON.stringify([
      { child_member_id: "c1", completed_at: now.toISOString() },
      { child_member_id: "c2", completed_at: now.toISOString() },
    ]));
    const result = getRecentChoreLog("c1", 7);
    expect(result).toHaveLength(1);
  });
});

describe("familyContext 없을 때", () => {
  beforeEach(() => {
    loadFamilyContext.mockReturnValue(null);
  });

  it("loadChores는 빈 배열 반환", () => {
    expect(loadChores()).toEqual([]);
  });

  it("saveChores는 실패 반환", () => {
    expect(saveChores([])).toEqual({ success: false, error: "no family context" });
  });

  it("loadChoreLog는 빈 배열 반환", () => {
    expect(loadChoreLog()).toEqual([]);
  });
});
