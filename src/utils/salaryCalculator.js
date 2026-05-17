// src/utils/salaryCalculator.js — 급여 실수령액 계산기 (2026년 기준)

// 4대보험 요율
const RATES = {
  국민연금: 0.045,        // 4.5%
  건강보험: 0.03545,      // 3.545%
  장기요양_비율: 0.1281,  // 건강보험의 12.81%
  고용보험: 0.009,        // 0.9%
};

// 국민연금 상한/하한 (월 기준, 2026년)
const NPS_MIN = 370000;   // 하한
const NPS_MAX = 5900000;  // 상한

// 근로소득 간이세액표 (월급 기준, 1인 가구, 2026년 기준 추정)
// [하한, 상한, 세율, 누진공제]
const INCOME_TAX_BRACKETS = [
  [0,        1500000,   0.06,   0],
  [1500000,  4500000,   0.15,   126000],
  [4500000,  8800000,   0.24,   576000],
  [8800000,  15000000,  0.35,   1544000],
  [15000000, Infinity,  0.38,   1994000],
];

/**
 * 근로소득세 간이 계산 (월급 기준)
 * 실제 간이세액표와 약간 차이가 있을 수 있음
 */
function estimateIncomeTax(monthlyGross) {
  // 근로소득공제 적용
  let deduction;
  if (monthlyGross <= 5000000) {
    deduction = monthlyGross * 0.7;
    if (deduction > 2000000) deduction = 2000000;
  } else if (monthlyGross <= 15000000) {
    deduction = 2000000 + (monthlyGross - 5000000) * 0.4;
  } else {
    deduction = 6000000 + (monthlyGross - 15000000) * 0.15;
  }

  const taxableIncome = Math.max(0, monthlyGross - deduction);

  // 인적공제 (본인 1인: 월 125,000원)
  const personalDeduction = 125000;
  const taxBase = Math.max(0, taxableIncome - personalDeduction);

  // 구간별 세율 적용 (누진공제 방식)
  let tax = 0;
  for (const [lower, upper, rate, cumDeduct] of INCOME_TAX_BRACKETS) {
    if (taxBase > lower) {
      tax = taxBase * rate - cumDeduct;
      if (taxBase <= upper) break;
    }
  }

  return Math.max(0, Math.round(tax));
}

/**
 * 급여 실수령액 계산
 * @param {number} gross — 세전 월급 (원)
 * @returns {{ gross, deductions, totalDeduction, net }}
 */
export function calculateNetSalary(gross) {
  if (!gross || gross <= 0) {
    return {
      gross: 0,
      deductions: {
        국민연금: 0, 건강보험: 0, 장기요양: 0,
        고용보험: 0, 소득세: 0, 지방소득세: 0,
      },
      totalDeduction: 0,
      net: 0,
    };
  }

  // 국민연금: 상한/하한 적용
  // 국민연금: 하한 미만이면 실제 급여 기준, 상한 초과하면 상한 적용
  const npsBase = gross < NPS_MIN ? gross : Math.min(gross, NPS_MAX);
  const 국민연금 = Math.round(npsBase * RATES.국민연금);

  // 건강보험
  const 건강보험 = Math.round(gross * RATES.건강보험);

  // 장기요양보험 (건강보험 기준)
  const 장기요양 = Math.round(건강보험 * RATES.장기요양_비율);

  // 고용보험
  const 고용보험 = Math.round(gross * RATES.고용보험);

  // 소득세
  const 소득세 = estimateIncomeTax(gross);

  // 지방소득세 (소득세의 10%)
  const 지방소득세 = Math.round(소득세 * 0.1);

  const deductions = { 국민연금, 건강보험, 장기요양, 고용보험, 소득세, 지방소득세 };
  const totalDeduction = 국민연금 + 건강보험 + 장기요양 + 고용보험 + 소득세 + 지방소득세;
  const net = gross - totalDeduction;

  return { gross, deductions, totalDeduction, net };
}
