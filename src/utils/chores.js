// src/utils/chores.js — 집안일/미션 보상 관리

const CHORES_KEY = "chores_v1";
const CHORE_LOG_KEY = "chore_log_v1";

/**
 * 미션(집안일) 데이터 구조:
 * {
 *   id: string,
 *   name: string,           // "설거지", "빨래 개기" 등
 *   reward: number,         // 보상 금액
 *   icon: string,           // 이모지
 *   child_member_id: string | null, // null이면 모든 자녀 가능
 *   frequency: "daily" | "weekly" | "once", // 반복 빈도
 *   max_per_day: number,    // 하루 최대 완료 횟수 (기본 1)
 *   enabled: boolean,
 *   created_at: string,
 * }
 *
 * 완료 기록 구조:
 * {
 *   id: string,
 *   chore_id: string,
 *   child_member_id: string,
 *   child_name: string,
 *   completed_at: string,   // ISO8601
 *   reward: number,
 *   status: "pending" | "approved" | "rejected",
 *   approved_at: string | null,
 * }
 */

export function loadChores() {
  try {
    const raw = localStorage.getItem(CHORES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChores(chores) {
  try {
    localStorage.setItem(CHORES_KEY, JSON.stringify(chores));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function addChore(chore) {
  const chores = loadChores();
  chores.push({
    ...chore,
    id: `chore_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    enabled: true,
    max_per_day: chore.max_per_day || 1,
    created_at: new Date().toISOString(),
  });
  return saveChores(chores);
}

export function updateChore(id, updates) {
  const chores = loadChores();
  const idx = chores.findIndex(c => c.id === id);
  if (idx === -1) return { success: false, error: "not found" };
  chores[idx] = { ...chores[idx], ...updates };
  return saveChores(chores);
}

export function removeChore(id) {
  const chores = loadChores().filter(c => c.id !== id);
  return saveChores(chores);
}

export function toggleChore(id) {
  const chores = loadChores();
  const target = chores.find(c => c.id === id);
  if (target) target.enabled = !target.enabled;
  return saveChores(chores);
}

// --- 완료 기록 관리 ---

export function loadChoreLog() {
  try {
    const raw = localStorage.getItem(CHORE_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChoreLog(log) {
  try {
    localStorage.setItem(CHORE_LOG_KEY, JSON.stringify(log));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * 자녀가 미션 완료 신청
 */
export function submitChoreCompletion(choreId, childMemberId, childName) {
  const chores = loadChores();
  const chore = chores.find(c => c.id === choreId);
  if (!chore) return { success: false, error: "미션을 찾을 수 없어요" };
  if (!chore.enabled) return { success: false, error: "비활성화된 미션이에요" };

  // 권한 검사: 특정 자녀에게 할당된 미션인지 확인
  if (chore.child_member_id && chore.child_member_id !== childMemberId) {
    return { success: false, error: "이 미션은 다른 자녀에게 할당되어 있어요" };
  }

  const log = loadChoreLog();

  // 1회성 미션 검증: 이미 완료(승인)된 기록이 있으면 거부
  if (chore.frequency === "once") {
    const alreadyDone = log.some(
      l => l.chore_id === choreId && l.child_member_id === childMemberId && l.status !== "rejected"
    );
    if (alreadyDone) return { success: false, error: "이미 완료한 1회성 미션이에요" };
  }

  // 하루 최대 횟수 검증 (로컬 날짜 사용)
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayCount = log.filter(
    l => l.chore_id === choreId && l.child_member_id === childMemberId && l.completed_at.slice(0, 10) === todayKey
  ).length;
  if (todayCount >= (chore.max_per_day || 1)) {
    return { success: false, error: "오늘 이미 최대 횟수를 달성했어요" };
  }

  const entry = {
    id: `cl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    chore_id: choreId,
    chore_name: chore.name,
    chore_icon: chore.icon,
    child_member_id: childMemberId,
    child_name: childName,
    completed_at: new Date().toISOString(),
    reward: chore.reward,
    status: "pending",
    approved_at: null,
  };
  log.push(entry);
  const result = saveChoreLog(log);
  if (!result.success) return result;
  return { success: true, entry };
}

/**
 * 부모가 미션 완료 승인/거절
 */
export function approveChoreCompletion(entryId, approved) {
  const log = loadChoreLog();
  const entry = log.find(l => l.id === entryId);
  if (!entry) return { success: false, error: "기록을 찾을 수 없어요" };
  if (entry.status !== "pending") return { success: false, error: "이미 처리된 항목이에요" };
  entry.status = approved ? "approved" : "rejected";
  entry.approved_at = approved ? new Date().toISOString() : null;
  return saveChoreLog(log);
}

/**
 * 특정 자녀의 이번 달 승인된 보상 합계
 */
export function getMonthlyChoreReward(childMemberId, year, month) {
  const log = loadChoreLog();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return log
    .filter(l => l.child_member_id === childMemberId && l.status === "approved" && l.completed_at.startsWith(prefix))
    .reduce((sum, l) => sum + l.reward, 0);
}

/**
 * 대기 중인 승인 요청 목록 (부모용)
 */
export function getPendingChoreApprovals() {
  return loadChoreLog().filter(l => l.status === "pending");
}

/**
 * 최근 N일간 완료 기록 (자녀용 대시보드)
 */
export function getRecentChoreLog(childMemberId, days = 7) {
  const log = loadChoreLog();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();
  return log
    .filter(l => l.child_member_id === childMemberId && l.completed_at >= cutoffStr)
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at));
}
