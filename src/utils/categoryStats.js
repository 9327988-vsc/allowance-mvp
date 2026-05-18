// src/utils/categoryStats.js
import { loadCalendarMonth, loadCustomCategories, saveCustomCategories, listAllAppKeys } from "./storage";

export function getCategoryUsage() {
  const usage = new Map(); // key: category id or name, value: count
  listAllAppKeys()
    .filter(k => k.match(/^calendar_v1_(\d{4})_(\d{2})$/))
    .forEach(k => {
      const match = k.match(/^calendar_v1_(\d{4})_(\d{2})$/);
      if (!match) return;
      const cal = loadCalendarMonth(parseInt(match[1]), parseInt(match[2]));
      Object.values(cal.cells || {}).forEach(cell => {
        (cell.extra_items || []).forEach(item => {
          // Track by category_id if available, fallback to category name
          const key = item.category_id || item.category;
          usage.set(key, (usage.get(key) || 0) + 1);
        });
      });
    });
  return usage;
}

export function cleanupUnusedCategories() {
  const existing = loadCustomCategories();
  if (!existing.length) return { deleted: [] };

  // 삭제 직전에 usage를 확인 — 다른 탭에서 데이터가 추가됐을 수 있음
  const freshUsage = getCategoryUsage();

  // ID 기반 비교 (fallback: name)
  const remaining = existing.filter(c => freshUsage.has(c.id) || freshUsage.has(c.name));
  const deleted = existing.filter(c => !freshUsage.has(c.id) && !freshUsage.has(c.name)).map(c => c.name);
  saveCustomCategories(remaining);
  return { deleted };
}
