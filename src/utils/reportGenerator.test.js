// src/utils/reportGenerator.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { generateMonthlyReport, generateReportText, generateInsights } from "./reportGenerator";

/** 캘린더 데이터 localStorage에 세팅하는 헬퍼 */
function setCalendar(year, month, cells) {
  const key = `calendar_v1_${year}_${String(month).padStart(2, "0")}`;
  localStorage.setItem(key, JSON.stringify({
    year, month, cells,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    version: 1,
  }));
}

describe("generateMonthlyReport", () => {
  it("데이터 없으면 총 지출 0", () => {
    setCalendar(2026, 5, {});
    const report = generateMonthlyReport(2026, 5);
    expect(report).not.toBeNull();
    expect(report.total).toBe(0);
    expect(report.itemCount).toBe(0);
    expect(report.daysWithSpending).toBe(0);
    expect(report.categories).toEqual([]);
  });

  it("지출 항목 합산", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 3000, category: "간식", type: "expense" }] },
      "2026-05-10": { extra_items: [{ amount: 5000, category: "문구", type: "expense" }, { amount: 2000, category: "간식", type: "expense" }] },
    });
    const report = generateMonthlyReport(2026, 5);
    expect(report.total).toBe(10000);
    expect(report.itemCount).toBe(3);
    expect(report.daysWithSpending).toBe(2);
  });

  it("수입은 총 지출에서 제외, incomeTotal에 합산", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [
        { amount: 3000, category: "간식", type: "expense" },
        { amount: 10000, category: "용돈", type: "income" },
      ] },
    });
    const report = generateMonthlyReport(2026, 5);
    expect(report.total).toBe(3000);
    expect(report.incomeTotal).toBe(10000);
  });

  it("카테고리별 정렬 (내림차순)", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [
        { amount: 1000, category: "문구" },
        { amount: 5000, category: "간식" },
        { amount: 3000, category: "교통" },
      ] },
    });
    const report = generateMonthlyReport(2026, 5);
    expect(report.categories[0].name).toBe("간식");
    expect(report.categories[1].name).toBe("교통");
    expect(report.categories[2].name).toBe("문구");
  });

  it("카테고리 퍼센트 계산", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [
        { amount: 7000, category: "간식" },
        { amount: 3000, category: "문구" },
      ] },
    });
    const report = generateMonthlyReport(2026, 5);
    expect(report.categories[0].pct).toBe(70);
    expect(report.categories[1].pct).toBe(30);
  });

  it("최다 지출일 감지", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 1000, category: "간식" }] },
      "2026-05-15": { extra_items: [{ amount: 8000, category: "교통" }] },
      "2026-05-20": { extra_items: [{ amount: 3000, category: "문구" }] },
    });
    const report = generateMonthlyReport(2026, 5);
    expect(report.maxDay).toBe("2026-05-15");
    expect(report.maxDayAmount).toBe(8000);
  });

  it("일평균 지출 계산", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 2000, category: "간식" }] },
      "2026-05-10": { extra_items: [{ amount: 4000, category: "간식" }] },
    });
    const report = generateMonthlyReport(2026, 5);
    expect(report.avgDaily).toBe(3000); // 6000 / 2일
  });

  it("topCategory 반환", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 5000, category: "간식" }] },
    });
    const report = generateMonthlyReport(2026, 5);
    expect(report.topCategory.name).toBe("간식");
    expect(report.topCategory.pct).toBe(100);
  });

  it("amount 0인 항목 무시", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 0, category: "간식" }, { amount: 3000, category: "문구" }] },
    });
    const report = generateMonthlyReport(2026, 5);
    expect(report.total).toBe(3000);
    expect(report.itemCount).toBe(1);
  });
});

describe("generateReportText", () => {
  it("null → 빈 문자열", () => {
    expect(generateReportText(null)).toBe("");
  });

  it("기본 형식 포함", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 5000, category: "간식" }] },
    });
    const report = generateMonthlyReport(2026, 5);
    const text = generateReportText(report);
    expect(text).toContain("2026년 5월 용돈 리포트");
    expect(text).toContain("총 지출");
    expect(text).toContain("항목 수: 1건");
    expect(text).toContain("지출일: 1일");
    expect(text).toContain("카테고리별 지출");
    expect(text).toContain("간식");
  });

  it("수입 있으면 총 수입 표시", () => {
    const report = {
      year: 2026, month: 5, total: 3000, incomeTotal: 10000,
      itemCount: 1, daysWithSpending: 1, avgDaily: 3000,
      categories: [{ name: "간식", total: 3000, pct: 100 }],
      topCategory: { name: "간식", pct: 100 },
      maxDay: null, maxDayAmount: 0,
    };
    const text = generateReportText(report);
    expect(text).toContain("총 수입");
  });

  it("최다 지출일 포함", () => {
    const report = {
      year: 2026, month: 5, total: 5000, incomeTotal: 0,
      itemCount: 1, daysWithSpending: 1, avgDaily: 5000,
      categories: [{ name: "간식", total: 5000, pct: 100 }],
      topCategory: { name: "간식", pct: 100 },
      maxDay: "2026-05-15", maxDayAmount: 5000,
    };
    const text = generateReportText(report);
    expect(text).toContain("최다 지출일");
    expect(text).toContain("5/15");
  });

  it("카테고리 최대 5개만 표시", () => {
    const cats = Array.from({ length: 7 }, (_, i) => ({ name: `카테고리${i}`, total: 1000 * (7 - i), pct: 10 }));
    const report = {
      year: 2026, month: 5, total: 28000, incomeTotal: 0,
      itemCount: 7, daysWithSpending: 1, avgDaily: 28000,
      categories: cats,
      topCategory: cats[0], maxDay: null, maxDayAmount: 0,
    };
    const text = generateReportText(report);
    expect(text).toContain("카테고리4");  // 인덱스 0~4 표시 (5개)
    expect(text).not.toContain("카테고리5"); // 인덱스 5~6 미표시
  });
});

