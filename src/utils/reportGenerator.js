// src/utils/reportGenerator.js — 월간 리포트 데이터 + 카톡 복사 텍스트 생성
import { formatAmount } from "./formatAmount";

/**
 * 월간 지출 리포트 데이터 생성
 */
export function generateMonthlyReport(year, month) {
  const key = `calendar_v1_${year}_${String(month).padStart(2, "0")}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  let cal;
  try { cal = JSON.parse(raw); } catch { return null; }

  const categories = {};
  let total = 0;
  let incomeTotal = 0;
  let itemCount = 0;
  let daysWithSpending = 0;
  const dailyTotals = {};

  for (const [date, cell] of Object.entries(cal.cells || {})) {
    let dayTotal = 0;
    for (const item of (cell.extra_items || [])) {
      const amount = Math.abs(item.amount || 0);
      if (amount === 0) continue;

      if (item.type === "income") {
        incomeTotal += amount;
        continue;
      }

      total += amount;
      itemCount++;
      dayTotal += amount;
      const cat = item.category || "기타";
      if (!categories[cat]) categories[cat] = { total: 0, count: 0 };
      categories[cat].total += amount;
      categories[cat].count++;
    }
    if (dayTotal > 0) {
      daysWithSpending++;
      dailyTotals[date] = dayTotal;
    }
  }

  // 최다 지출일
  let maxDay = null;
  let maxDayAmount = 0;
  for (const [date, amt] of Object.entries(dailyTotals)) {
    if (amt > maxDayAmount) { maxDay = date; maxDayAmount = amt; }
  }

  // 카테고리 정렬
  const sortedCategories = Object.entries(categories)
    .map(([name, data]) => ({ name, ...data, pct: total > 0 ? Math.round((data.total / total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);

  const avgDaily = daysWithSpending > 0 ? Math.round(total / daysWithSpending) : 0;

  return {
    year, month, total, incomeTotal, itemCount,
    daysWithSpending, avgDaily,
    categories: sortedCategories,
    maxDay, maxDayAmount,
    topCategory: sortedCategories[0] || null,
  };
}

/**
 * 카카오톡 공유용 텍스트 생성
 */
export function generateReportText(report) {
  if (!report) return "";

  const lines = [
    `📊 ${report.year}년 ${report.month}월 용돈 리포트`,
    `━━━━━━━━━━━━━━━`,
    ``,
    `💰 총 지출: ${formatAmount(report.total)}`,
  ];

  if (report.incomeTotal > 0) {
    lines.push(`💵 총 수입: ${formatAmount(report.incomeTotal)}`);
  }

  lines.push(`📋 항목 수: ${report.itemCount}건`);
  lines.push(`📅 지출일: ${report.daysWithSpending}일`);
  lines.push(`📊 일평균: ${formatAmount(report.avgDaily)}`);
  lines.push(``);

  if (report.categories.length > 0) {
    lines.push(`🏷 카테고리별 지출`);
    report.categories.slice(0, 5).forEach(cat => {
      lines.push(`  ${cat.name}: ${formatAmount(cat.total)} (${cat.pct}%)`);
    });
    lines.push(``);
  }

  if (report.topCategory) {
    lines.push(`🥇 최다 지출: ${report.topCategory.name} (${report.topCategory.pct}%)`);
  }

  if (report.maxDay) {
    const d = report.maxDay.split("-");
    lines.push(`📌 최다 지출일: ${parseInt(d[1])}/${parseInt(d[2])} (${formatAmount(report.maxDayAmount)})`);
  }

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━`);
  lines.push(`가족 용돈관리 앱에서 보냄 💝`);

  return lines.join("\n");
}

/**
 * 월간 인사이트 자동 생성
 * 이전 달과 비교하여 변화 ���석
 */
export function generateInsights(year, month) {
  const current = generateMonthlyReport(year, month);
  if (!current) return [];

  // 이전 달 리포트
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prev = generateMonthlyReport(prevYear, prevMonth);

  const insights = [];

  // 인사이트 1: 총 지출 변화
  if (prev && prev.total > 0) {
    const diff = current.total - prev.total;
    const pct = Math.round((diff / prev.total) * 100);
    if (Math.abs(pct) >= 10) {
      insights.push({
        type: diff > 0 ? "increase" : "decrease",
        icon: diff > 0 ? "📈" : "📉",
        text: `지난달 대비 ${Math.abs(pct)}% ${diff > 0 ? "증가" : "감소"}`,
      });
    }
  }

  // 인사이트 2: 최다 지출 카테고리
  if (current.topCategory && current.topCategory.pct >= 30) {
    insights.push({
      type: "top_category",
      icon: "🏷",
      text: `"${current.topCategory.name}"이 전체의 ${current.topCategory.pct}%를 차지해요`,
    });
  }

  // 인사이트 3: 카테고리 변화 (이전 달 대비 새로운 카테고리)
  if (prev) {
    const prevCats = new Set(prev.categories.map(c => c.name));
    const newCats = current.categories.filter(c => !prevCats.has(c.name) && c.total > 0);
    if (newCats.length > 0) {
      insights.push({
        type: "new_category",
        icon: "✨",
        text: `이번 달 새로운 지출: ${newCats.map(c => c.name).join(", ")}`,
      });
    }
  }

  // 인사이트 4: 일평균 지출
  if (current.avgDaily > 0) {
    insights.push({
      type: "avg_daily",
      icon: "📊",
      text: `하루 평균 ${current.avgDaily.toLocaleString()}원 지출 (${current.daysWithSpending}일간)`,
    });
  }

  // 인사이트 5: 최다 지출일 강조
  if (current.maxDay && current.avgDaily > 0 && current.maxDayAmount > current.avgDaily * 2) {
    const d = current.maxDay.split("-");
    const dayNum = parseInt(d[2], 10);
    if (!isNaN(dayNum)) {
      insights.push({
        type: "spike_day",
        icon: "⚡",
        text: `${dayNum}일에 평소의 ${Math.round(current.maxDayAmount / current.avgDaily)}배를 지출했어요`,
      });
    }
  }

  return insights;
}
