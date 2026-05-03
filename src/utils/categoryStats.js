// src/utils/categoryStats.js
export function getCategoryUsage() {
  const usage = new Map();
  Object.keys(localStorage)
    .filter(k => k.startsWith("calendar_v1_"))
    .forEach(k => {
      try {
        const cal = JSON.parse(localStorage.getItem(k));
        Object.values(cal.cells || {}).forEach(cell => {
          (cell.extra_items || []).forEach(item => {
            usage.set(item.category, (usage.get(item.category) || 0) + 1);
          });
        });
      } catch {}
    });
  return usage;
}

export function cleanupUnusedCategories() {
  const usage = getCategoryUsage();
  const raw = localStorage.getItem("custom_categories_v1");
  if (!raw) return { deleted: [] };
  const data = JSON.parse(raw);
  const remaining = data.categories.filter(c => usage.has(c.name));
  const deleted = data.categories.filter(c => !usage.has(c.name)).map(c => c.name);
  data.categories = remaining;
  localStorage.setItem("custom_categories_v1", JSON.stringify(data));
  return { deleted };
}
