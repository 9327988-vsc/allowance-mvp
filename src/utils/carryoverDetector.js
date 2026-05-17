// src/utils/carryoverDetector.js — 지난달 미청구 금액 자동 감지

import { loadCalendarMonth } from "./storage";
import { loadSubmittedClaims } from "./submittedClaims";

/**
 * 지난달 미청구 임시 항목을 자동 감지
 *
 * 로직:
 * 1. 이전 달 캘린더 데이터 로드
 * 2. 이전 달에 제출된 정기 청구 확인
 * 3-a. 청구 없음 또는 거절됨 → 모든 extra_items가 미청구
 * 3-b. 청구 있음 → 청구 제출 이후 추가된 항목만 미청구
 *
 * @param {number} currentYear
 * @param {number} currentMonth
 * @returns {{ found: boolean, year: number, month: number, items: Array, total: number }}
 */
export function detectCarryover(currentYear, currentMonth) {
  // 이전 달 계산
  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }

  const result = {
    found: false,
    year: prevYear,
    month: prevMonth,
    items: [],
    total: 0,
  };

  // 이전 달 캘린더 로드
  const calendar = loadCalendarMonth(prevYear, prevMonth);
  if (!calendar || !calendar.cells) return result;

  // 이전 달의 모든 extra_items 수집
  const allItems = [];
  for (const [date, cellData] of Object.entries(calendar.cells)) {
    if (cellData.extra_items && cellData.extra_items.length > 0) {
      for (const item of cellData.extra_items) {
        allItems.push({
          ...item,
          date,
          day: parseInt(date.split("-")[2], 10),
        });
      }
    }
  }

  if (allItems.length === 0) return result;

  // 이전 달 정기 청구 확인
  const claims = loadSubmittedClaims();
  const regularClaim = claims.find(
    (c) => c.year === prevYear && c.month === prevMonth && !c.is_extra
  );

  let unclaimedItems = allItems;

  if (regularClaim && regularClaim.status !== "rejected") {
    // 청구가 있으면 → 청구 제출 이후에 추가된 항목만 미청구
    const submittedAt = new Date(regularClaim.submitted_at).getTime();
    if (!isNaN(submittedAt)) {
      unclaimedItems = allItems.filter((item) => {
        if (!item.created_at) return false;
        const createdAt = new Date(item.created_at).getTime();
        return !isNaN(createdAt) && createdAt > submittedAt;
      });
    }
  }

  if (unclaimedItems.length === 0) return result;

  // 미청구 확인됨
  const total = unclaimedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return {
    found: true,
    year: prevYear,
    month: prevMonth,
    items: unclaimedItems,
    total,
  };
}

/**
 * 특정 월의 미청구 금액 조회 (수동 선택용)
 * @param {number} year
 * @param {number} month
 * @returns {{ items: Array, total: number }}
 */
export function getUnclaimedForMonth(year, month) {
  const calendar = loadCalendarMonth(year, month);
  if (!calendar || !calendar.cells) return { items: [], total: 0 };

  const claims = loadSubmittedClaims();
  const regularClaim = claims.find(
    (c) => c.year === year && c.month === month && !c.is_extra
  );

  // 모든 extra_items 수집
  const allItems = [];
  for (const [date, cellData] of Object.entries(calendar.cells)) {
    if (cellData.extra_items && cellData.extra_items.length > 0) {
      for (const item of cellData.extra_items) {
        allItems.push({
          ...item,
          date,
          day: parseInt(date.split("-")[2], 10),
        });
      }
    }
  }

  if (allItems.length === 0) return { items: [], total: 0 };

  let unclaimedItems = allItems;

  if (regularClaim && regularClaim.status !== "rejected") {
    // 청구 제출 이후에 추가된 항목만
    const submittedAt = new Date(regularClaim.submitted_at).getTime();
    unclaimedItems = allItems.filter((item) => {
      if (!item.created_at) return false;
      return new Date(item.created_at).getTime() > submittedAt;
    });
  }

  return {
    items: unclaimedItems,
    total: unclaimedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
  };
}
