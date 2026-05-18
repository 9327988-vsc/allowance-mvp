// src/utils/createClaimSnapshot.js — P-09 스냅샷 동결
import { loadSettings, loadSettingsForUser, loadCalendarMonth, loadCustomCategories } from "./storage";
import { getActiveUser } from "./authStore";
import { calculateMonthlyAllowance } from "./calculator";
import { generateMessage } from "./messageTemplate";
import { getHolidays } from "./holidays";

/**
 * 현재 localStorage 상태를 스냅샷으로 동결
 * @param {number} year
 * @param {number} month
 * @returns {import("./claimStateMachine").ClaimSnapshot}
 */
export function createClaimSnapshot(year, month) {
  const activeUserId = getActiveUser();
  const settings = activeUserId ? loadSettingsForUser(activeUserId) : loadSettings();
  if (!settings) {
    throw new Error("MIGRATION_REQUIRED");
  }

  const calendarData = loadCalendarMonth(year, month);
  const customCategories = loadCustomCategories();
  const holidays = getHolidays();
  const calculation = calculateMonthlyAllowance(year, month, settings, calendarData, holidays);
  const message_text = generateMessage(year, month, calculation, settings, holidays, customCategories);

  const snapshot = {
    settings,
    cells: calendarData.cells || {},
    custom_categories: customCategories,
    calculation,
    message_text,
    snapshot_taken_at: new Date().toISOString(),
  };

  const byteSize = new Blob([JSON.stringify(snapshot)]).size;
  if (byteSize > 100000) {
    throw new Error("청구 데이터가 너무 큽니다 (100KB 초과). 항목을 줄여주세요.");
  }

  return snapshot;
}
