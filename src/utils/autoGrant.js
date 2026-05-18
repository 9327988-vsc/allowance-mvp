// src/utils/autoGrant.js — 자동 정기 용돈 스케줄 관리

import { loadFamilyContext } from "./familyContext";
import { nanoid } from "./idGenerator";

let _cachedFamilyId = null;

function getFamilyId() {
  if (!_cachedFamilyId) {
    _cachedFamilyId = loadFamilyContext()?.family_id || null;
  }
  return _cachedFamilyId;
}

export function resetAutoGrantCache() {
  _cachedFamilyId = null;
}

function getStorageKey() {
  const familyId = getFamilyId();
  if (!familyId) return null;
  return "auto_grant_schedules_v1_f_" + familyId;
}
function getLastRunKey() {
  const familyId = getFamilyId();
  if (!familyId) return null;
  return "auto_grant_last_run_v1_f_" + familyId;
}

/**
 * 스케줄 데이터 구조:
 * {
 *   id: string,
 *   child_member_id: string,
 *   child_name: string,
 *   name: string,             // 항목명 (예: "주간 용돈")
 *   amount: number,
 *   frequency: "weekly" | "monthly",
 *   day_of_week: 0-6,        // weekly일 때 (0=일)
 *   day_of_month: 1-28,      // monthly일 때
 *   enabled: boolean,
 *   created_at: ISO8601
 * }
 */

export function loadSchedules() {
  const key = getStorageKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSchedules(schedules) {
  const key = getStorageKey();
  if (!key) return { success: false, error: "no family context" };
  try {
    localStorage.setItem(key, JSON.stringify(schedules));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function addSchedule(schedule) {
  if (!schedule || !schedule.child_member_id || !schedule.name) {
    return { success: false, error: "필수 필드 누락" };
  }
  if (!schedule.amount || typeof schedule.amount !== "number" || schedule.amount < 100) {
    return { success: false, error: "금액이 유효하지 않음" };
  }
  if (!["weekly", "monthly"].includes(schedule.frequency)) {
    return { success: false, error: "주기가 유효하지 않음" };
  }
  const schedules = loadSchedules();
  schedules.push({
    ...schedule,
    id: `sched_${nanoid(10)}`,
    enabled: true,
    created_at: new Date().toISOString(),
  });
  return saveSchedules(schedules);
}

export function removeSchedule(id) {
  const schedules = loadSchedules().filter(s => s.id !== id);
  // Clean up lastRunMap entry for deleted schedule
  const lastRun = getLastRunMap();
  const lastRunKey = getLastRunKey();
  if (lastRun[id] && lastRunKey) {
    delete lastRun[id];
    try { localStorage.setItem(lastRunKey, JSON.stringify(lastRun)); } catch { /* ignored */ }
  }
  return saveSchedules(schedules);
}

export function toggleSchedule(id) {
  const schedules = loadSchedules();
  const target = schedules.find(s => s.id === id);
  if (target) target.enabled = !target.enabled;
  return saveSchedules(schedules);
}

/**
 * 오늘 실행해야 할 스케줄 목록 반환
 * (이미 오늘 실행된 것은 제외)
 */
export function getDueSchedules() {
  const key = getStorageKey();
  if (!key) return [];
  const schedules = loadSchedules().filter(s => s.enabled);
  // NOTE: Uses local date (not UTC). Schedules are evaluated based on device timezone.
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // 이미 실행된 기록
  const lastRun = getLastRunMap();

  return schedules.filter(s => {
    // 이미 오늘 실행됨
    if (lastRun[s.id] === todayKey) return false;

    if (s.frequency === "weekly" && s.day_of_week === dayOfWeek) return true;
    if (s.frequency === "monthly" && s.day_of_month === dayOfMonth) return true;
    return false;
  });
}

/**
 * 스케줄 실행 완료 기록
 * @returns {{ success: boolean }}
 */
export function markScheduleRun(scheduleId) {
  const lastRunKey = getLastRunKey();
  if (!lastRunKey) return { success: false };
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const lastRun = getLastRunMap();
  lastRun[scheduleId] = todayKey;
  try {
    localStorage.setItem(lastRunKey, JSON.stringify(lastRun));
    return { success: true };
  } catch {
    return { success: false };
  }
}

function getLastRunMap() {
  const key = getLastRunKey();
  if (!key) return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
