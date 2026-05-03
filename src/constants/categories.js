// src/constants/categories.js
import { newCategoryId } from "../utils/idGenerator";
import { loadCustomCategories, saveCustomCategories } from "../utils/storage";
import { validateCustomCategory } from "../utils/validators";

/**
 * 임시 항목 기본 카테고리 (시스템 제공)
 * 정책: id === name (사용자가 보는 텍스트가 곧 식별자)
 */
export const DEFAULT_CATEGORIES = [
  { id: "교재비",       icon: "📕", name: "교재비" },
  { id: "체험학습",     icon: "🎒", name: "체험학습" },
  { id: "준비물",       icon: "✏️", name: "준비물" },
  { id: "식비",         icon: "🍱", name: "식비" },
  { id: "의류",         icon: "👕", name: "의류" },
  { id: "선물",         icon: "🎁", name: "선물" },
  { id: "의료비",       icon: "💊", name: "의료비" },
  { id: "교통(특별)",   icon: "🚇", name: "교통(특별)" },
  { id: "기타",         icon: "✨", name: "기타" }
];

/**
 * 카테고리 이름으로 아이콘 조회
 */
export function getCategoryIcon(categoryName, customCategories = []) {
  if (!categoryName) return "✨";
  const def = DEFAULT_CATEGORIES.find(c => c.name === categoryName);
  if (def) return def.icon;
  const custom = customCategories.find(c => c.name === categoryName);
  if (custom) return custom.icon;
  return "✨";
}

/**
 * S-105 이모지 그리드용
 */
export const COMMON_EMOJIS = [
  "🎵", "🏃", "🎨", "🎮", "⚽", "🎬", "📷", "🎤",
  "🌿", "🐱", "☕", "🍔", "🚗", "✈️", "🎂", "🎃",
  "📝", "📐", "🎒", "📚", "✂️", "🖌️",
  "👕", "👟", "🧢", "🧥",
  "💊", "🩹", "🦷",
  "🎁", "🎉", "💰", "✨"
];

/**
 * 사용자 정의 카테고리 추가 (S-105)
 */
export function addCustomCategory(input) {
  const existing = loadCustomCategories();
  const validation = validateCustomCategory(input, existing);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const newCategory = {
    id: newCategoryId(),
    name: input.name.trim(),
    icon: input.icon,
    created_at: new Date().toISOString()
  };

  const updated = [...existing, newCategory];
  const result = saveCustomCategories(updated);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, category: newCategory };
}

/**
 * 사용자 정의 카테고리 삭제 (S-203)
 */
export function deleteCustomCategory(categoryId) {
  const existing = loadCustomCategories();
  const filtered = existing.filter(c => c.id !== categoryId);
  if (filtered.length === existing.length) {
    return { success: false, error: "NOT_FOUND" };
  }
  return saveCustomCategories(filtered);
}

/**
 * 사용자 정의 카테고리 수정 (S-203)
 */
export function updateCustomCategory(categoryId, updates) {
  const existing = loadCustomCategories();
  const idx = existing.findIndex(c => c.id === categoryId);
  if (idx === -1) return { success: false, error: "NOT_FOUND" };

  const updated = [...existing];
  updated[idx] = {
    ...updated[idx],
    ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    ...(updates.icon !== undefined ? { icon: updates.icon } : {})
  };

  return saveCustomCategories(updated);
}
