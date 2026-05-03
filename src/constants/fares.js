// src/constants/fares.js

/**
 * 경기도 시내버스 일반형 요금
 * 출처: 경기버스운송사업조합 (gbus.or.kr)
 * 시행: 2025-10-25
 */
export const KOREAN_BUS_FARES = {
  region: "경기도",
  type: "시내버스 일반형",
  effective_from: "2025-10-25",
  source: "경기버스운송사업조합 (gbus.or.kr)",
  source_url: "https://gbus.or.kr",
  fares: [
    {
      category: "일반",
      age_range: "만 19세 이상",
      one_way: 1650,
      round_trip: 3300,
      highlighted: false
    },
    {
      category: "청소년",
      age_range: "만 13~18세",
      one_way: 1160,
      round_trip: 2320,
      highlighted: true
    },
    {
      category: "어린이",
      age_range: "만 6~12세",
      one_way: 830,
      round_trip: 1660,
      highlighted: false
    }
  ]
};
