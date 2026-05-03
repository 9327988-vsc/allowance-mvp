// src/types/index.ts
// 타입 정의 문서 (런타임 사용 X, JSDoc 참조용)

// 공통 타입
// ──────────────────────────────────────
export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type ISODateString = string; // "2026-05-14"
export type ISOTimestamp = string;  // "2026-05-01T09:23:00.000Z"

// ──────────────────────────────────────
// settings_v1
// ──────────────────────────────────────
export interface Settings_v1 {
  child_name: string;            // 0~20자, 빈 문자열 허용
  school: ScheduleSettings;
  academy: ScheduleSettings;
  base_allowance: number;        // 0~1,000,000 정수
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  version: 1;
}

export interface ScheduleSettings {
  days: WeekDay[];               // 0~7개 (학원은 0개 허용)
  fare: number;                  // 0~100,000 정수 (days가 0개면 0 허용, 1개+면 1~100,000)
  round_trip: boolean;           // true=왕복, false=편도
  holiday_attend: boolean;       // 공휴일에도 등교/등원 여부
}

// ──────────────────────────────────────
// calendar_v1_YYYY_MM
// ──────────────────────────────────────
export interface CalendarMonth_v1 {
  year: number;                  // 2024~2099
  month: number;                 // 1~12
  cells: { [date: ISODateString]: CellData };
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  version: 1;
}

export interface CellData {
  extra_items: ExtraItem[];      // 0~3개
  memo: string;                  // 0~200자
}

export interface ExtraItem {
  id: string;                    // "ex_" + nanoid(6)
  category: string;              // 카테고리 name (항상 이름 저장, ID 저장 X)
  name: string;                  // 1~50자
  amount: number;                // 1~10,000,000 정수
  created_at: ISOTimestamp;
}

// ──────────────────────────────────────
// custom_categories_v1
// ──────────────────────────────────────
export interface CustomCategories_v1 {
  categories: CustomCategory[];
  version: 1;
}

export interface CustomCategory {
  id: string;                    // "cat_" + nanoid(6)
  name: string;                  // 1~20자
  icon: string;                  // 이모지 1자 (서로게이트 페어 가능)
  created_at: ISOTimestamp;
}

// ──────────────────────────────────────
// meta_v1
// ──────────────────────────────────────
export interface Meta_v1 {
  first_used_at: ISOTimestamp;
  last_used_at: ISOTimestamp;
  current_view_month: string;    // "2026-05"
  app_version: string;           // "1.0.0"
  schema_version: 1;
}

// ──────────────────────────────────────
// 정적 데이터: holidays.json
// ──────────────────────────────────────
export interface Holidays {
  [date: ISODateString]: HolidayInfo;
}

export interface HolidayInfo {
  name: string;
  type: "legal" | "alternative"; // 법정공휴일 / 대체공휴일
}

// ──────────────────────────────────────
// 계산 결과 (메모리 전용)
// ──────────────────────────────────────
export interface AllowanceCalculation {
  base_allowance: number;
  school_total: number;
  school_days_count: number;
  academy_total: number;
  academy_days_count: number;
  extra_items_total: number;
  total: number;
  cells: CellCalculation[];
}

export interface CellCalculation {
  date: ISODateString;
  weekday: WeekDay;
  is_holiday: boolean;
  holiday_name: string | null;
  school_fee: number;
  academy_fee: number;
  extra_items: ExtraItem[];
  memo: string;
  total: number;
}

// ──────────────────────────────────────
// 백업 파일 포맷 (S-113 내보내기 / S-114 가져오기)
// ──────────────────────────────────────
export interface ExportFile_v1 {
  export_version: 1;
  exported_at: ISOTimestamp;
  app_version: string;
  schema_version: 1;
  settings?: Settings_v1;
  meta?: Meta_v1;
  custom_categories?: CustomCategories_v1;
  calendars: { [yearMonth: string]: CalendarMonth_v1 }; // "2026-05"
  backups?: { [key: string]: string };
  checksum: string;              // SHA-256
}