describe("generateInsights", () => {
  it("데이터 없으면 빈 배열", () => {
    expect(generateInsights(2026, 5)).toEqual([]);
  });

  it("전월 대비 증가 인사이트", () => {
    // 4월: 10,000원
    setCalendar(2026, 4, {
      "2026-04-01": { extra_items: [{ amount: 10000, category: "간식" }] },
    });
    // 5월: 15,000원 (50% 증가)
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 15000, category: "간식" }] },
    });
    const insights = generateInsights(2026, 5);
    const increase = insights.find(i => i.type === "increase");
    expect(increase).toBeTruthy();
    expect(increase.text).toContain("50%");
    expect(increase.text).toContain("증가");
  });

  it("전월 대비 감소 인사이트", () => {
    setCalendar(2026, 4, {
      "2026-04-01": { extra_items: [{ amount: 10000, category: "간식" }] },
    });
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 5000, category: "간식" }] },
    });
    const insights = generateInsights(2026, 5);
    const decrease = insights.find(i => i.type === "decrease");
    expect(decrease).toBeTruthy();
    expect(decrease.text).toContain("감소");
  });

  it("최다 지출 카테고리 30% 이상 시 인사이트", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 8000, category: "간식" }, { amount: 2000, category: "문구" }] },
    });
    const insights = generateInsights(2026, 5);
    const top = insights.find(i => i.type === "top_category");
    expect(top).toBeTruthy();
    expect(top.text).toContain("간식");
  });

  it("새로운 카테고리 인사이트", () => {
    setCalendar(2026, 4, {
      "2026-04-01": { extra_items: [{ amount: 5000, category: "간식" }] },
    });
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 3000, category: "간식" }, { amount: 2000, category: "교통" }] },
    });
    const insights = generateInsights(2026, 5);
    const newCat = insights.find(i => i.type === "new_category");
    expect(newCat).toBeTruthy();
    expect(newCat.text).toContain("교통");
  });

  it("일평균 지출 인사이트", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 3000, category: "간식" }] },
      "2026-05-10": { extra_items: [{ amount: 5000, category: "간식" }] },
    });
    const insights = generateInsights(2026, 5);
    const avg = insights.find(i => i.type === "avg_daily");
    expect(avg).toBeTruthy();
    expect(avg.text).toContain("하루 평균");
  });

  it("스파이크 지출일 인사이트", () => {
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 1000, category: "간식" }] },
      "2026-05-10": { extra_items: [{ amount: 1000, category: "간식" }] },
      "2026-05-20": { extra_items: [{ amount: 10000, category: "간식" }] }, // 평균 4000의 2.5배
    });
    const insights = generateInsights(2026, 5);
    const spike = insights.find(i => i.type === "spike_day");
    expect(spike).toBeTruthy();
    expect(spike.text).toContain("20일");
  });

  it("변화 10% 미만이면 증감 인사이트 미생성", () => {
    setCalendar(2026, 4, {
      "2026-04-01": { extra_items: [{ amount: 10000, category: "간식" }] },
    });
    setCalendar(2026, 5, {
      "2026-05-01": { extra_items: [{ amount: 10500, category: "간식" }] }, // 5% 증가
    });
    const insights = generateInsights(2026, 5);
    const change = insights.find(i => i.type === "increase" || i.type === "decrease");
    expect(change).toBeUndefined();
  });

  it("연도 경계 (1월 → 전년 12월 비교)", () => {
    setCalendar(2025, 12, {
      "2025-12-01": { extra_items: [{ amount: 5000, category: "간식" }] },
    });
    setCalendar(2026, 1, {
      "2026-01-01": { extra_items: [{ amount: 10000, category: "간식" }] },
    });
    const insights = generateInsights(2026, 1);
    const increase = insights.find(i => i.type === "increase");
    expect(increase).toBeTruthy();
    expect(increase.text).toContain("100%");
  });
});
