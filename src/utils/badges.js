// src/utils/badges.js — 성취 배지 시스템

import { getActiveUser } from "./authStore";

function getBadgesKey() {
  const userId = getActiveUser();
  if (!userId) return null;
  return "badges_earned_v1_u_" + userId;
}

/**
 * 배지 정의 목록
 * condition: (stats) => boolean 형태로 달성 조건 판별
 */
export const BADGE_DEFINITIONS = [
  {
    id: "first_claim",
    name: "첫 청구",
    icon: "🎉",
    description: "첫 번째 용돈 청구서를 제출했어요!",
    category: "milestone",
    condition: (stats) => stats.totalClaims >= 1,
  },
  {
    id: "claim_5",
    name: "습관 형성",
    icon: "📋",
    description: "청구서 5회 제출",
    category: "milestone",
    condition: (stats) => stats.totalClaims >= 5,
  },
  {
    id: "claim_10",
    name: "꾸준한 관리자",
    icon: "⭐",
    description: "청구서 10회 제출",
    category: "milestone",
    condition: (stats) => stats.totalClaims >= 10,
  },
  {
    id: "claim_20",
    name: "용돈 마스터",
    icon: "👑",
    description: "청구서 20회 제출",
    category: "milestone",
    condition: (stats) => stats.totalClaims >= 20,
  },
  {
    id: "chore_first",
    name: "첫 미션",
    icon: "🏠",
    description: "첫 번째 집안일 미션을 완료했어요!",
    category: "chore",
    condition: (stats) => stats.totalChores >= 1,
  },
  {
    id: "chore_10",
    name: "집안일 히어로",
    icon: "💪",
    description: "미션 10회 완료",
    category: "chore",
    condition: (stats) => stats.totalChores >= 10,
  },
  {
    id: "chore_30",
    name: "가사 달인",
    icon: "🏆",
    description: "미션 30회 완료",
    category: "chore",
    condition: (stats) => stats.totalChores >= 30,
  },
  {
    id: "savings_first",
    name: "절약 시작",
    icon: "🐷",
    description: "한 달 지출 한도를 초과하지 않았어요!",
    category: "savings",
    condition: (stats) => stats.monthsUnderLimit >= 1,
  },
  {
    id: "savings_3",
    name: "절약왕",
    icon: "💎",
    description: "3개월 연속 지출 한도 이내",
    category: "savings",
    condition: (stats) => stats.monthsUnderLimit >= 3,
  },
  {
    id: "streak_7",
    name: "7일 연속",
    icon: "🔥",
    description: "7일 연속으로 앱을 사용했어요!",
    category: "streak",
    condition: (stats) => stats.maxStreak >= 7,
  },
  {
    id: "streak_30",
    name: "30일 챌린저",
    icon: "🌟",
    description: "30일 연속 사용 달성!",
    category: "streak",
    condition: (stats) => stats.maxStreak >= 30,
  },
  {
    id: "approval_perfect",
    name: "완벽한 청구",
    icon: "✨",
    description: "5회 연속 청구가 한 번에 승인됐어요!",
    category: "quality",
    condition: (stats) => stats.consecutiveApprovals >= 5,
  },
];

/**
 * 획득한 배지 목록 로드
 */
export function loadEarnedBadges() {
  const key = getBadgesKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 배지 획득 기록
 * @returns {{ newBadges: Array }} 이번에 새로 획득한 배지 목록
 */
// NOTE: checkAndAwardBadges is currently exported but not called from anywhere.
// It should be wired into chore completion and claim approval flows once badge criteria are finalized.
export function checkAndAwardBadges(stats) {
  if (!stats || typeof stats !== "object") return { newBadges: [] };
  const key = getBadgesKey();
  if (!key) return { newBadges: [] };
  const earned = loadEarnedBadges();
  const earnedIds = new Set(earned.map(b => b.id));
  const newBadges = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (earnedIds.has(badge.id)) continue;
    try {
      if (badge.condition(stats)) {
        const entry = {
          id: badge.id,
          earned_at: new Date().toISOString(),
        };
        earned.push(entry);
        newBadges.push(badge);
      }
    } catch {
      // condition 실행 실패 무시
    }
  }

  if (newBadges.length > 0) {
    try {
      localStorage.setItem(key, JSON.stringify(earned));
    } catch { /* ignored */ }
  }

  return { newBadges };
}

/**
 * 배지 통계 요약
 */
export function getBadgeSummary() {
  const key = getBadgesKey();
  if (!key) return { total: BADGE_DEFINITIONS.length, earned: 0, percent: 0, badges: BADGE_DEFINITIONS.map(def => ({ ...def, earned: false, earned_at: null })) };
  const earned = loadEarnedBadges();
  return {
    total: BADGE_DEFINITIONS.length,
    earned: earned.length,
    percent: Math.round((earned.length / BADGE_DEFINITIONS.length) * 100),
    badges: BADGE_DEFINITIONS.map(def => ({
      ...def,
      earned: earned.some(e => e.id === def.id),
      earned_at: earned.find(e => e.id === def.id)?.earned_at || null,
    })),
  };
}
