// src/constants/generalCategories.js — 일반계정 기본 카테고리

/**
 * 일반계정 지출 카테고리
 */
export const GENERAL_EXPENSE_CATEGORIES = [
  { id: "식비",   icon: "🍱", name: "식비" },
  { id: "교통",   icon: "🚇", name: "교통" },
  { id: "쇼핑",   icon: "🛍️", name: "쇼핑" },
  { id: "주거",   icon: "🏠", name: "주거" },
  { id: "통신",   icon: "📱", name: "통신" },
  { id: "의료",   icon: "💊", name: "의료" },
  { id: "교육",   icon: "📚", name: "교육" },
  { id: "여가",   icon: "🎮", name: "여가" },
  { id: "저축",   icon: "🏦", name: "저축" },
  { id: "기타",   icon: "✨", name: "기타" },
];

/**
 * 일반계정 수입 카테고리
 */
export const GENERAL_INCOME_CATEGORIES = [
  { id: "급여",     icon: "💰", name: "급여" },
  { id: "부수입",   icon: "💵", name: "부수입" },
  { id: "용돈",     icon: "🎁", name: "용돈" },
  { id: "기타수입", icon: "📥", name: "기타수입" },
];

/**
 * type별 카테고리 목록 반환
 * @param {"income"|"expense"} type
 */
export function getGeneralCategories(type) {
  return type === "income" ? GENERAL_INCOME_CATEGORIES : GENERAL_EXPENSE_CATEGORIES;
}

/**
 * 카테고리 이름으로 아이콘 조회 (일반계정용)
 */
export function getGeneralCategoryIcon(categoryName) {
  if (!categoryName) return "✨";
  const all = [...GENERAL_EXPENSE_CATEGORIES, ...GENERAL_INCOME_CATEGORIES];
  const found = all.find(c => c.name === categoryName);
  return found ? found.icon : "✨";
}
