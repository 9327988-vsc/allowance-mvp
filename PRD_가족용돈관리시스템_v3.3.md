# 가족용 캘린더 기반 용돈 청구 관리 시스템 PRD

**문서 버전:** v3.4
**작성일:** 2026-05-02
**문서 종류:** Product Requirements Document
**대상 단계:** 1단계 (개발 착수 가능 수준), 2~4단계 (로드맵)

---

## v3.4 변경 사항 (나노 단위 전수조사 후 보완)

### 🔴 Critical 보완 (14건)
| ID | 영역 | 수정 |
|---|---|---|
| C4-01 | 7.1, 8.5 | 반응형 정산표 위치 명확화 (768~1439: 캘린더 하단 스크롤, ≥1440: 우측 사이드바 기본 표시) |
| C4-02 | F1-2, 7.1 | 셀 합계 금액 표시 전략 확정 (모바일: 아이콘만, 데스크톱: 아이콘+금액) |
| C4-03 | F1-7 | "오늘 +12개월" = 월 기준으로 확정 (오늘이 5월이면 2027-05까지 가능, 2027-06부터 비활성) |
| C4-04 | 7.12 | S-402 툴팁 위치 알고리즘·메모 길이·빈 메모 처리 상세 추가 |
| C4-05 | 9.6 | S-203 카테고리 수정 UI (인라인 편집) 스펙 추가 |
| C4-06 | 9.6 | S-203 카테고리 삭제 확인 모달 추가 + 사용 중 임시항목 경고 |
| C4-07 | 7.4 | S-104 handleNewCategorySuccess에 customCategories state 갱신 코드 추가 |
| C4-08 | 7.8 | S-108 정리 후 자동 재시도 정책 명시 |
| C4-09 | 7.8 | S-109에 [복구 시도] 버튼 추가 (recoverFromBackup 연결) |
| C4-10 | 9.5 | S-114 Overwrite 시 corrupted_* 처리 정책 명시 |
| C4-11 | 9.3 | S-112 recoverFromBackup 실패 시 에러별 토스트 메시지 추가 |
| C4-12 | F1-3, 7.11 | 정산표 행 순서 규칙 확정 (기본용돈→학교→학원→임시항목 등록순→합계) |
| C4-13 | 7.11 | 정산표 계산식 반응형 표시 규칙 (모바일: 금액만, ≥768: 계산식 포함) |
| C4-14 | F1-2 | 메모 점(dot) 시각화 상세 (●, 6px, --color-primary, 셀 우측 상단) |

### 🟡 Medium 보완 (6건)
| ID | 영역 | 수정 |
|---|---|---|
| M4-01 | 7.1 | 토요일/일요일 학교 설정 시 날짜색 우선순위 확정 (요일색 유지, 아이콘만 추가) |
| M4-02 | 7.10 | S-302 [다시 시도] 버튼 동작 명시 (이전 저장 자동 재실행) |
| M4-03 | 7.4 | S-105 이모지 그리드 모서리 순환 정책 (행 내 순환, 행 넘김 없음) |
| M4-04 | 7.3 | S-103 메모 글자수 카운터 형식 확정 ("현재/200") |
| M4-05 | 7.4 | S-105 카테고리 중복 검사 범위 (기본 9개 포함) |
| M4-06 | 8.4 | 중첩 모달 포커스 트랩 — 최상위 모달에만 트랩 적용 |

### v3.3 → v3.4 분량 변화
| 항목 | v3.3 | v3.4 |
|---|---:|---:|
| 전체 | 4,500줄 / 162KB | 약 4,900줄 / 약 178KB (+9%) |
| 보완 | - | 나노 단위 전수조사 14 Critical + 6 Medium 반영 |

---

## v3.3 변경 사항 (이전 변경 이력)

### 🔴 Critical (실데이터 오류) 1건
| ID | 영역 | 수정 |
|---|---|---|
| C-01 | 3.4 holidays.json | **2026년 부처님오신날 날짜 정정**: 5/25 → **5/24(일)** + 5/25(월) 대체공휴일 추가. 한국천문연구원·정부 공식 기준 (음력 4월 8일 = 2026-05-24) |

### 🟡 Medium (코드/명세 누락) 3건
| ID | 영역 | 수정 |
|---|---|---|
| M-01 | 4장 신규 4.12 | `addCustomCategory()` 함수 신설 (S-105에서 호출, validate + 저장 + 반환) + 단위 테스트 |
| M-02 | 7.4 | S-105 열려있을 때 S-104 입력 disabled 처리 정책 코드 명시 (state 관리 패턴) |
| M-03 | 3.4 | "지방선거일·임시공휴일은 출시 직전 확인 필요" 주의사항 추가 |

### 🟢 Low (일관성) 3건
| ID | 영역 | 수정 |
|---|---|---|
| L-01 | 10.9 | README.md 내부 헤딩(`## 시작` 등)이 PRD 헤딩으로 잘못 파싱되던 문제 해결 (코드 블록으로 감싸기) |
| L-02 | 4.7 | `validateMemo` 시그니처 일관화 안내 노트 추가 (현재 형태는 유지하되 사용 패턴 명시) |
| L-03 | 4.10 / 4.11 | holidays 접근 정책 단일화 — `getHolidays()` 직접 호출 권장, BootResult.holidays는 deprecated 표시 |

### v3.2 → v3.3 분량 변화
| 항목 | v3.2 | v3.3 |
|---|---:|---:|
| 전체 | 4,362줄 / 156KB | 약 4,500줄 / 약 162KB (+3%) |
| 신규 함수 | - | `addCustomCategory()` |
| 단위 테스트 | calculator·message·storage·holidays | + categories.test.js (4건) |

---

## v3.2 변경 사항 (이전 변경 이력)

### 🔴 필수 수정 (10건)
| ID | 영역 | 수정 |
|---|---|---|
| 🔴-01 | 3.2, 4.7 | `fare` 필드 범위를 `0~100,000` 정수로 통일 (days=0개면 0 허용, 1개+면 1~100,000) |
| 🔴-02 | F1-2, F1-9 | Settings 변경 영향 범위 명확화 (자동 항목은 매번 실시간 계산, 임시 항목·메모는 cells에 저장되어 보존) |
| 🔴-03 | 3.2, 3.5 | `ExtraItem.category`는 항상 카테고리 **name** 저장. `getCategoryIcon`을 2단계 검색으로 단순화 |
| 🔴-04 | 3.2 | 빈 셀 정책 명시 (extra_items=[] && memo="" 이면 cells[date] delete, 조회 시 `?? { extra_items:[], memo:"" }`) |
| 🔴-05 | 4.6 | `cleanupOldCalendars` 문자열 비교 → `Date` 객체 비교로 변경 (연도 경계 안전화) |
| 🔴-06 | 4.10 | `holidays.json` 로드 함수 (`loadHolidays`/`getHolidays`) 신설, `initApp()`에서 호출 |
| 🔴-07 | 10.8 | `index.html` script 절대 경로 → 상대 경로 (`./src/main.jsx`) |
| 🔴-08 | 10.3 | `package.json`에 `@vitest/ui`, `jsdom` 추가 |
| 🔴-09 | 9.4, 9.5 | Export/Import 체크섬 정규화 (키 정렬한 JSON 사용) |
| 🔴-10 | 7.6 | S-202 월 선택 화면 상세 스펙 (4×3 그리드, 44×44px, 연도 탭, 선택/오늘/비활성 상태) |

### 🟡 권장 수정 (9건)
| ID | 영역 | 수정 |
|---|---|---|
| 🟡-01 | 4.7 | `validateMemo` 반환 형식을 `{valid, errors}`로 통일 |
| 🟡-02 | 7.4 | S-104 / S-105 카테고리 선택 흐름 (오버레이·자동 선택·취소 시 복귀) 명시 |
| 🟡-03 | 6.3 | 중첩 모달 ESC 동작 매트릭스 (LIFO + isDirty 검사 여부) 추가 |
| 🟡-04 | 10.5 | `tailwind.config.js`에 CSS 변수 매핑 보강 (spacing, borderRadius 추가) |
| 🟡-05 | 7.4 | S-105 이모지 그리드 상세 스펙 (6×3, 44×44px, ARIA radiogroup, 키보드 네비) |
| 🟡-06 | 9.3 | `recoverFromBackup` 함수 추가 (가장 최근 백업 복원) |
| 🟡-07 | 4.1 | `getWeekday` 시간대 명시 (KST 가정, 한국 단일 사용자 전제) |
| 🟡-08 | 10.2 | `.gitignore`, `.eslintrc.json` 폴더 구조 추가 |
| (보너스) | 13.1 | 의사결정 로그에 D-016 ~ D-020 추가 (위 정책들의 결정 근거 명시) |

### v3.1 → v3.2 분량 변화
| 영역 | v3.1 | v3.2 |
|---|---:|---:|
| 전체 | 3,714줄 / 131KB | **4,360줄 / 156KB** (+17%) |
| 새 코드 | - | holidays.js, recoverFromBackup, computeChecksum, sortKeysDeep |
| 단위 테스트 | calculator + message + storage 4건 | + storage 6건 + holidays 3건 |

---

## v3.1 변경 사항 (이전 변경 이력)

### v3.0의 버그 수정
| ID | 심각도 | 수정 내용 |
|---|---|---|
| BUG-01 | 🔴 Critical | `cleanupOldCalendars` 미래 캘린더 보호 + 정확한 cutoff 로직으로 재작성 |
| BUG-02 | 🟡 | S-103 ASCII 예시 "5월 14일 (수)"는 평일이라 공휴일 배지 제거 (어린이날은 5/5) |
| BUG-03 | 🟡 | S-001 ASCII 정산표를 일관된 시나리오 1건(임시항목 포함, 합계 150,640원)로 통일 |
| BUG-04 | 🟡 | 4.4 메시지 출력 예시와 4.5 단위 테스트가 다른 시나리오임을 명시 |
| BUG-05 | 🟢 | DEFAULT_CATEGORIES의 id가 name과 같음을 명시, getCategoryIcon 동작 보강 |
| BUG-06 | 🟢 | F1-2 셀 표시 매트릭스에 "학교 요일에 토/일 포함된 케이스" 명시 |

### v3.0의 누락 영역 보강
| ID | 영역 |
|---|---|
| MISS-01 | 앱 부팅 단계 데이터 로드 실패 처리 흐름 (`initApp()` 함수 추가) |
| MISS-02 | 모바일 가상 키보드 + safe area 대응 (CSS `env(safe-area-inset-*)`, `100dvh`) |
| MISS-03 | iOS Safari viewport-fit=cover 대응 |
| MISS-04 | settings 변경이 과거 임시 항목에 영향 없음 명시 |
| MISS-05 | 좌우 스와이프 월 이동 (1.0 출시 후 1.1로 보류, 명시 X 였던 것 명시) |
| MISS-06 | 월 첫날이 일~토 어느 요일이든 placeholder 처리 검증 |
| MISS-07 | localStorage disabled 감지 함수 추가 (`isStorageAvailable()`) |
| MISS-08 | 빈 상태 (S-403) 트리거 조건 정확화 |

### v3.0 → v3.1 분량 변화
| 영역 | v3.0 | v3.1 | 비고 |
|---|---:|---:|---|
| 전체 | 3,282줄 / 114KB | 약 3,500줄 / 약 121KB | 버그 수정·누락 보강 (+200줄) |

---

## v3.0 변경 사항 (이전 변경 이력)

### v2.1 → v3.0
- **추상적 서술 / 자기참조 / 마케팅 톤 삭제** (전체 ~3,000줄 감소)
- **시장 분석·차별점·1단계 정체성·사상 준수 검증** 등 "분량을 위한 분량" 폐기
- **2~4단계 상세 명세를 로드맵 1장으로 통합** (1단계 사용 후 다시 작성 예정)
- **중복 정보 통폐합** (디자인 토큰·검증 로직·인수 조건 형식이 여러 번 반복되던 것을 한 곳에서 정의)
- **실데이터 첨부**: `holidays.json` 2026~2030 전체, 기본 카테고리 9개 + 이모지, 경기버스 요금표, 메시지 템플릿 출력 예시
- **실제 동작 코드**: 청구액 계산 / 메시지 생성 / 스토리지 헬퍼 (단위 테스트 포함)
- **빌드 / 배포 실파일**: `package.json`, `vite.config.js`, `tailwind.config.js`, GitHub Actions yaml

### v2.1 → v3.0 분량 비교
| 영역 | v2.1 | v3.0 | 변화 |
|---|---:|---:|---:|
| 1단계 핵심 | 약 8,000줄 | 약 6,500줄 | 군더더기 제거 + 실데이터 추가 |
| 2~4단계 | 약 2,036줄 | 약 200줄 | 로드맵 개요로 축약 |
| 데이터·NFR | 약 1,000줄 | 약 800줄 | 중복 제거 |
| **합계** | **11,929줄** | **약 7,500줄** | **분량 −37%, 밀도 ↑** |

---

## 목차

1. 1단계 목표와 범위
2. 사용자와 시스템 핵심 원칙
3. 1단계 데이터 모델
4. 1단계 비즈니스 로직 (실제 코드)
5. 1단계 기능별 명세 (F1-1 ~ F1-9)
6. 1단계 화면 시스템 (17개 화면)
7. 1단계 화면별 상세 명세
8. 1단계 인터랙션·접근성·반응형
9. 1단계 관리자 / 진단 모드
10. 1단계 빌드·배포·운영
11. 1단계 → 2단계 마이그레이션 사전 설계
12. 2~4단계 로드맵
13. 부록: 실데이터·테스트 케이스·의사결정 로그

---

## 1. 1단계 목표와 범위

### 1.1 한 줄 정의

본인이 캘린더 기반으로 한 달치 용돈 청구액을 자동 계산해서 카톡으로 부모님께 메시지 한 번 보내는 도구.

### 1.2 작업 환경

| 항목 | 내용 |
|---|---|
| 사용자 | Hex님 본인 1명 (단일 사용자) |
| 부모님 | 시스템 외부 (카톡 메시지 수신만) |
| 사용 빈도 | 매월 1회 (월말~월초) |
| 1회 사용 시간 | 30초 이내 목표 |
| 인터넷 | 불필요 (HTML 단독 동작) |
| 회원가입 | 없음 |
| 기기 | PC 또는 폰 1대 (다중 기기 동기화 없음) |
| 개발 기간 | 2주 이내 목표 |

### 1.3 1단계에 포함되는 것 (9개 기능)

| ID | 기능 |
|---|---|
| F1-1 | 자녀 기본 설정 |
| F1-2 | 캘린더 셀에 당일 교통비 자동 표시 |
| F1-3 | 화면 하단 정산표 + 합계 |
| F1-4 | 비고 버튼 (요금표 + 아이콘 안내) |
| F1-5 | 임시 항목 추가 + 메모 (셀당 최대 3개) |
| F1-6 | 청구 메시지 자동 생성 (카톡 복사용) |
| F1-7 | 미래 +12개월·과거 무제한 달 조회·편집 |
| F1-8 | 로컬스토리지 자동 저장 |
| F1-9 | 설정 변경 (학기 변경 대응) |

### 1.4 1단계에서 제외되는 것

| 영역 | 도입 단계 |
|---|---|
| 부모 화면, 승인·거절·지급 흐름 | 2단계 |
| 청구 이력, 미수금, 차감 처리 | 2단계 |
| 알림, 영수증, 통계 | 4단계 |
| 클라우드 동기화 | 3단계 |
| 회원가입 / 로그인 / 가족 그룹 | 3단계 |

### 1.5 성공 기준 (Success Criteria)

| 지표 | 목표 | 측정 |
|---|---|---|
| 청구 작성 시간 | 30초 이내 | 본인 측정 |
| 계산 정확도 | 100% | 수동 계산과 비교 |
| 본인 만족도 | "다음 달에도 쓰겠다" | 본인 판단 |
| 출시까지 개발 기간 | 2주 이내 | 일정 추적 |

---

## 2. 사용자와 시스템 핵심 원칙

### 2.1 사용자 정의 (1단계)

- **본인 (Hex님 자녀, 자녀A)**: 학교(월~금 왕복), 학원(수·금 왕복), 기본 용돈 80,000원, 청소년 카드 1,160원/회
- **부모님 (Hex님 본인 + 배우자)**: 시스템 외부. 카톡 메시지를 받고 외부에서 송금
- **단일 사용자 가정**: 자녀 본인이 입력·청구·확인 모두 수행. 부모는 시스템에 진입 안 함.

### 2.2 시스템 핵심 원칙 (1~4단계 공통)

| ID | 원칙 | 1단계 적용 |
|---|---|---|
| **P-01** | 평균 금액 일괄 청구 (캘린더 자동 채우기는 읽기 전용) | F1-2 (학교/학원 자동) |
| **P-02** | 변경 이력 표시 | 1단계는 단일 사용자라 불필요. 2단계부터 |
| **P-03** | 단계 간 데이터 호환성 | 1단계 스키마는 2단계 DB로 1:1 매핑 가능 |
| **P-04** | 사상 일관성 (조기 도입 금지) | 백엔드·인증·양방향 흐름 1단계 진입 금지 |
| **P-05** | 외부 송금은 시스템 외부 | 1단계는 카톡 메시지 복사까지만 |

### 2.3 1단계 사상 체크리스트

- [x] 9개 기능이 모두 단일 사용자 컨텍스트 안에 머무는가? → 예
- [x] 백엔드 / 인증 / 양방향 흐름이 없는가? → 예 (전부 로컬스토리지)
- [x] 2주 작업으로 끝낼 수준인가? → 예
- [x] 부모님이 시스템에 진입하지 않고도 본인이 가치를 얻는가? → 예 (메시지 복사로 종료)
- [x] 4단계 기능을 미리 끌어와서 무거워진 부분이 없는가? → 예 (이력·통계·알림 등 모두 4단계로)

---
## 3. 1단계 데이터 모델

### 3.1 로컬스토리지 키 전체 목록

| 키 | 타입 | 생성 시점 | 수정 빈도 |
|---|---|---|---|
| `settings_v1` | object | 첫 사용 (S-101 저장) | 학기 변경 시 (~분기 1회) |
| `calendar_v1_YYYY_MM` | object | 해당 월 첫 진입 시 | 임시 항목·메모 추가 시 |
| `custom_categories_v1` | object | 사용자 정의 카테고리 첫 추가 | 추가/삭제 시 |
| `meta_v1` | object | 첫 사용 시 | 매 진입 시 |
| `*_corrupted_TIMESTAMP` | string (백업) | JSON 파싱 실패 시 자동 | 손상 발생 시만 |

### 3.2 TypeScript 인터페이스 (전체)

```typescript
// types/index.ts

// ──────────────────────────────────────
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

/**
 * 빈 셀 정책 (v3.2 명시):
 *
 * 저장 시점:
 *   extra_items === [] && memo === "" 이면 cells[date] 키 자체를 delete한다.
 *   (불필요한 빈 객체로 스토리지 낭비 방지)
 *
 * 조회 시점:
 *   cells[date]가 undefined이면 빈 셀로 간주.
 *   const cellData = calendar.cells[date] ?? { extra_items: [], memo: "" };
 *
 * 일관된 동작:
 *   - 셀 클릭으로 S-103 진입 → 빈 객체로 초기화하여 표시
 *   - 임시 항목 추가 → cells[date] 객체 생성 후 push
 *   - 모든 임시 항목 삭제 + 메모 비움 → cells[date] 자체 삭제
 */

export interface ExtraItem {
  id: string;                    // "ex_" + nanoid(6)
  category: string;              // 카테고리 name (v3.2: 항상 이름 저장, ID 저장 X)
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
```

### 3.3 실제 데이터 예시

#### 3.3.1 settings_v1 예시 (Hex님 자녀A 기준)

```json
{
  "child_name": "자녀A",
  "school": {
    "days": ["mon", "tue", "wed", "thu", "fri"],
    "fare": 1160,
    "round_trip": true,
    "holiday_attend": false
  },
  "academy": {
    "days": ["wed", "fri"],
    "fare": 1160,
    "round_trip": true,
    "holiday_attend": true
  },
  "base_allowance": 80000,
  "created_at": "2026-04-01T10:00:00.000Z",
  "updated_at": "2026-04-15T14:30:00.000Z",
  "version": 1
}
```

#### 3.3.2 calendar_v1_2026_05 예시

```json
{
  "year": 2026,
  "month": 5,
  "cells": {
    "2026-05-14": {
      "extra_items": [
        {
          "id": "ex_a3f9k2",
          "category": "체험학습",
          "name": "박물관 체험비",
          "amount": 8000,
          "created_at": "2026-05-10T15:23:00.000Z"
        }
      ],
      "memo": "ㅇㅇ박물관 단체 관람"
    },
    "2026-05-19": {
      "extra_items": [
        {
          "id": "ex_b4g0l3",
          "category": "수련회",
          "name": "수련회 회비",
          "amount": 50000,
          "created_at": "2026-05-12T10:00:00.000Z"
        }
      ],
      "memo": ""
    }
  },
  "created_at": "2026-05-01T08:00:00.000Z",
  "updated_at": "2026-05-12T10:00:00.000Z",
  "version": 1
}
```

#### 3.3.3 custom_categories_v1 예시

```json
{
  "categories": [
    {
      "id": "cat_d5h1m4",
      "name": "동아리 회비",
      "icon": "🎵",
      "created_at": "2026-04-20T11:00:00.000Z"
    }
  ],
  "version": 1
}
```

#### 3.3.4 meta_v1 예시

```json
{
  "first_used_at": "2026-04-01T10:00:00.000Z",
  "last_used_at": "2026-05-01T09:23:00.000Z",
  "current_view_month": "2026-05",
  "app_version": "1.0.0",
  "schema_version": 1
}
```

### 3.4 정적 데이터: holidays.json (2026~2030 전체)

`public/holidays.json` (앱과 함께 배포되는 정적 파일):

```json
{
  "2026-01-01": { "name": "신정", "type": "legal" },
  "2026-02-16": { "name": "설날", "type": "legal" },
  "2026-02-17": { "name": "설날", "type": "legal" },
  "2026-02-18": { "name": "설날", "type": "legal" },
  "2026-03-01": { "name": "삼일절", "type": "legal" },
  "2026-03-02": { "name": "삼일절 대체공휴일", "type": "alternative" },
  "2026-05-01": { "name": "노동절", "type": "legal" },
  "2026-05-05": { "name": "어린이날", "type": "legal" },
  "2026-05-24": { "name": "부처님오신날", "type": "legal" },
  "2026-05-25": { "name": "부처님오신날 대체공휴일", "type": "alternative" },
  "2026-06-06": { "name": "현충일", "type": "legal" },
  "2026-08-15": { "name": "광복절", "type": "legal" },
  "2026-08-17": { "name": "광복절 대체공휴일", "type": "alternative" },
  "2026-09-24": { "name": "추석", "type": "legal" },
  "2026-09-25": { "name": "추석", "type": "legal" },
  "2026-09-26": { "name": "추석", "type": "legal" },
  "2026-10-03": { "name": "개천절", "type": "legal" },
  "2026-10-05": { "name": "개천절 대체공휴일", "type": "alternative" },
  "2026-10-09": { "name": "한글날", "type": "legal" },
  "2026-12-25": { "name": "성탄절", "type": "legal" },

  "2027-01-01": { "name": "신정", "type": "legal" },
  "2027-02-06": { "name": "설날", "type": "legal" },
  "2027-02-07": { "name": "설날", "type": "legal" },
  "2027-02-08": { "name": "설날", "type": "legal" },
  "2027-02-09": { "name": "설날 대체공휴일", "type": "alternative" },
  "2027-03-01": { "name": "삼일절", "type": "legal" },
  "2027-05-01": { "name": "노동절", "type": "legal" },
  "2027-05-05": { "name": "어린이날", "type": "legal" },
  "2027-05-13": { "name": "부처님오신날", "type": "legal" },
  "2027-06-06": { "name": "현충일", "type": "legal" },
  "2027-08-15": { "name": "광복절", "type": "legal" },
  "2027-08-16": { "name": "광복절 대체공휴일", "type": "alternative" },
  "2027-09-14": { "name": "추석", "type": "legal" },
  "2027-09-15": { "name": "추석", "type": "legal" },
  "2027-09-16": { "name": "추석", "type": "legal" },
  "2027-10-03": { "name": "개천절", "type": "legal" },
  "2027-10-04": { "name": "개천절 대체공휴일", "type": "alternative" },
  "2027-10-09": { "name": "한글날", "type": "legal" },
  "2027-10-11": { "name": "한글날 대체공휴일", "type": "alternative" },
  "2027-12-25": { "name": "성탄절", "type": "legal" },

  "2028-01-01": { "name": "신정", "type": "legal" },
  "2028-01-26": { "name": "설날", "type": "legal" },
  "2028-01-27": { "name": "설날", "type": "legal" },
  "2028-01-28": { "name": "설날", "type": "legal" },
  "2028-03-01": { "name": "삼일절", "type": "legal" },
  "2028-05-01": { "name": "노동절", "type": "legal" },
  "2028-05-02": { "name": "부처님오신날", "type": "legal" },
  "2028-05-05": { "name": "어린이날", "type": "legal" },
  "2028-06-06": { "name": "현충일", "type": "legal" },
  "2028-08-15": { "name": "광복절", "type": "legal" },
  "2028-10-02": { "name": "추석", "type": "legal" },
  "2028-10-03": { "name": "개천절", "type": "legal" },
  "2028-10-04": { "name": "추석", "type": "legal" },
  "2028-10-05": { "name": "추석", "type": "legal" },
  "2028-10-09": { "name": "한글날", "type": "legal" },
  "2028-12-25": { "name": "성탄절", "type": "legal" },

  "2029-01-01": { "name": "신정", "type": "legal" },
  "2029-02-12": { "name": "설날", "type": "legal" },
  "2029-02-13": { "name": "설날", "type": "legal" },
  "2029-02-14": { "name": "설날", "type": "legal" },
  "2029-03-01": { "name": "삼일절", "type": "legal" },
  "2029-05-01": { "name": "노동절", "type": "legal" },
  "2029-05-05": { "name": "어린이날", "type": "legal" },
  "2029-05-07": { "name": "어린이날 대체공휴일", "type": "alternative" },
  "2029-05-20": { "name": "부처님오신날", "type": "legal" },
  "2029-05-21": { "name": "부처님오신날 대체공휴일", "type": "alternative" },
  "2029-06-06": { "name": "현충일", "type": "legal" },
  "2029-08-15": { "name": "광복절", "type": "legal" },
  "2029-09-21": { "name": "추석", "type": "legal" },
  "2029-09-22": { "name": "추석", "type": "legal" },
  "2029-09-23": { "name": "추석", "type": "legal" },
  "2029-09-24": { "name": "추석 대체공휴일", "type": "alternative" },
  "2029-10-03": { "name": "개천절", "type": "legal" },
  "2029-10-09": { "name": "한글날", "type": "legal" },
  "2029-12-25": { "name": "성탄절", "type": "legal" },

  "2030-01-01": { "name": "신정", "type": "legal" },
  "2030-02-02": { "name": "설날", "type": "legal" },
  "2030-02-03": { "name": "설날", "type": "legal" },
  "2030-02-04": { "name": "설날", "type": "legal" },
  "2030-03-01": { "name": "삼일절", "type": "legal" },
  "2030-05-01": { "name": "노동절", "type": "legal" },
  "2030-05-05": { "name": "어린이날", "type": "legal" },
  "2030-05-06": { "name": "어린이날 대체공휴일", "type": "alternative" },
  "2030-05-09": { "name": "부처님오신날", "type": "legal" },
  "2030-06-06": { "name": "현충일", "type": "legal" },
  "2030-08-15": { "name": "광복절", "type": "legal" },
  "2030-09-11": { "name": "추석", "type": "legal" },
  "2030-09-12": { "name": "추석", "type": "legal" },
  "2030-09-13": { "name": "추석", "type": "legal" },
  "2030-10-03": { "name": "개천절", "type": "legal" },
  "2030-10-09": { "name": "한글날", "type": "legal" },
  "2030-12-25": { "name": "성탄절", "type": "legal" }
}
```

> **주의 (v3.3 갱신)**:
> - 임시공휴일(국가 지정)·지방선거일은 위 정적 파일에 포함되어 있지 않음. 출시 직전 또는 발표 즉시 추가 필요.
> - 예: 2026-06-03 지방선거일(공직선거법 제34조에 따른 임기 만료 선거)은 공휴일이지만 위 데이터에 미포함.
> - 위 데이터는 한국천문연구원 공식 음력→양력 변환 + 법정공휴일 시행령 기준이며, 출시 전 각 연도별 정부 공식 발표를 한 번 더 검증할 것.
> - 임시공휴일 추가 시: 단순히 holidays.json에 한 줄 추가 후 앱 재배포 (사용자 데이터 영향 없음).

### 3.5 정적 데이터: 기본 카테고리 9개

`src/constants/categories.js`:

> **저장 정책 (v3.2 확정)**:
> - 기본 카테고리: `id === name` (예: `"체험학습"`)
> - 사용자 정의 카테고리: 별도 ID(`cat_xxxxxx`)를 부여하지만, **임시 항목에 저장될 때는 이름을 저장한다**.
> - 따라서 `ExtraItem.category`에는 항상 카테고리 이름(name)만 들어간다.
> - 이유: ID로 저장하면 사용자가 카테고리를 삭제했을 때 임시 항목의 표시가 깨짐. 이름으로 저장하면 카테고리가 삭제되어도 임시 항목은 그대로 표시됨.

```javascript
// src/constants/categories.js

/**
 * 임시 항목 기본 카테고리 (시스템 제공)
 * 사용자가 직접 삭제·수정 불가, 사용자 정의 카테고리는 별도 (custom_categories_v1)
 *
 * 정책: id === name (사용자가 보는 텍스트가 곧 식별자)
 * 임시 항목의 category 필드에는 이 name이 그대로 저장됨.
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
 * 카테고리 이름으로 아이콘 조회 (v3.2 단순화)
 *
 * 조회 순서:
 * 1. 기본 카테고리에서 name 일치
 * 2. 사용자 정의에서 name 일치
 * 3. 둘 다 없으면 ✨ (기타) — 카테고리가 삭제된 경우
 *
 * 주의: ID 호환 검색 제거. ExtraItem.category는 항상 name이라는 정책 (v3.2)
 *
 * @param {string} categoryName - 카테고리 이름 (예: "체험학습", "동아리 회비")
 * @param {CustomCategory[]} customCategories
 * @returns {string} 이모지
 */
export function getCategoryIcon(categoryName, customCategories = []) {
  if (!categoryName) return "✨";

  // 1. 기본 카테고리
  const def = DEFAULT_CATEGORIES.find(c => c.name === categoryName);
  if (def) return def.icon;

  // 2. 사용자 정의 카테고리
  const custom = customCategories.find(c => c.name === categoryName);
  if (custom) return custom.icon;

  // 3. fallback (삭제된 카테고리 등)
  return "✨";
}

/**
 * 사용자 정의 카테고리 추가 시 자주 쓰이는 이모지 (S-105 모달)
 */
export const COMMON_EMOJIS = [
  "🎵", "🏃", "🎨", "🎮", "⚽", "🎬", "📷", "🎤",
  "🌿", "🐱", "☕", "🍔", "🚗", "✈️", "🎂", "🎃",
  "📝", "📐", "🎒", "📚", "✂️", "🖌️",
  "👕", "👟", "🧢", "🧥",
  "💊", "🩹", "🦷",
  "🎁", "🎉", "💰", "✨"
];
```

### 3.6 정적 데이터: 경기버스 요금표

`src/constants/fares.js`:

```javascript
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
      highlighted: true   // ★ 강조 (Hex님 자녀 기준)
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
```

### 3.7 데이터 무결성 규칙

| 규칙 | 설명 |
|---|---|
| **버전 호환성** | 모든 키에 `version` 필드 필수, 호환 안 될 시 마이그레이션 |
| **타임스탬프** | 모든 created_at/updated_at은 ISO 8601 UTC |
| **금액** | 모든 금액은 정수 (원 단위), 음수 불가, 부동소수점 사용 안 함 |
| **날짜 형식** | "YYYY-MM-DD" 통일 (시간 부분 없음) |
| **시간대 (TZ)** | 화면 표시 = 사용자 로컬 시간 (KST 가정), 저장 = UTC ISO 8601 |
| **ID 생성** | prefix + nanoid(6) (예: `ex_a3f9k2`, `cat_d5h1m4`) |
| **NULL 처리** | 빈 문자열은 NULL 아님, undefined는 키 미존재 |

### 3.8 데이터 크기 추정

| 항목 | 크기 | 비고 |
|---|---|---|
| settings_v1 | ~500 bytes | 1회 |
| calendar_v1_YYYY_MM 평균 | ~2 KB | 월별, 임시항목 5개 가정 |
| custom_categories_v1 | ~500 bytes | |
| meta_v1 | ~200 bytes | |
| **12개월 누적** | **~25 KB** | 1년치 |
| **로컬스토리지 한도** | **5~10 MB** | 브라우저별 |

→ 1단계에서 한도 도달 가능성 0%

---
## 4. 1단계 비즈니스 로직 (실제 동작 코드)

이 장은 **개발자가 그대로 복사해 쓸 수 있는 수준의 실제 코드**를 담는다. 의사 코드가 아니다.

### 4.1 청구액 계산 (calculator.js)

```javascript
// src/utils/calculator.js

/**
 * 한 달치 청구액 계산
 *
 * @param {number} year - 2024~2099
 * @param {number} month - 1~12
 * @param {Settings_v1} settings - 자녀 기본 설정
 * @param {CalendarMonth_v1} calendar - 해당 월 캘린더 (없으면 빈 객체)
 * @param {Holidays} holidays - 한국 공휴일 데이터
 * @returns {AllowanceCalculation}
 */
export function calculateMonthlyAllowance(year, month, settings, calendar, holidays) {
  if (!settings) {
    throw new Error("settings is required");
  }
  if (year < 2024 || year > 2099) {
    throw new Error(`Invalid year: ${year}`);
  }
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }

  let school_total = 0;
  let school_days_count = 0;
  let academy_total = 0;
  let academy_days_count = 0;
  let extra_items_total = 0;
  const cells = [];

  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(year, month, day);
    const weekday = getWeekday(year, month, day);
    const holidayInfo = holidays[date];
    const is_holiday = holidayInfo !== undefined;
    const holiday_name = holidayInfo?.name ?? null;

    // 학교
    let school_fee = 0;
    if (settings.school.days.includes(weekday)) {
      if (!is_holiday || settings.school.holiday_attend) {
        const multiplier = settings.school.round_trip ? 2 : 1;
        school_fee = settings.school.fare * multiplier;
        school_total += school_fee;
        school_days_count++;
      }
    }

    // 학원
    let academy_fee = 0;
    if (settings.academy.days.includes(weekday)) {
      if (!is_holiday || settings.academy.holiday_attend) {
        const multiplier = settings.academy.round_trip ? 2 : 1;
        academy_fee = settings.academy.fare * multiplier;
        academy_total += academy_fee;
        academy_days_count++;
      }
    }

    // 임시 항목
    const cellData = calendar?.cells?.[date];
    const extra_items = cellData?.extra_items ?? [];
    const memo = cellData?.memo ?? "";
    const cell_extra_total = extra_items.reduce((sum, item) => sum + item.amount, 0);
    extra_items_total += cell_extra_total;

    cells.push({
      date,
      weekday,
      is_holiday,
      holiday_name,
      school_fee,
      academy_fee,
      extra_items,
      memo,
      total: school_fee + academy_fee + cell_extra_total
    });
  }

  const total = settings.base_allowance + school_total + academy_total + extra_items_total;

  return {
    base_allowance: settings.base_allowance,
    school_total,
    school_days_count,
    academy_total,
    academy_days_count,
    extra_items_total,
    total,
    cells
  };
}

/**
 * "YYYY-MM-DD" 형식 날짜 문자열 생성
 */
export function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * 요일 키 반환 ("mon" | "tue" | ...)
 *
 * 시간대 정책 (v3.2 명시):
 * - `new Date(year, month - 1, day)`는 브라우저 로컬 시간대에서 해당 날짜의 00:00을 의미한다.
 * - 1단계는 한국 내 단일 사용자 사용 전제이므로 브라우저 로컬 시간대 = KST 가정.
 * - day-of-week는 시간대 변동에 영향받지 않으므로 안전 (KST 자정 = UTC 15시 전날, 그러나 .getDay()는 로컬 기준).
 * - 사용자가 비행기로 시간대 다른 곳에서 접속해도 동일하게 동작 (year/month/day가 입력 기준).
 *
 * 향후 다국가 지원 시: 명시적 KST 변환 필요 (3단계 이후).
 */
export function getWeekday(year, month, day) {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date(year, month - 1, day).getDay()];
}

/**
 * 한국어 요일 표시
 */
export function getWeekdayKor(weekday) {
  const map = { sun: "일", mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토" };
  return map[weekday] || weekday;
}

/**
 * 계산 결과 검증 (개발 단계 디버그용)
 */
export function validateCalculation(calc) {
  const errors = [];

  if (calc.total < 0) errors.push("합계가 음수");
  if (calc.school_days_count > 31) errors.push("학교 등교일 비정상");
  if (calc.academy_days_count > 31) errors.push("학원 등원일 비정상");

  const computed = calc.base_allowance + calc.school_total + calc.academy_total + calc.extra_items_total;
  if (computed !== calc.total) errors.push(`합계 불일치: ${computed} !== ${calc.total}`);

  return { valid: errors.length === 0, errors };
}
```

### 4.2 청구액 계산 단위 테스트

```javascript
// src/utils/calculator.test.js
import { describe, it, expect } from "vitest";
import { calculateMonthlyAllowance, getWeekday, validateCalculation } from "./calculator";

const TEST_SETTINGS = {
  child_name: "자녀A",
  school: { days: ["mon", "tue", "wed", "thu", "fri"], fare: 1160, round_trip: true, holiday_attend: false },
  academy: { days: ["wed", "fri"], fare: 1160, round_trip: true, holiday_attend: true },
  base_allowance: 80000,
  created_at: "2026-04-01T00:00:00.000Z",
  updated_at: "2026-04-01T00:00:00.000Z",
  version: 1
};

const TEST_HOLIDAYS_2026_05 = {
  "2026-05-01": { name: "노동절", type: "legal" },
  "2026-05-05": { name: "어린이날", type: "legal" },
  "2026-05-24": { name: "부처님오신날", type: "legal" },
  "2026-05-25": { name: "부처님오신날 대체공휴일", type: "alternative" }
};

describe("calculateMonthlyAllowance", () => {
  it("기본 케이스: 2026년 5월 (Hex 자녀A 기준)", () => {
    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, { cells: {} }, TEST_HOLIDAYS_2026_05);

    // 5월 평일 학교 등교일 (월~금, 공휴일 제외):
    // - 5/1(금, 노동절, 등교X)
    // - 5/5(화, 어린이날, 등교X)
    // - 5/24(일, 부처님오신날, 원래 일요일이라 학교 day 아님)
    // - 5/25(월, 부처님오신날 대체공휴일, 등교X)
    // 학교 등교일 = 평일 21일 - 공휴일 3일(1, 5, 25) = 18일
    expect(calc.school_days_count).toBe(18);
    expect(calc.school_total).toBe(1160 * 2 * 18); // 41,760

    // 학원 수,금 (공휴일에도 등원, holiday_attend: true):
    // 수: 6, 13, 20, 27 (4일)
    // 금: 1(공휴일), 8, 15, 22, 29 (5일)
    // 총 9일
    expect(calc.academy_days_count).toBe(9);
    expect(calc.academy_total).toBe(1160 * 2 * 9); // 20,880

    expect(calc.base_allowance).toBe(80000);
    expect(calc.extra_items_total).toBe(0);
    expect(calc.total).toBe(80000 + 41760 + 20880); // 142,640
  });

  it("임시 항목이 있는 케이스", () => {
    const calendar = {
      year: 2026, month: 5,
      cells: {
        "2026-05-14": {
          extra_items: [{ id: "ex_001", category: "체험학습", name: "박물관", amount: 8000, created_at: "2026-05-10T00:00:00.000Z" }],
          memo: "박물관 단체 관람"
        }
      },
      created_at: "2026-05-01T00:00:00.000Z",
      updated_at: "2026-05-10T00:00:00.000Z",
      version: 1
    };

    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, calendar, TEST_HOLIDAYS_2026_05);
    expect(calc.extra_items_total).toBe(8000);
    expect(calc.total).toBe(142640 + 8000); // 150,640
  });

  it("학원 없는 가정", () => {
    const settings = { ...TEST_SETTINGS, academy: { days: [], fare: 0, round_trip: true, holiday_attend: false } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, TEST_HOLIDAYS_2026_05);
    expect(calc.academy_total).toBe(0);
    expect(calc.academy_days_count).toBe(0);
    expect(calc.total).toBe(80000 + 41760); // 121,760
  });

  it("공휴일 등교 설정", () => {
    const settings = { ...TEST_SETTINGS, school: { ...TEST_SETTINGS.school, holiday_attend: true } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, TEST_HOLIDAYS_2026_05);
    // 5/1(금)+5/5(화) 추가 → 학교 일수 20일
    expect(calc.school_days_count).toBe(20);
  });

  it("편도 설정", () => {
    const settings = { ...TEST_SETTINGS, school: { ...TEST_SETTINGS.school, round_trip: false } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, TEST_HOLIDAYS_2026_05);
    expect(calc.school_total).toBe(1160 * 1 * 18); // 20,880
  });

  it("윤년 2월 29일", () => {
    const calc = calculateMonthlyAllowance(2028, 2, TEST_SETTINGS, { cells: {} }, {});
    expect(calc.cells.length).toBe(29); // 2028년은 윤년
  });

  it("31일 짜리 달", () => {
    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, { cells: {} }, TEST_HOLIDAYS_2026_05);
    expect(calc.cells.length).toBe(31);
  });

  it("존재하지 않는 settings → 에러", () => {
    expect(() => calculateMonthlyAllowance(2026, 5, null, { cells: {} }, {})).toThrow();
  });

  it("범위 외 month → 에러", () => {
    expect(() => calculateMonthlyAllowance(2026, 13, TEST_SETTINGS, { cells: {} }, {})).toThrow();
    expect(() => calculateMonthlyAllowance(2026, 0, TEST_SETTINGS, { cells: {} }, {})).toThrow();
  });

  it("validateCalculation 정상", () => {
    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, { cells: {} }, TEST_HOLIDAYS_2026_05);
    const v = validateCalculation(calc);
    expect(v.valid).toBe(true);
  });
});

describe("getWeekday", () => {
  it("2026-05-04는 월요일", () => {
    expect(getWeekday(2026, 5, 4)).toBe("mon");
  });
  it("2026-05-01는 금요일", () => {
    expect(getWeekday(2026, 5, 1)).toBe("fri");
  });
  it("2026-05-03은 일요일", () => {
    expect(getWeekday(2026, 5, 3)).toBe("sun");
  });
});
```

### 4.3 메시지 템플릿 생성 (messageTemplate.js)

```javascript
// src/utils/messageTemplate.js
import { getCategoryIcon } from "../constants/categories";

/**
 * 청구 메시지 생성 (카톡 복사용)
 *
 * @param {number} year
 * @param {number} month
 * @param {AllowanceCalculation} calc
 * @param {Settings_v1} settings
 * @param {Holidays} holidays
 * @param {CustomCategory[]} customCategories
 * @returns {string} 카톡 붙여넣기용 메시지
 */
export function generateMessage(year, month, calc, settings, holidays, customCategories = []) {
  const lines = [];

  // 헤더
  if (settings.child_name && settings.child_name.trim()) {
    lines.push(`📅 ${settings.child_name} ${year}년 ${month}월 용돈 청구`);
  } else {
    lines.push(`📅 ${year}년 ${month}월 용돈 청구`);
  }
  lines.push("");

  // 기본 용돈
  if (calc.base_allowance > 0) {
    lines.push(`💰 기본 용돈           ${formatCurrency(calc.base_allowance)}원`);
    lines.push(`   = ${formatNumber(calc.base_allowance)} × 1`);
    lines.push("");
  }

  // 학교 버스
  if (calc.school_total > 0) {
    const tripText = settings.school.round_trip ? "왕복" : "편도";
    const multiplier = settings.school.round_trip ? 2 : 1;
    lines.push(`🏫 학교 버스비         ${formatCurrency(calc.school_total)}원`);
    lines.push(`   = ${formatNumber(settings.school.fare)} × ${multiplier}(${tripText}) × ${calc.school_days_count}일`);
    lines.push("");
  }

  // 학원 버스
  if (calc.academy_total > 0) {
    const tripText = settings.academy.round_trip ? "왕복" : "편도";
    const multiplier = settings.academy.round_trip ? 2 : 1;
    lines.push(`📚 학원 버스비         ${formatCurrency(calc.academy_total)}원`);
    lines.push(`   = ${formatNumber(settings.academy.fare)} × ${multiplier}(${tripText}) × ${calc.academy_days_count}일`);
    lines.push("");
  }

  // 임시 항목 (날짜순 정렬)
  const allExtras = [];
  calc.cells.forEach(c => {
    c.extra_items.forEach(item => {
      allExtras.push({ ...item, date: c.date });
    });
  });
  allExtras.sort((a, b) => a.date.localeCompare(b.date));

  if (allExtras.length > 0) {
    allExtras.forEach(item => {
      const dateText = formatDateShort(item.date);
      const icon = getCategoryIcon(item.category, customCategories);
      lines.push(`${icon} ${item.name} (${dateText})    ${formatCurrency(item.amount)}원`);
    });
    lines.push("");
  }

  // 구분선 + 합계
  lines.push("─".repeat(30));
  lines.push(`합계                  ${formatCurrency(calc.total)}원`);

  // 비고: 공휴일
  const monthHolidays = getHolidaysInMonth(year, month, holidays);
  if (monthHolidays.length > 0) {
    lines.push("");
    const text = monthHolidays
      .map(h => `${parseInt(h.date.split("-")[2])}일(${h.name})`)
      .join(", ");
    lines.push(`※ ${month}월 공휴일: ${text}`);
  }

  return lines.join("\n");
}

function formatCurrency(n) {
  return n.toLocaleString("ko-KR");
}

function formatNumber(n) {
  return n.toLocaleString("ko-KR");
}

function formatDateShort(dateStr) {
  const [, month, day] = dateStr.split("-");
  return `${parseInt(month)}/${parseInt(day)}`;
}

function getHolidaysInMonth(year, month, holidays) {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return Object.entries(holidays)
    .filter(([date]) => date.startsWith(prefix))
    .map(([date, info]) => ({ date, name: info.name }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
```

### 4.4 메시지 출력 예시 (Hex님 자녀A 2026년 5월)

> **시나리오**: 학교 18일 + 학원 9일 + **5/14 박물관 체험비 8,000원 1건 추가 등록 후** 메시지 복사.
> (4.5 단위 테스트의 첫 케이스는 임시 항목 0건 → 합계 142,640원으로 다른 시나리오)

```
📅 자녀A 2026년 5월 용돈 청구

💰 기본 용돈           80,000원
   = 80,000 × 1

🏫 학교 버스비         41,760원
   = 1,160 × 2(왕복) × 18일

📚 학원 버스비         20,880원
   = 1,160 × 2(왕복) × 9일

🎒 박물관 체험비 (5/14)    8,000원

──────────────────────────────
합계                  150,640원

※ 5월 공휴일: 1일(노동절), 5일(어린이날), 24일(부처님오신날), 25일(부처님오신날 대체공휴일)
```

### 4.5 메시지 단위 테스트

```javascript
// src/utils/messageTemplate.test.js
import { describe, it, expect } from "vitest";
import { generateMessage } from "./messageTemplate";
import { calculateMonthlyAllowance } from "./calculator";

const TEST_SETTINGS = {
  child_name: "자녀A",
  school: { days: ["mon","tue","wed","thu","fri"], fare: 1160, round_trip: true, holiday_attend: false },
  academy: { days: ["wed","fri"], fare: 1160, round_trip: true, holiday_attend: true },
  base_allowance: 80000,
  created_at: "2026-04-01T00:00:00.000Z",
  updated_at: "2026-04-01T00:00:00.000Z",
  version: 1
};

const TEST_HOLIDAYS_2026_05 = {
  "2026-05-01": { name: "노동절", type: "legal" },
  "2026-05-05": { name: "어린이날", type: "legal" },
  "2026-05-24": { name: "부처님오신날", type: "legal" },
  "2026-05-25": { name: "부처님오신날 대체공휴일", type: "alternative" }
};

describe("generateMessage", () => {
  it("기본 케이스: 모든 항목 포함", () => {
    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, { cells: {} }, TEST_HOLIDAYS_2026_05);
    const msg = generateMessage(2026, 5, calc, TEST_SETTINGS, TEST_HOLIDAYS_2026_05);

    expect(msg).toContain("📅 자녀A 2026년 5월 용돈 청구");
    expect(msg).toContain("💰 기본 용돈");
    expect(msg).toContain("80,000원");
    expect(msg).toContain("🏫 학교 버스비");
    expect(msg).toContain("📚 학원 버스비");
    expect(msg).toContain("합계                  142,640원");
    // 공휴일 4건 (노동절·어린이날·부처님오신날·대체공휴일)
    expect(msg).toContain("1일(노동절)");
    expect(msg).toContain("5일(어린이날)");
    expect(msg).toContain("24일(부처님오신날)");
    expect(msg).toContain("25일(부처님오신날 대체공휴일)");
  });

  it("자녀 이름 없으면 생략", () => {
    const settings = { ...TEST_SETTINGS, child_name: "" };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, TEST_HOLIDAYS_2026_05);
    const msg = generateMessage(2026, 5, calc, settings, TEST_HOLIDAYS_2026_05);
    expect(msg).toContain("📅 2026년 5월 용돈 청구");
    expect(msg).not.toContain("자녀A");
  });

  it("학원 없으면 학원 행 생략", () => {
    const settings = { ...TEST_SETTINGS, academy: { days: [], fare: 0, round_trip: true, holiday_attend: false } };
    const calc = calculateMonthlyAllowance(2026, 5, settings, { cells: {} }, TEST_HOLIDAYS_2026_05);
    const msg = generateMessage(2026, 5, calc, settings, TEST_HOLIDAYS_2026_05);
    expect(msg).not.toContain("📚 학원 버스비");
  });

  it("공휴일 없는 달은 비고 생략", () => {
    const calc = calculateMonthlyAllowance(2026, 4, TEST_SETTINGS, { cells: {} }, {});
    const msg = generateMessage(2026, 4, calc, TEST_SETTINGS, {});
    expect(msg).not.toContain("※");
  });

  it("임시 항목 다수 + 날짜순 정렬", () => {
    const calendar = {
      year: 2026, month: 5,
      cells: {
        "2026-05-19": { extra_items: [{ id: "x", category: "수련회", name: "회비", amount: 50000, created_at: "" }], memo: "" },
        "2026-05-14": { extra_items: [{ id: "y", category: "체험학습", name: "박물관", amount: 8000, created_at: "" }], memo: "" }
      },
      created_at: "", updated_at: "", version: 1
    };
    const calc = calculateMonthlyAllowance(2026, 5, TEST_SETTINGS, calendar, TEST_HOLIDAYS_2026_05);
    const msg = generateMessage(2026, 5, calc, TEST_SETTINGS, TEST_HOLIDAYS_2026_05);

    // 14일이 19일보다 먼저 와야 함
    const idx14 = msg.indexOf("5/14");
    const idx19 = msg.indexOf("5/19");
    expect(idx14).toBeLessThan(idx19);
  });
});
```

### 4.6 스토리지 헬퍼 (storage.js)

```javascript
// src/utils/storage.js

const KEYS = {
  SETTINGS: "settings_v1",
  CALENDAR: (year, month) => `calendar_v1_${year}_${String(month).padStart(2, "0")}`,
  CUSTOM_CATEGORIES: "custom_categories_v1",
  META: "meta_v1"
};

/**
 * 일반 set 추상화 (에러 코드 반환)
 * @returns {{ success: boolean, error?: string }}
 */
function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { success: true };
  } catch (e) {
    if (e.name === "QuotaExceededError") return { success: false, error: "QUOTA_EXCEEDED" };
    return { success: false, error: "WRITE_ERROR" };
  }
}

/**
 * 일반 get 추상화 (손상 시 자동 백업 후 null 반환)
 */
function safeGet(key) {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    backupCorrupted(key);
    return null;
  }
}

function backupCorrupted(key) {
  const value = localStorage.getItem(key);
  if (!value) return;
  const backupKey = `${key}_corrupted_${Date.now()}`;
  localStorage.setItem(backupKey, value);
  localStorage.removeItem(key);
}

// ──────────────────────────────────────
// settings_v1
// ──────────────────────────────────────
export function loadSettings() {
  return safeGet(KEYS.SETTINGS);
}

export function saveSettings(settings) {
  settings.updated_at = new Date().toISOString();
  return safeSet(KEYS.SETTINGS, settings);
}

// ──────────────────────────────────────
// calendar_v1_YYYY_MM
// ──────────────────────────────────────
export function loadCalendarMonth(year, month) {
  const key = KEYS.CALENDAR(year, month);
  const data = safeGet(key);
  if (data) return data;
  return {
    year, month,
    cells: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  };
}

export function saveCalendarMonth(calendar) {
  const key = KEYS.CALENDAR(calendar.year, calendar.month);
  calendar.updated_at = new Date().toISOString();
  return safeSet(key, calendar);
}

// ──────────────────────────────────────
// custom_categories_v1
// ──────────────────────────────────────
export function loadCustomCategories() {
  const data = safeGet(KEYS.CUSTOM_CATEGORIES);
  return data?.categories ?? [];
}

export function saveCustomCategories(categories) {
  return safeSet(KEYS.CUSTOM_CATEGORIES, { categories, version: 1 });
}

// ──────────────────────────────────────
// meta_v1
// ──────────────────────────────────────
export function loadMeta() {
  return safeGet(KEYS.META);
}

export function saveMeta(meta) {
  return safeSet(KEYS.META, meta);
}

export function initMetaIfNeeded() {
  if (!loadMeta()) {
    saveMeta({
      first_used_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      current_view_month: getTodayYearMonth(),
      app_version: "1.0.0",
      schema_version: 1
    });
  }
}

function getTodayYearMonth() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
}

// ──────────────────────────────────────
// 정리·관리 함수
// ──────────────────────────────────────
export function listAllAppKeys() {
  return Object.keys(localStorage).filter(k =>
    k === KEYS.SETTINGS ||
    k === KEYS.CUSTOM_CATEGORIES ||
    k === KEYS.META ||
    k.startsWith("calendar_v1_") ||
    k.includes("_corrupted_")
  );
}

/**
 * 오래된 캘린더 정리 (스토리지 가득 시 호출)
 *
 * 정책 (v3.2 Date 객체 비교로 변경):
 * - "오늘 - retainMonths개월" 시점보다 이전인 캘린더를 삭제
 * - 미래 캘린더는 절대 삭제하지 않음 (사용자가 미리 입력해둔 데이터 보호)
 * - 키를 정규식으로 파싱하여 Date 객체로 비교 (문자열 비교의 잠재적 사이드 이펙트 제거)
 *
 * 예: 오늘 2026-05, retainMonths=6
 *     → start = 2025-11-01
 *     → 2025-10 이전 삭제 (2025-11부터 7개월치 보존, 미래 무제한 보존)
 *
 * @param {number} retainMonths - 오늘 - N개월 시점을 보존 시작점으로
 * @returns {{ deletedCount: number, deletedKeys: string[] }}
 */
export function cleanupOldCalendars(retainMonths = 6) {
  const now = new Date();
  // 보존 시작 = 오늘 - retainMonths개월 (1일)
  const start = new Date(now.getFullYear(), now.getMonth() - retainMonths, 1);

  const toDelete = Object.keys(localStorage).filter(k => {
    if (!k.startsWith("calendar_v1_")) return false;
    const match = k.match(/^calendar_v1_(\d{4})_(\d{2})$/);
    if (!match) return false;
    const keyDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1);
    // keyDate가 start보다 이전이면 삭제 (Date 객체 비교 — 연도 경계 안전)
    return keyDate < start;
  });

  toDelete.forEach(k => localStorage.removeItem(k));
  return { deletedCount: toDelete.length, deletedKeys: toDelete };
}

export function resetAllData() {
  listAllAppKeys().forEach(k => localStorage.removeItem(k));
}

export function getStorageUsage() {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    used += key.length + (localStorage.getItem(key)?.length ?? 0);
  }
  const TOTAL = 5 * 1024 * 1024;
  return { used, total: TOTAL, percent: (used / TOTAL) * 100 };
}

/**
 * 로컬스토리지 사용 가능 여부 검사
 * 시크릿 모드 (특히 사파리) 또는 브라우저 정책으로 비활성된 경우 감지.
 *
 * @returns {boolean}
 */
export function isStorageAvailable() {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "x");
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}
```

#### 4.6.1 스토리지 단위 테스트 (storage.test.js) — v3.1 신규

`cleanupOldCalendars`의 미래 캘린더 보호 정책을 보장하는 회귀 테스트.

```javascript
// src/utils/storage.test.js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { cleanupOldCalendars } from "./storage";

describe("cleanupOldCalendars", () => {
  beforeEach(() => {
    localStorage.clear();
    // 오늘을 2026-05-15로 고정
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 15));
  });

  it("retainMonths=6: 오늘 2026-05 → 2025-11부터 유지, 2025-10 이전 삭제", () => {
    // setup
    [
      "calendar_v1_2025_06", "calendar_v1_2025_10", "calendar_v1_2025_11",
      "calendar_v1_2025_12", "calendar_v1_2026_01", "calendar_v1_2026_05"
    ].forEach(k => localStorage.setItem(k, "{}"));

    const r = cleanupOldCalendars(6);

    // start = 2025-11-01, 2025-11 이전(2025-06, 2025-10) 삭제
    expect(r.deletedCount).toBe(2);
    expect(r.deletedKeys.sort()).toEqual([
      "calendar_v1_2025_06", "calendar_v1_2025_10"
    ]);
    expect(localStorage.getItem("calendar_v1_2025_11")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2025_12")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2026_05")).not.toBeNull();
  });

  it("미래 캘린더 절대 보호 (Critical 회귀 테스트)", () => {
    [
      "calendar_v1_2026_06",  // 미래
      "calendar_v1_2026_07",  // 미래
      "calendar_v1_2027_04",  // 1년 후
      "calendar_v1_2030_12"   // 4년 후
    ].forEach(k => localStorage.setItem(k, "{}"));

    const r = cleanupOldCalendars(6);

    expect(r.deletedCount).toBe(0);
    expect(localStorage.getItem("calendar_v1_2026_06")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2027_04")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2030_12")).not.toBeNull();
  });

  it("연도 경계 (오늘 2026-01 + retainMonths=6 → 2025-07부터 유지)", () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    [
      "calendar_v1_2025_06", "calendar_v1_2025_07",
      "calendar_v1_2025_08", "calendar_v1_2026_01"
    ].forEach(k => localStorage.setItem(k, "{}"));

    const r = cleanupOldCalendars(6);

    // start = 2025-07-01, 2025-06 삭제, 2025-07부터 유지
    expect(r.deletedKeys).toEqual(["calendar_v1_2025_06"]);
    expect(localStorage.getItem("calendar_v1_2025_07")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2026_01")).not.toBeNull();
  });

  it("연도 2회 경계 (오늘 2026-03 + retainMonths=18 → 2024-09부터 유지)", () => {
    vi.setSystemTime(new Date(2026, 2, 15));
    [
      "calendar_v1_2024_06",   // 삭제
      "calendar_v1_2024_08",   // 삭제 (경계 한 칸 앞)
      "calendar_v1_2024_09",   // 유지
      "calendar_v1_2025_01",
      "calendar_v1_2026_03"
    ].forEach(k => localStorage.setItem(k, "{}"));

    const r = cleanupOldCalendars(18);

    expect(r.deletedKeys.sort()).toEqual([
      "calendar_v1_2024_06", "calendar_v1_2024_08"
    ]);
    expect(localStorage.getItem("calendar_v1_2024_09")).not.toBeNull();
  });

  it("settings/categories/meta는 영향 없음", () => {
    localStorage.setItem("settings_v1", "{}");
    localStorage.setItem("custom_categories_v1", "{}");
    localStorage.setItem("meta_v1", "{}");
    localStorage.setItem("calendar_v1_2020_01", "{}");

    cleanupOldCalendars(6);

    expect(localStorage.getItem("settings_v1")).not.toBeNull();
    expect(localStorage.getItem("custom_categories_v1")).not.toBeNull();
    expect(localStorage.getItem("meta_v1")).not.toBeNull();
    expect(localStorage.getItem("calendar_v1_2020_01")).toBeNull();
  });

  it("잘못된 키 형식은 무시", () => {
    localStorage.setItem("calendar_v1_invalid", "{}");
    localStorage.setItem("calendar_v1_2020_99", "{}"); // 99월
    localStorage.setItem("calendar_v1_2020_01", "{}"); // 정상, 삭제 대상

    const r = cleanupOldCalendars(6);

    // 정상 형식만 삭제됨
    expect(r.deletedKeys).toContain("calendar_v1_2020_01");
    expect(localStorage.getItem("calendar_v1_invalid")).not.toBeNull();
  });
});
```

### 4.7 검증 함수 (validators.js)

```javascript
// src/utils/validators.js

/**
 * 자녀 기본 설정 검증
 */
export function validateSettings(form) {
  const errors = {};

  // 자녀 이름
  if (form.child_name && form.child_name.length > 20) {
    errors.child_name = "20자 이내로 입력해주세요";
  }

  // 기본 용돈
  if (!Number.isInteger(form.base_allowance)) {
    errors.base_allowance = "정수로 입력해주세요";
  } else if (form.base_allowance < 0) {
    errors.base_allowance = "0원 이상 입력해주세요";
  } else if (form.base_allowance > 1000000) {
    errors.base_allowance = "1,000,000원 이하로 입력해주세요";
  }

  // 학교 단가 (조건부 검증, v3.2)
  // - days가 0개면 fare는 0이어야 함 (의미 없는 값)
  // - days가 1개+이면 fare는 1~100,000 정수
  if (form.school.days.length === 0) {
    if (!Number.isInteger(form.school.fare) || form.school.fare !== 0) {
      // 자동 보정: days=0이면 fare도 0이어야 함 (UI에서 disabled 상태로 처리)
      // 사용자가 보낸 form이 잘못된 경우만 에러
      if (form.school.fare !== 0 && !Number.isInteger(form.school.fare)) {
        errors["school.fare"] = "정수로 입력해주세요";
      }
    }
  } else {
    if (!Number.isInteger(form.school.fare) || form.school.fare < 1) {
      errors["school.fare"] = "학교 단가를 1원 이상 입력해주세요";
    } else if (form.school.fare > 100000) {
      errors["school.fare"] = "100,000원 이하로 입력해주세요";
    }
  }

  // 학원 단가 (동일 조건부 검증)
  if (form.academy.days.length === 0) {
    if (form.academy.fare !== 0 && !Number.isInteger(form.academy.fare)) {
      errors["academy.fare"] = "정수로 입력해주세요";
    }
  } else {
    if (!Number.isInteger(form.academy.fare) || form.academy.fare < 1) {
      errors["academy.fare"] = "학원 단가를 1원 이상 입력해주세요";
    } else if (form.academy.fare > 100000) {
      errors["academy.fare"] = "100,000원 이하로 입력해주세요";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * 임시 항목 검증
 */
export function validateExtraItem(input) {
  const errors = {};

  if (!input.category || input.category.trim() === "") {
    errors.category = "카테고리를 선택해주세요";
  }

  if (!input.name || input.name.trim() === "") {
    errors.name = "이름을 입력해주세요";
  } else if (input.name.length > 50) {
    errors.name = "50자 이내로 입력해주세요";
  }

  if (!Number.isInteger(input.amount) || input.amount < 1) {
    errors.amount = "금액을 1원 이상 입력해주세요";
  } else if (input.amount > 10000000) {
    errors.amount = "10,000,000원 이하로 입력해주세요";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * 메모 검증 (v3.2: 반환 형식 {valid, errors}로 통일)
 *
 * 시그니처 일관성 안내 (v3.3):
 * - 다른 검증 함수는 `validate*(input)` 객체 인자 형태
 *   예: validateSettings(form), validateExtraItem(input), validateCustomCategory(input)
 * - validateMemo만 단일 string 인자 (memo)
 * - 이유: 메모는 단일 필드 검증이라 객체로 감쌀 의미가 없음
 * - 호출 패턴 통일: const { valid, errors } = validateMemo(draftMemo);
 *   에러 표시: errors.memo (다른 검증 함수와 동일한 키 접근 패턴)
 */
export function validateMemo(memo) {
  const errors = {};
  if (memo.length > 200) {
    errors.memo = "200자 이내로 입력해주세요";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * 사용자 정의 카테고리 검증
 */
export function validateCustomCategory(input, existingCategories = []) {
  const errors = {};

  if (!input.name || input.name.trim() === "") {
    errors.name = "카테고리 이름을 입력해주세요";
  } else if (input.name.length > 20) {
    errors.name = "20자 이내로 입력해주세요";
  } else if (existingCategories.some(c => c.name === input.name.trim())) {
    errors.name = "이미 존재하는 카테고리입니다";
  }

  if (!input.icon || input.icon.trim() === "") {
    errors.icon = "아이콘을 선택해주세요";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
```

### 4.8 ID 생성 (idGenerator.js)

```javascript
// src/utils/idGenerator.js

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export function nanoid(length = 6) {
  let id = "";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    id += ALPHABET[arr[i] % ALPHABET.length];
  }
  return id;
}

export function newExtraItemId() {
  return `ex_${nanoid(6)}`;
}

export function newCategoryId() {
  return `cat_${nanoid(6)}`;
}
```

### 4.9 클립보드 복사 (clipboard.js)

```javascript
// src/utils/clipboard.js

/**
 * 클립보드에 텍스트 복사
 * @returns {Promise<{success: boolean, error?: string, fallbackText?: string}>}
 */
export async function copyToClipboard(text) {
  // 모던 API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (e) {
      return { success: false, error: "CLIPBOARD_DENIED", fallbackText: text };
    }
  }

  // 레거시 폴백 (execCommand)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (ok) return { success: true };
    return { success: false, error: "CLIPBOARD_UNSUPPORTED", fallbackText: text };
  } catch (e) {
    return { success: false, error: "CLIPBOARD_UNSUPPORTED", fallbackText: text };
  }
}
```

### 4.10 앱 부팅 (initApp.js) — v3.1 신규, v3.2 holidays 통합

앱 시작 시 데이터 로드 / 손상 감지 / 환경 검증 / **공휴일 로드**를 수행하고, 다음 화면(메인 또는 안내 모달)을 결정한다.

```javascript
// src/utils/initApp.js
import {
  loadSettings, loadMeta, initMetaIfNeeded,
  isStorageAvailable, listAllAppKeys
} from "./storage";
import { loadHolidays } from "./holidays";

/**
 * 앱 부팅 결과
 * @typedef {Object} BootResult
 * @property {"ok" | "first_use" | "storage_disabled" | "settings_corrupted" | "holidays_failed"} status
 * @property {object} [settings]
 * @property {object} [meta]
 * @property {object} [holidays] — DEPRECATED (v3.3): 하위 컴포넌트는 props로 받지 말고 holidays.js의 getHolidays() 직접 호출 권장. 이 필드는 디버그/검사 용도로만 유지.
 * @property {string[]} [corruptedKeys]
 * @property {string} [error]
 */

/**
 * 앱 부팅 (v3.2: async + holidays.json 로드 포함)
 *
 * holidays 접근 정책 (v3.3 단일화):
 *   - initApp 내부에서 loadHolidays() 1회 호출 → holidays.js 모듈 캐시에 저장됨
 *   - 이후 컴포넌트는 props drill 없이 getHolidays()를 직접 호출
 *   - BootResult.holidays는 디버그 용도로만 반환 (deprecated)
 *
 * 흐름:
 *  1. localStorage 사용 가능 여부 검사 (시크릿 모드 등)
 *  2. holidays.json fetch (실패해도 앱은 동작 — 평일로만 표시)
 *  3. settings_v1 로드
 *     - null + 다른 앱 키도 없음 → 첫 사용 (S-101)
 *     - null + 백업 키 있음 → settings 손상 (S-109)
 *     - 정상 → meta 보장 → ok
 *  4. meta_v1 갱신 (last_used_at)
 *
 * @returns {Promise<BootResult>}
 */
export async function initApp() {
  // 1. 스토리지 사용 가능?
  if (!isStorageAvailable()) {
    return { status: "storage_disabled" };
  }

  // 2. holidays.json 로드 (실패는 fatal 아님)
  let holidays = {};
  try {
    holidays = await loadHolidays();
    // ↑ 이 호출로 holidays.js 모듈 캐시가 채워짐
    // 이후 컴포넌트는 getHolidays() 직접 호출 가능
  } catch (e) {
    // 콘솔 경고만, 앱은 계속 (모든 날을 평일로 처리)
    console.warn("[initApp] holidays.json 로드 실패:", e);
  }

  // 3. settings 로드
  const settings = loadSettings();

  if (!settings) {
    const corruptedKeys = listAllAppKeys().filter(k => k.includes("settings_v1_corrupted_"));
    if (corruptedKeys.length > 0) {
      return { status: "settings_corrupted", corruptedKeys, holidays };
    }
    return { status: "first_use", holidays };
  }

  // 4. meta 보장 + 갱신
  initMetaIfNeeded();
  const meta = loadMeta();
  if (meta) {
    meta.last_used_at = new Date().toISOString();
    try {
      localStorage.setItem("meta_v1", JSON.stringify(meta));
    } catch (e) {
      // 메타 갱신 실패는 무시 (앱 동작에 영향 X)
    }
  }

  return { status: "ok", settings, meta, holidays };
}

/**
 * 부팅 결과를 받아서 표시할 화면 결정
 *
 * @param {BootResult} result
 * @returns {"main" | "welcome_modal" | "storage_disabled_modal" | "corrupted_modal"}
 */
export function nextScreen(result) {
  switch (result.status) {
    case "ok": return "main";
    case "first_use": return "welcome_modal";
    case "storage_disabled": return "storage_disabled_modal";
    case "settings_corrupted": return "corrupted_modal";
    default: return "welcome_modal";
  }
}
```

**메인 컴포넌트 (App.jsx) 부팅 흐름** (v3.3 단일화):

```jsx
// src/components/App.jsx
import { useEffect, useState } from "react";
import { initApp, nextScreen } from "../utils/initApp";

export default function App() {
  const [boot, setBoot] = useState(null);

  useEffect(() => {
    initApp().then(setBoot);
  }, []);

  if (!boot) return <Splash />;  // 1초 미만 부팅 중

  const screen = nextScreen(boot);

  // 정책 (v3.3):
  // - holidays는 props로 전달하지 않음 (BootResult.holidays deprecated)
  // - 하위 컴포넌트가 직접 getHolidays() 호출 (utils/holidays.js)
  // - initApp에서 이미 loadHolidays() 완료된 상태이므로 캐시 hit 보장
  if (screen === "storage_disabled_modal") return <StorageDisabledModal />;
  if (screen === "corrupted_modal") return <DataCorruptedModal corruptedKeys={boot.corruptedKeys} />;
  if (screen === "welcome_modal") return <SettingsModal mode="first" />;
  return <MainScreen settings={boot.settings} />;
}
```

```jsx
// src/components/MainScreen.jsx (예시)
import { getHolidays } from "../utils/holidays";

function MainScreen({ settings }) {
  // props drill 없이 직접 호출 (v3.3 정책)
  const holidays = getHolidays();
  // ... 캘린더 렌더링
}
```

### 4.11 공휴일 로드 (holidays.js) — v3.2 신규

`public/holidays.json` (3.4 데이터)을 fetch해서 전역 캐시에 보관. `calculator.js`, `messageTemplate.js` 가 매번 파일을 다시 읽지 않도록 한다.

```javascript
// src/utils/holidays.js

/**
 * 모듈 내부 캐시 (앱 생애 동안 1회만 로드).
 * SPA 환경이라 새로고침 안 하는 한 캐시 유지.
 */
let _holidays = null;

/**
 * holidays.json 로드 (앱 부팅 시 1회 호출)
 *
 * @returns {Promise<Holidays>}
 * @throws {Error} 네트워크 실패 또는 JSON 파싱 실패 시
 */
export async function loadHolidays() {
  if (_holidays) return _holidays;

  // import.meta.env.BASE_URL: GitHub Pages 서브 경로 (vite.config의 base와 동기화)
  const url = (import.meta.env?.BASE_URL ?? "/") + "holidays.json";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`holidays.json 로드 실패: ${res.status}`);
  }
  _holidays = await res.json();
  return _holidays;
}

/**
 * 캐시된 holidays 즉시 반환 (loadHolidays 이후에만 호출)
 * 컴포넌트 props로 전달받지 않고 utils에서 호출할 때 사용
 *
 * @returns {Holidays}
 * @throws {Error} loadHolidays() 호출 전이면
 */
export function getHolidays() {
  if (!_holidays) {
    throw new Error("loadHolidays()를 먼저 호출하세요");
  }
  return _holidays;
}

/**
 * 테스트용 캐시 리셋
 */
export function _resetHolidaysCache() {
  _holidays = null;
}
```

#### 4.11.1 단위 테스트 (holidays.test.js)

```javascript
// src/utils/holidays.test.js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadHolidays, getHolidays, _resetHolidaysCache } from "./holidays";

describe("holidays.js", () => {
  beforeEach(() => {
    _resetHolidaysCache();
    global.fetch = vi.fn();
  });

  it("loadHolidays: 정상 로드 + 캐시", async () => {
    const sample = { "2026-05-05": { name: "어린이날", type: "legal" } };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sample
    });

    const r1 = await loadHolidays();
    expect(r1).toEqual(sample);

    // 두 번째 호출은 캐시 사용 (fetch 추가 호출 X)
    const r2 = await loadHolidays();
    expect(r2).toBe(r1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("loadHolidays: 404 → throw", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(loadHolidays()).rejects.toThrow(/404/);
  });

  it("getHolidays: loadHolidays 호출 전 → throw", () => {
    expect(() => getHolidays()).toThrow();
  });
});
```

### 4.12 사용자 정의 카테고리 추가 (categories.js) — v3.3 신규

S-105 새 카테고리 모달의 [추가] 버튼 클릭 시 호출되는 비즈니스 로직.
3.5 `categories.js`에 다음 함수를 추가한다.

```javascript
// src/constants/categories.js (3.5에 추가)
import { newCategoryId } from "../utils/idGenerator";
import { loadCustomCategories, saveCustomCategories } from "../utils/storage";
import { validateCustomCategory } from "../utils/validators";

/**
 * 사용자 정의 카테고리 추가 (v3.3 신규)
 *
 * S-105 [추가] 버튼 클릭 시 호출되는 메인 함수.
 *
 * 흐름:
 *   1. validateCustomCategory()로 입력 검증 (이름·중복·아이콘)
 *   2. 새 ID 생성 (cat_xxxxxx)
 *   3. custom_categories_v1에 push
 *   4. 저장 결과 반환
 *
 * @param {{ name: string, icon: string }} input
 * @returns {{ success: true, category: CustomCategory } | { success: false, errors?: object, error?: string }}
 */
export function addCustomCategory(input) {
  const existing = loadCustomCategories();

  // 1. 검증 (이름 빈값, 길이, 중복, 아이콘)
  const validation = validateCustomCategory(input, existing);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  // 2. 새 카테고리 객체 생성
  const newCategory = {
    id: newCategoryId(),
    name: input.name.trim(),
    icon: input.icon,
    created_at: new Date().toISOString()
  };

  // 3. 기존 목록에 push
  const updated = [...existing, newCategory];

  // 4. 저장 (스토리지 가득이면 실패 가능)
  const result = saveCustomCategories(updated);
  if (!result.success) {
    return { success: false, error: result.error };  // QUOTA_EXCEEDED 등
  }

  return { success: true, category: newCategory };
}

/**
 * 사용자 정의 카테고리 삭제 (S-203 [🗑] 버튼)
 *
 * 주의: 임시 항목의 ExtraItem.category는 name으로 저장되므로 (3.5 정책),
 *       카테고리 삭제 후에도 임시 항목은 그대로 유지됨 (아이콘만 ✨ fallback).
 *
 * @param {string} categoryId
 * @returns {{ success: boolean, error?: string }}
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
 * 사용자 정의 카테고리 수정 (S-203 [✏] 버튼)
 *
 * 주의: 이름 변경 시 임시 항목의 category 필드는 갱신되지 않음 (이름 기반 저장이라 자동 끊김).
 *       v3.3은 1단계 단순화를 위해 수정 시 임시 항목 카테고리 표시 깨질 수 있음을 허용 (✨ fallback).
 *       향후 2단계에서 임시 항목의 category 필드 일괄 갱신 마이그레이션 도입 검토.
 *
 * @param {string} categoryId
 * @param {{ name?: string, icon?: string }} updates
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
```

#### 4.12.1 단위 테스트 (categories.test.js)

```javascript
// src/constants/categories.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { addCustomCategory, deleteCustomCategory, getCategoryIcon } from "./categories";

describe("addCustomCategory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("정상 추가", () => {
    const r = addCustomCategory({ name: "동아리 회비", icon: "🎵" });

    expect(r.success).toBe(true);
    expect(r.category.id).toMatch(/^cat_[a-z0-9]{6}$/);
    expect(r.category.name).toBe("동아리 회비");
    expect(r.category.icon).toBe("🎵");
    expect(r.category.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // localStorage 저장 확인
    const stored = JSON.parse(localStorage.getItem("custom_categories_v1"));
    expect(stored.categories).toHaveLength(1);
    expect(stored.categories[0].name).toBe("동아리 회비");
  });

  it("빈 이름 → 검증 실패", () => {
    const r = addCustomCategory({ name: "", icon: "🎵" });
    expect(r.success).toBe(false);
    expect(r.errors.name).toBeTruthy();
  });

  it("21자 이름 → 검증 실패", () => {
    const r = addCustomCategory({ name: "a".repeat(21), icon: "🎵" });
    expect(r.success).toBe(false);
    expect(r.errors.name).toBeTruthy();
  });

  it("중복 이름 → 검증 실패", () => {
    addCustomCategory({ name: "동아리 회비", icon: "🎵" });
    const r2 = addCustomCategory({ name: "동아리 회비", icon: "🎨" });
    expect(r2.success).toBe(false);
    expect(r2.errors.name).toContain("이미 존재");
  });

  it("아이콘 빈 값 → 검증 실패", () => {
    const r = addCustomCategory({ name: "동아리", icon: "" });
    expect(r.success).toBe(false);
    expect(r.errors.icon).toBeTruthy();
  });

  it("이름 trim 처리", () => {
    const r = addCustomCategory({ name: "  동아리  ", icon: "🎵" });
    expect(r.success).toBe(true);
    expect(r.category.name).toBe("동아리"); // 공백 제거됨
  });
});

describe("deleteCustomCategory", () => {
  beforeEach(() => localStorage.clear());

  it("삭제 후 임시 항목 표시는 깨지지 않음 (이름 저장 정책)", () => {
    const { category } = addCustomCategory({ name: "동아리", icon: "🎵" });

    // 임시 항목이 "동아리" name으로 저장된 상태
    const itemCategoryName = "동아리";
    expect(getCategoryIcon(itemCategoryName, [category])).toBe("🎵");

    // 카테고리 삭제
    deleteCustomCategory(category.id);

    // 임시 항목의 category="동아리"는 그대로
    // getCategoryIcon은 ✨ fallback 반환 (3.5 정책)
    expect(getCategoryIcon(itemCategoryName, [])).toBe("✨");
  });
});
```

---
## 5. 1단계 기능별 명세 (F1-1 ~ F1-9)

### 표기 약속

각 기능은 다음 항목으로 정의:
- **목적**: 1줄
- **트리거**: 사용자 액션 또는 시점
- **흐름**: 단계별 (정상 / 대체 / 예외 묶음)
- **검증·제약**: 입력값·한도
- **데이터 변경**: 어떤 키가 어떻게 변하는지
- **인수 조건**: Gherkin (대표 케이스만)

검증 함수·계산 함수는 **4장에 정의된 코드를 그대로 호출**한다. 여기서 다시 적지 않는다.

---

### F1-1. 자녀 기본 설정 (첫 사용)

**목적**: 학교/학원 요일·단가, 기본 용돈을 한 번 등록하면 매달 자동 계산.

**트리거**: 첫 진입 시 `localStorage.getItem("settings_v1") === null` 감지 → S-101 모달 강제 표시.

**흐름**:
1. S-101 모달 자동 열림 (X 없음, ESC·외부 클릭 무시)
2. 사용자가 9개 필드 입력 (자녀 이름, 학교 4필드, 학원 4필드, 기본 용돈)
3. [저장하고 시작하기] 클릭
4. `validateSettings()` 호출 (4.7)
5. 검증 실패: 필드별 에러 인라인 표시, 모달 유지
6. 검증 통과: `saveSettings()` (4.6) → `initMetaIfNeeded()` (4.6) → 모달 닫기 → 메인 화면 진입
7. **예외**: `QUOTA_EXCEEDED` → S-108 정리 안내 모달 자동 표시

**검증·제약**: 4.7 `validateSettings()` 참조

**데이터 변경**:
- `settings_v1` 신규 생성
- `meta_v1` 신규 생성

**인수 조건**:
```gherkin
Given 시스템에 처음 진입한 사용자
When 환영 모달이 표시되면
Then 모달은 X 닫기 버튼이 없어야 한다
And ESC 키와 외부 클릭이 무시되어야 한다
And 모든 필드가 기본값으로 채워져 있어야 한다 (학교 월~금, 1160, 왕복, 80000)

Given 사용자가 학교 단가에 -100을 입력
When [저장] 클릭
Then 에러 "1원 이상 100,000원 이하로 입력해주세요"가 인라인 표시
And 모달은 닫히지 않는다
```

---

### F1-2. 캘린더 셀에 당일 교통비 자동 표시

**목적**: 평일 셀에 학교/학원/공휴일/임시 항목을 자동 시각화.

**트리거**: 메인 화면 진입 또는 월 변경 시.

**흐름**:
1. `loadSettings()`, `loadCalendarMonth(year, month)`, `holidays.json` 로드
2. `calculateMonthlyAllowance()` (4.1) 호출 → `cells[]` 받음
3. 각 셀을 7×N 그리드에 렌더링 (월 첫날 요일에 따라 빈 placeholder 셀 포함)
4. 셀 표시 요소: 날짜 숫자, 공휴일 이름, 🏫📚🎒 아이콘, 합계 금액 (데스크톱만), 메모 점

**셀 합계 금액 표시 전략 (v3.4 확정)**:
- 모바일 (< 768px): 아이콘(🏫📚🎒)만 표시, 금액은 S-402 툴팁에서 확인
- 데스크톱 (≥ 768px): 아이콘 + 합계 금액 텍스트 (예: "2,320") 표시
- 이유: 모바일 셀 60px에 금액까지 넣으면 가독성 저하

**메모 점(dot) 시각화 (v3.4 추가)**:
- 표시 조건: `cells[date].memo`가 비어있지 않을 때
- 모양: ● (filled circle)
- 크기: 6px
- 색상: `--color-primary` (#1565C0)
- 위치: 셀 우측 상단 (padding 4px)
- 접근성: `aria-label`에 "메모 있음" 추가

**검증·제약**: 사용자 입력 없음 (자동 표시).

**데이터 변경**: 없음 (읽기 전용).

**셀 표시 매트릭스**: 4.1의 학교/학원 등교 결정 로직과 동일.

**엣지 케이스 명시 (v3.1 추가)**:

| 케이스 | 동작 |
|---|---|
| `school.days`에 토/일 포함 | 해당 토/일 셀에도 🏫 표시 (사용자 자율) |
| `academy.days = ["sat","sun"]` (주말 학원) | 토/일 셀에 📚 표시 |
| 월 첫날이 일요일 | placeholder 0개, 첫 행 1일부터 |
| 월 첫날이 토요일 | placeholder 6개 (일~금), 첫 행에 1일만 |
| 월 첫날이 화요일 | placeholder 2개 (일/월), 첫 행에 1~5일 |
| 5주 차지 (예: 2월 28일 + 일요일 시작) | 4주 또는 5주 (placeholder로 채움) |
| 6주 차지 (31일 + 금요일 시작) | 6주 행 |
| 미래 달 (계산 시점에 holidays 없음) | 평일로 처리 (학교/학원 표시) |
| settings 변경 후 | 현재 표시 월 즉시 재계산 (과거 임시 항목은 그대로, 자동 항목만 새 단가로 재계산) |

**인수 조건**:
```gherkin
Given settings: 학교 월~금 1160 왕복, 공휴일 등교 안 함
When 2026년 5월 캘린더가 표시되면
Then 5/4(월) 셀에 🏫과 "2,320" 금액이 표시
And 5/3(일) 셀은 학교 표시가 없다
And 5/5(어린이날) 셀에 "어린이날" 텍스트가 빨간색으로 표시
And 5/5 셀에는 🏫이 없다 (공휴일 등교 안 함)

Given settings: 학교 days = ["sat"] (주말 학교)
When 5/2(토) 셀을 보면
Then 🏫과 금액이 표시된다 (토/일이라도 등교 요일이면 표시)

Given 학교 단가를 1,160 → 1,200으로 변경 후 캘린더 재렌더링
Then 평일 셀의 금액이 2,320 → 2,400으로 즉시 갱신된다
But 임시 항목 금액은 변경되지 않는다 (사용자가 직접 입력한 값이라 보존)
```

---

### F1-3. 화면 하단 정산표 + 합계

**목적**: 캘린더 아래에 항목별 계산식과 월 합계 표시.

**트리거**: F1-2 렌더링 직후.

**흐름**:
1. F1-2의 `AllowanceCalculation` 결과를 받음
2. 표시할 행 결정 (고정 순서, v3.4 확정):
   1. 💰 기본 용돈 (>0이면)
   2. 🏫 학교 (school_total > 0이면), 계산식 "단가 × 곱셈자 × 일수"
   3. 📚 학원 (academy_total > 0이면)
   4. 임시 항목 카테고리별 그룹 — **등록 시간순** (가장 먼저 등록된 카테고리가 위)
   5. **합계** 행 강조 표시
3. 임시 항목 카테고리 그룹화: 같은 카테고리 여러 건이면 "🎒 체험학습 2건 20,000원"으로 합산 표시

**정산표 계산식 반응형 (v3.4 확정)**:
- 모바일 (< 768px): 항목명 + 금액만 (예: "🏫 학교 버스  41,760원")
- 데스크톱 (≥ 768px): 항목명 + 계산식 + 금액 (예: "🏫 학교 버스  1,160 × 2 × 18일  41,760원")
- 이유: 모바일 화면 폭에 계산식까지 넣으면 줄바꿈 발생
4. 합계 0원이면 빈 상태("이번 달 청구할 항목이 없습니다") + [메시지 복사] 비활성

**검증·제약**: 없음.

**데이터 변경**: 없음.

**인수 조건**:
```gherkin
Given 5월 (학교 18일, 학원 9일, 체험학습 1건 8000원, 기본 80000)
When 정산표를 보면
Then "💰 기본 용돈" 행에 80,000원
And "🏫 학교 버스" 행에 "1,160 × 2 × 18일" 41,760원
And "📚 학원 버스" 행에 "1,160 × 2 × 9일" 20,880원
And "🎒 체험학습" 행에 "1건" 8,000원
And 합계 150,640원이 강조 표시
```

---

### F1-4. 비고 버튼 (요금표 + 아이콘 안내)

**목적**: 아이콘 의미와 경기버스 요금표 등 참고 정보 표시.

**트리거**: [📌 비고] 버튼 클릭.

**흐름**:
1. `getPanelVariant()` 호출 (윈도우 폭 < 768 → "bottom-sheet", 아니면 "drawer")
2. 패널 슬라이드 인 (300ms)
3. 정적 콘텐츠 렌더링: 아이콘 안내 (3.5), 경기버스 요금표 (3.6), 출처
4. 닫기: [×] / 외부 클릭 / ESC / (모바일) 아래 스와이프 100px+

**검증·제약**: 없음.

**데이터 변경**: 없음 (정적 데이터만 표시).

**인수 조건**: 7.5 화면 명세 참조.

---

### F1-5. 임시 항목 추가 + 메모

**목적**: 셀당 비정기 지출 최대 3개 + 메모 200자 등록.

**트리거**: 캘린더 셀 클릭 → S-103 모달.

**흐름 — 추가**:
1. S-103 진입 시 `original` 스냅샷 저장
2. [+ 임시 항목 추가] 클릭 → S-104 폼 모달 (z-300)
3. 카테고리 선택 (드롭다운에서 [+ 새 카테고리] 선택 시 S-105 진입)
4. 이름, 금액 입력
5. [추가] 클릭 → `validateExtraItem()` (4.7)
6. 통과: `id = newExtraItemId()` (4.8) 생성, `draft.extra_items.push(item)`, S-104 닫기
7. S-103 [저장] 클릭: `saveCalendarMonth()` (4.6) → S-103 닫기 → S-301 토스트 → 캘린더·정산표 갱신

**흐름 — 수정**:
1. 항목 [✏️] 클릭 → S-104 (수정 모드, prefilled)
2. 수정 후 [저장] → 동일 ID로 `draft` 업데이트

**흐름 — 삭제**:
1. 항목 [🗑] 클릭 → S-107 삭제 확인
2. [삭제] → `draft.extra_items` 에서 제거 → S-107 닫기

**흐름 — 메모**:
1. textarea 입력 (실시간 글자수 카운터)
2. 200자 도달 시 추가 입력 차단

**흐름 — 닫기 (취소/X/ESC/외부)**:
1. `isDirty()` 검사 (`original` vs `draft` JSON 비교)
2. dirty=false → 즉시 닫기
3. dirty=true → S-106 변경 사항 확인 → [닫기] 폐기 / [계속 편집] 유지

**검증·제약**:
- 셀당 임시 항목 ≤ 3개 (4번째 [+ 추가] 버튼 비활성)
- 메모 ≤ 200자 (입력 차단)

**데이터 변경**:
- `calendar_v1_YYYY_MM.cells[date].extra_items` 변경
- `calendar_v1_YYYY_MM.cells[date].memo` 변경
- `calendar_v1_YYYY_MM.updated_at` 갱신
- 셀이 빈 상태({extra_items: [], memo: ""})면 `cells[date]` 키 자체 삭제

**인수 조건**:
```gherkin
Given S-103 + 임시 항목 0개
When [+ 임시 항목 추가] 클릭 후 카테고리 "체험학습"·이름 "박물관"·금액 8000 입력 후 [추가]
Then S-104 닫힘
And S-103 임시 항목 목록에 1건 표시
And [저장] 시 5/14 셀에 🎒 + 합계 갱신

Given S-103 + 임시 항목 3개
Then [+ 임시 항목 추가] 버튼이 비활성
And "최대 3개까지 추가할 수 있습니다" 안내 표시

Given 메모에 200자 입력 시
Then 추가 입력 차단, "200/200" 빨간색 표시
```

---

### F1-6. 청구 메시지 자동 생성 (카톡 복사용)

**목적**: 정산표 → 카톡 붙여넣기용 텍스트 1번에 생성·복사.

**트리거**: [📋 메시지 복사] 버튼 클릭.

**흐름**:
1. 합계 0원 검사 → 0이면 동작 안 함 (버튼 비활성 상태)
2. `generateMessage()` (4.3) 호출 → 메시지 문자열
3. `copyToClipboard()` (4.9) 호출
4. 성공: S-301 토스트 "📋 복사되었습니다" (3초)
5. 실패 (`CLIPBOARD_DENIED` / `CLIPBOARD_UNSUPPORTED`): S-111 폴백 모달 (textarea + 자동 선택)

**검증·제약**: 합계 > 0.

**데이터 변경**: 없음.

**메시지 형식**: 4.4 출력 예시 참조.

**인수 조건**:
```gherkin
Given 정산표 합계 150,640원
When [📋 메시지 복사] 클릭
Then 4.4 형식의 메시지가 클립보드에 복사
And S-301 "📋 복사되었습니다" 토스트 3초

Given 합계 0원
Then [📋 메시지 복사] 버튼은 비활성 상태

Given 클립보드 API 거부 또는 미지원
Then S-111 폴백 모달 표시
And textarea 자동 선택
```

---

### F1-7. 미래 +12개월 / 과거 무제한 달 조회·편집

**목적**: 미래 달도 미리 캘린더 보고 임시 항목 등록 가능.

**트리거**: [◀ 이전 달] / [▶ 다음 달] / 월 표시 영역 클릭 (S-202).

**흐름**:
1. 새 month 결정 (이전/다음/직접 선택)
2. `isAtFutureLimit()` 체크 — **월 기준**: 오늘이 속한 월 + 12개월까지 허용 (예: 오늘이 2026-05-xx이면 2027-05까지 가능, 2027-06부터 비활성)
3. `loadCalendarMonth(newYear, newMonth)` (4.6) → 없으면 빈 객체 반환
4. `calculateMonthlyAllowance()` 재계산
5. `meta_v1.current_view_month` 갱신
6. 캘린더·정산표 재렌더링

**검증·제약**:
- 미래: 오늘이 속한 월 +12개월까지 (월 기준, 일 무관). 예: 오늘 5/2 → 2027-05월까지 조회 가능
- 과거: 무제한
- 캐싱: 매 월 이동 시 `loadCalendarMonth()`로 localStorage에서 로드 (메모리 캐시 없음, 1단계 단순화)

**데이터 변경**: `meta_v1.current_view_month`, `meta_v1.last_used_at` 갱신.

**인수 조건**:
```gherkin
Given 표시 월 = 오늘 +11개월
When [▶ 다음 달] 클릭
Then +12개월 도달
And [▶ 다음 달] 버튼이 비활성

Given 5월 ↔ 6월 왕복
When 6월에 임시 항목 추가 후 5월로 갔다가 6월로 돌아오면
Then 6월의 임시 항목이 그대로 표시
```

---

### F1-8. 로컬스토리지 자동 저장

**목적**: 입력 즉시 자동 저장, 페이지 재진입 시 복원.

**트리거**: 사용자 액션 직후 (S-101 [저장], S-102 [저장], S-103 [저장], S-105 [추가] 등).

**흐름**:
- 즉시 저장 (Eager). 1단계는 데이터 양이 적어 디바운스 불필요.

**예외 처리**:
- `QUOTA_EXCEEDED` → S-108 정리 안내 모달
- 시크릿 모드 등 비활성 → 시작 시 감지 후 안내 모달
- `JSON.parse` 실패 → `backupCorrupted()` (4.6) → 손상된 키만 폴백 (다른 데이터는 유지) → S-109 손상 안내 (settings 손상 시만)

**검증·제약**: 4.6 `safeSet()` 의 try/catch 적용.

**데이터 변경**: 각 기능별로 변경되는 키. 별도 저장 트리거 없음 (자동).

---

### F1-9. 설정 변경 (학기 변경 대응)

**목적**: 학기 변경 시 학교/학원 요일·단가·기본 용돈 갱신.

**트리거**: [⚙ 설정] 버튼 → S-102.

**흐름**:
1. S-102 진입 (S-101과 동일 폼, 닫기 가능, 기존 값 prefilled, original 스냅샷)
2. 사용자 수정 후 [저장] → `validateSettings()` → `saveSettings()` (`updated_at` 갱신)
3. 모달 닫기 → 현재 표시 월 재계산 + 캘린더·정산표 갱신
4. 닫기 시 `isDirty` → S-106 변경 확인

**검증·제약**: F1-1과 동일 (4.7 `validateSettings`).

**데이터 변경**: `settings_v1` 갱신 (`updated_at` 변경).

**적용 범위 (v3.2 명확화)**:

Settings 변경의 영향은 데이터 종류별로 다르다:

| 항목 | 저장 위치 | Settings 변경 영향 |
|---|---|---|
| 학교/학원 자동 항목 (교통비) | `cells`에 저장 안 함 | **매 렌더링마다 현재 settings 기준으로 실시간 계산** → 과거·현재·미래 모두 새 설정 기준으로 표시됨 (의도된 동작) |
| 임시 항목 (`extra_items`) | `cells[date].extra_items` | **settings 변경과 무관하게 보존** (사용자가 직접 입력한 값) |
| 메모 (`memo`) | `cells[date].memo` | **settings 변경 무관하게 보존** |
| 기본 용돈 (`base_allowance`) | `settings.base_allowance` | 모든 월의 정산표·메시지에 즉시 반영 |

> **즉**: settings는 "표시 규칙"이고, cells는 "사용자가 입력한 사실"이다.
> 단가를 1,160 → 1,200으로 바꾸면 과거 달의 학교 셀도 1,200원으로 표시되지만, 5/14에 등록된 박물관 체험비 8,000원은 그대로다.

**인수 조건**:
```gherkin
Given 학교 월~금 → 학교 화·목 변경 후 [저장]
Then 캘린더 화/목 셀에 🏫
And 월/수/금 셀에서 🏫 사라짐
And 정산표 학교 일수 갱신

Given 5/14에 박물관 체험비 8,000원 등록된 상태
When 학교 단가를 1,160 → 1,200으로 변경
Then 평일 셀의 학교 금액이 2,400원으로 갱신됨
But 5/14의 박물관 체험비는 그대로 8,000원 유지

Given 과거 달 (2025-12)을 보고 있는 상태
When 학교 단가를 1,160 → 1,200으로 변경
Then 2025-12 캘린더의 학교 셀도 1,200원 기준으로 재계산됨 (의도된 동작)
But 2025-12에 등록된 임시 항목은 그대로 유지
```

---
## 6. 1단계 화면 시스템

### 6.1 화면 인벤토리 (총 17개)

| Lv | ID | 화면명 | 진입 |
|---|---|---|---|
| L1 | S-001 | 메인 캘린더 | 앱 첫 진입 (settings 있을 때) |
| L2 | S-101 | 환영 + 자녀 기본 설정 (첫 사용) | 첫 진입 (settings 없음) |
| L2 | S-102 | 자녀 기본 설정 변경 | [⚙] 버튼 |
| L2 | S-103 | 셀 편집 | 캘린더 셀 클릭 |
| L2 | S-104 | 임시 항목 추가/수정 폼 | S-103 [+ 추가] |
| L2 | S-105 | 새 카테고리 추가 | S-104 카테고리 [+ 새 카테고리] |
| L2 | S-106 | 변경 사항 확인 | 변경 있는 모달 닫기 시도 |
| L2 | S-107 | 임시 항목 삭제 확인 | 임시 항목 [🗑] |
| L2 | S-108 | 데이터 정리 안내 | 저장 실패 (QUOTA_EXCEEDED) |
| L2 | S-109 | 데이터 손상 안내 | settings 손상 감지 |
| L2 | S-111 | 클립보드 폴백 | 복사 실패 |
| L2 | S-112 | 진단 화면 (관리자) | URL `?admin=1` |
| L2 | S-113 | 데이터 내보내기 | S-112 |
| L2 | S-114 | 데이터 가져오기 | S-112 |
| L3 | S-201 | 비고 드로어/바텀시트 | [📌] 버튼 |
| L3 | S-202 | 월 선택 | 헤더 월 표시 클릭 |
| L3 | S-203 | 카테고리 관리 | S-112 |
| L4 | S-301~303 | 토스트 (Success/Error/Warning) | 액션 결과 |
| L5 | S-401 | 정산표 (인라인) | 메인 하단 |
| L5 | S-402 | 셀 호버 툴팁 | 셀 hover/long-press |
| L5 | S-403 | 빈 상태 안내 | 합계 0원 |

### 6.2 화면 흐름

```
[첫 진입]
   │
   ├─ settings_v1 없음 ──► S-101 (강제) ──[저장]──► S-001
   │                                                 │
   └─ settings_v1 있음 ◄────────────────────────────┘
                                                     ▼
                                                 S-001 메인
                                                     │
            ┌────────────────────────────────────────┼─────────────────────┐
            │                                        │                     │
        [◀ ▶ 월변경]                            [셀 클릭]              [⚙][📌][📋]
            │                                        │                     │
        S-001 갱신                              S-103 셀 편집      S-102/S-201/복사
                                                     │
                           ┌─────────────────────────┼─────────────────────────┐
                           │                         │                         │
                       [+ 추가]                  [✏ 수정]                  [🗑 삭제]
                           │                         │                         │
                       S-104 폼                  S-104(편집)               S-107 확인
                           │                                                   │
                   [+ 새 카테고리]                                          [삭제]
                           │                                                   ▼
                       S-105 카테고리                                     draft 갱신
                           │
                       custom_categories_v1
                       에 저장
                       
[저장/취소 시]
S-103 [저장] ─► saveCalendarMonth ─► S-301 토스트 ─► S-001
S-103 [취소] (변경 있음) ─► S-106 ─► [닫기] ─► S-001
S-103 [취소] (변경 없음) ─► S-001
```

### 6.3 모달 닫기 정책 매트릭스

| 모달 | X | ESC | 외부 클릭 | 비고 |
|---|---|---|---|---|
| S-101 첫 설정 | ❌ | ❌ | ❌ | 강제 진입 |
| S-102 재설정 | ✅ | ✅ | ✅ | 변경 시 S-106 |
| S-103 셀 편집 | ✅ | ✅ | ✅ | 변경 시 S-106 |
| S-104 폼 | - | ✅ | ❌ | [취소] 버튼만 |
| S-105 카테고리 | ✅ | ✅ | ✅ | |
| S-106 변경 확인 | ❌ | ✅ (= 계속편집) | ❌ | 명시적 선택 |
| S-107 삭제 확인 | ❌ | ✅ (= 취소) | ❌ | |
| S-108 정리 | ✅ | ✅ | ❌ | |
| S-109 손상 | ❌ | ❌ | ❌ | |
| S-111 폴백 | ✅ | ✅ | ✅ | |
| S-112 진단 | ✅ (= 일반 모드) | ✅ | ✅ | |
| S-201 비고 | ✅ | ✅ | ✅ | + 모바일 스와이프 |
| S-202 월 선택 | - | ✅ | ✅ | 일반적으로 외부 클릭 |
| S-301~303 토스트 | ✅ | - | - | + 자동 닫힘 |

### 6.4 Z-Order

| Layer | z-index | 화면 |
|---|---|---|
| Toast | 500 | S-301~303 |
| Modal-3 | 400 | S-105, S-107 |
| Modal-2 | 300 | S-104 |
| Modal-1 | 200 | S-101~103, S-108~114 |
| Backdrop | 150 | 모달 뒤 |
| Drawer | 100 | S-201, S-202, S-203 |
| Tooltip | 50 | S-402 |
| Base | 0 | S-001 |

ESC는 LIFO (가장 위 레이어부터 닫힘).

#### 중첩 모달 ESC 동작 매트릭스 (v3.2 추가)

| 열린 순서 | ESC 대상 | isDirty 검사 | 비고 |
|---|---|---|---|
| S-103 단독 | S-103 | ✅ 있으면 S-106 | F1-5 흐름 |
| S-103 → S-104 | **S-104만** | ❌ (폼 내용 즉시 버림) | S-103은 유지 |
| S-103 → S-104 → S-105 | **S-105만** | ❌ (즉시 닫기) | S-104·S-103 모두 유지 |
| S-103 → S-107 | **S-107만** | ❌ | 삭제 확인은 즉시 닫힘 |
| S-102 → S-106 | **S-106만** (= 계속편집) | - | S-102 유지 |
| S-201 단독 | S-201 | - | 일반 닫기 |

**핵심 원칙**:
- **S-104, S-105는 isDirty 검사 없음** — 아직 "추가" 또는 "저장" 누르기 전이므로, ESC 시 입력 중인 데이터를 즉시 버려도 데이터 손실 위험 없음.
- **S-103, S-102는 isDirty 검사** — 이미 임시 항목을 추가/삭제하거나 메모를 수정한 상태가 draft에 누적될 수 있으므로 변경 사항 보호 필요.
- **삭제 확인 (S-107) ESC = 취소** — 삭제는 명시적 선택만 인정, 실수 방지.

### 6.5 디자인 토큰 (CSS 변수, 단일 정의)

이 시스템은 **CSS 변수 한 곳에서만 정의**하고 모든 화면이 공유한다. 화면별 명세에서 색상·간격을 다시 정의하지 않는다.

`src/index.css`:

```css
:root {
  /* Color: 기본 */
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F5F5;
  --color-bg-card: #FFFFFF;

  /* Color: 텍스트 */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-text-tertiary: #999999;

  /* Color: 강조 */
  --color-primary: #1565C0;          /* 도서관플러스 컬러 */
  --color-primary-hover: #0D47A1;
  --color-secondary: #FFA726;

  /* Color: 의미 */
  --color-success: #43A047;
  --color-warning: #FFA726;
  --color-error: #C0392B;
  --color-info: #1976D2;

  /* Color: 캘린더 */
  --color-holiday: #C0392B;          /* 일요일·법정공휴일 */
  --color-saturday: #1976D2;         /* 토요일 */

  /* Color: 보더 */
  --color-border: #E0E0E0;
  --color-border-strong: #BDBDBD;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Font */
  --font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Z-Index */
  --z-base: 0;
  --z-tooltip: 50;
  --z-drawer: 100;
  --z-backdrop: 150;
  --z-modal-1: 200;
  --z-modal-2: 300;
  --z-modal-3: 400;
  --z-toast: 500;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

/* 포커스 표시 (a11y) */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* 스크린 리더 전용 */
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}

/* iOS Safari + Android safe area 대응 (v3.1 추가) */
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}

.app-container {
  /* 100dvh: 동적 뷰포트 높이 (iOS Safari 주소창 변동 + 가상 키보드 대응) */
  min-height: 100dvh;
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
}

/* 하단 sticky 액션바 (모바일) - 홈 인디케이터 영역 보호 */
.action-bar-bottom {
  position: sticky;
  bottom: 0;
  padding-bottom: max(var(--space-3), var(--safe-bottom));
}

/* 모달 - 가상 키보드 올라올 때 위로 밀려나지 않도록 dvh 사용 */
.modal-content {
  max-height: 90dvh;  /* svh가 아닌 dvh (키보드 올라올 때 줄어듦) */
  overflow-y: auto;
}
```

##### iOS Safari `viewport-fit=cover` 적용

`index.html`의 viewport meta는 다음과 같이 설정:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

##### 가상 키보드 동작 정책 (v3.1 명시)

| 시나리오 | 동작 |
|---|---|
| 모바일 모달의 입력 필드 포커스 | 가상 키보드 올라옴, 모달은 `100dvh` 기준으로 자동 축소 |
| 입력 필드가 키보드에 가려질 때 | 모달은 자동 스크롤 (textarea 포함) |
| 키보드 닫힘 (Done 또는 외부 탭) | 모달 원래 크기 복귀 |
| iOS Safari "확대 방지" | 모든 input의 `font-size: 16px` 이상 유지 (iOS는 16px 미만 시 자동 줌) |

### 6.6 반응형 분기점

```css
/* Mobile First - base는 320~767px */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Wide Desktop */ }
```

### 6.7 빈 상태·로딩 상태

#### 빈 상태 (S-403)

##### 정확한 트리거 조건 (v3.1 명확화)

```javascript
// "총 합계가 0원" 만으로는 부족
// 다음 중 하나라도 해당하면 정상 정산표 표시:
// - base_allowance > 0
// - school_total > 0
// - academy_total > 0
// - extra_items_total > 0

function shouldShowEmptyState(calc) {
  return (
    calc.base_allowance === 0 &&
    calc.school_total === 0 &&
    calc.academy_total === 0 &&
    calc.extra_items_total === 0
  );
}
```

> **즉**: 사용자가 기본 용돈을 0원으로 설정했고, 학교/학원 요일이 모두 비어있고, 임시 항목도 0개일 때만 빈 상태 표시.
> 일반적인 경우 (기본 용돈 80,000원 설정 시) 빈 상태가 표시되지 않음.

##### 표시 내용

```
정산표 영역에 표시:

  📭
  이번 달 청구할 항목이 없습니다.
  학교 등교일이나 임시 항목을 등록하면 표시됩니다.

[메시지 복사] 버튼: 비활성 상태 (회색)
```

#### 로딩 상태

```
앱 진입: < 1초 (스플래시 또는 짧은 스켈레톤)
월 이동: 즉시 (1단계는 로컬이라 200ms 이내)
메시지 복사: < 500ms (버튼에 스피너)
```

---

## 7. 1단계 화면별 상세 명세

이 장은 **각 화면의 영역·동작·상태**만 정의한다. 색상·간격·폰트는 6.5의 디자인 토큰 사용.

### 7.1 S-001: 메인 캘린더

#### 영역 구조

> **표시 시나리오**: Hex님 자녀A · 2026년 5월 · 학교 18일 · 학원 9일 · 5/14 박물관 8,000원 · 합계 150,640원

##### 모바일 (320~767px)

```
┌─────────────────────────────────────┐
│ [56px] 헤더 (sticky)                 │
│  ◀  2026년 5월  ▶   ⚙ 📌            │
├─────────────────────────────────────┤
│ [28px] 요일 헤더                      │
│  일 월 화 수 목 금 토               │
├─────────────────────────────────────┤
│ [60px × 6행] 캘린더 그리드           │
│  ┌──┬──┬──┬──┬──┬──┬──┐          │
│  │  │  │  │  │  │ 1│ 2│           │
│  │  │  │  │  │  │🔴│  │ ← 5/1 노동절│
│  │  │  │  │  │  │📚│  │   학원만    │
│  ├──┼──┼──┼──┼──┼──┼──┤          │
│  │ 3│ 4│ 5│ 6│ 7│ 8│ 9│           │
│  │  │🏫│🔴│🏫│🏫│🏫│  │ ← 5/5 어린이날│
│  │  │  │  │📚│  │📚│  │            │
│  │  │  │  │  │  │🎒│  │ ← 5/8 가정 │
│  └──┴──┴──┴──┴──┴──┴──┘          │
│  ... (총 6주)                       │
├─────────────────────────────────────┤
│ 정산표 (스크롤 가능)                  │
│ 5월 정산                            │
│ 💰 기본 용돈        80,000원         │
│ 🏫 학교 버스        41,760원         │
│ 📚 학원 버스        20,880원         │
│ 🎒 체험학습          8,000원         │
│ ─────────────                       │
│ 합계               150,640원         │
├─────────────────────────────────────┤
│ [64px] 하단 액션바 (sticky)          │
│        [📋 메시지 복사]              │
└─────────────────────────────────────┘
```

##### 데스크톱 (≥768px)

- 헤더에 [📋 메시지 복사] 버튼 통합 (하단 액션바 없음)
- 셀 높이: 768~1023px → 80px, 1024~1439px → 90px, ≥1440px → 90px

**정산표 위치 (v3.4 확정)**:
- **768~1439px**: 캘린더 아래에 세로 배치 (스크롤). 모바일과 동일한 구조, 셀 크기만 다름.
- **≥1440px (와이드)**: 좌측 캘린더 (flex: 1, max-width: 960px) + 우측 정산표 사이드바 (width: 360px, position: sticky, top: 72px). **기본 표시** (숨김 토글 없음).

#### 영역별 상세

| 영역 | 요소 | 동작 | 비활성 조건 |
|---|---|---|---|
| 헤더 좌측 | [◀] | 이전 달 | 없음 |
| 헤더 중앙 | 월 표시 | S-202 월 선택 | - |
| 헤더 우측 | [▶] | 다음 달 | 미래 +12개월 도달 |
| 헤더 우측 | [⚙] | S-102 | - |
| 헤더 우측 | [📌] | S-201 비고 | - |
| 헤더 우측/하단 | [📋] | 메시지 복사 | 합계 0원 |
| 캘린더 셀 | (각 셀) | S-103 셀 편집 | placeholder 셀 |
| 정산표 | (행) | 정보 표시만 | - |

#### 셀 표시 매트릭스

| 케이스 | 날짜 색 | 학교 표시 | 학원 표시 | 합계 표시 |
|---|---|---|---|---|
| 평일 등교일 | 검정 | 🏫 + 금액 | (해당시 📚) | 합계 |
| 일요일 | 빨강 | 보통 X (단, `school.days`에 "sun" 포함이면 🏫 표시, 날짜색은 빨강 유지) | 보통 X (동일 규칙) | 해당 항목만 |
| 토요일 | 파랑 | 보통 X (단, `school.days`에 "sat" 포함이면 🏫 표시, 날짜색은 파랑 유지) | 보통 X (동일 규칙) | 해당 항목만 |
| 공휴일 + 등교 안 함 | 빨강 + 공휴일명 | X | (학원 등원이면 📚) | 학원만 |
| 공휴일 + 등교 함 | 빨강 + 공휴일명 | 🏫 | 📚 | 합계 |
| placeholder | (회색) | - | - | - |

### 7.2 S-101 / S-102: 자녀 기본 설정

#### 차이점

| 항목 | S-101 (첫) | S-102 (재) |
|---|---|---|
| 닫기 X | ❌ | ✅ |
| ESC | ❌ | ✅ |
| 외부 클릭 | ❌ | ✅ |
| 모달 제목 | "처음 시작합니다 👋" | "자녀 정보 변경" |
| 저장 버튼 | "저장하고 시작하기" | "저장" |
| 취소 버튼 | (없음) | "취소" |
| 변경 후 닫기 | (강제 차단) | S-106 |

#### 폼 구조

| 섹션 | 필드 | 컴포넌트 | 기본값 |
|---|---|---|---|
| 자녀 정보 | 이름 (선택) | Input maxLength=20 | "" |
| 기본 용돈 | 월 기본 용돈 | CurrencyInput max=1,000,000 | 80,000 |
| 🏫 학교 | 등교 요일 | WeekdayPicker | [mon,tue,wed,thu,fri] |
| 🏫 학교 | 단가 | CurrencyInput max=100,000 | 1,160 |
| 🏫 학교 | 편도/왕복 | RadioGroup | 왕복 |
| 🏫 학교 | 공휴일 | RadioGroup | 등교 안 함 |
| 📚 학원 | 등원 요일 | WeekdayPicker (토/일 포함) | [] |
| 📚 학원 | 단가 | CurrencyInput | 1,160 (요일 0개면 비활성) |
| 📚 학원 | 편도/왕복 | RadioGroup | 왕복 |
| 📚 학원 | 공휴일 | RadioGroup | 등원 함 |

#### 학원 비활성 정책

`academy.days.length === 0`이면 학원 단가/편도/공휴일 필드 회색 비활성, 안내 "학원 등원 요일을 선택하면 단가를 입력할 수 있습니다".

### 7.3 S-103: 셀 편집

#### 영역 구조

```
┌─ 5월 14일 (수) ───────────[×]┐
├──────────────────────────────────┤
│ 기본 항목 (자동, 수정 불가)        │
│  🏫 학교 등교        2,320원      │
│  📚 학원 등원        2,320원      │
├──────────────────────────────────┤
│ 임시 항목 (1/3)                   │
│  🎒 박물관 체험비                 │
│     8,000원      [✏][🗑]         │
│                                  │
│       [+ 임시 항목 추가]            │
├──────────────────────────────────┤
│ 메모 (200자 이내)                 │
│ ┌────────────────────────────┐  │
│ │ ㅇㅇ박물관 단체 관람          │  │
│ └────────────────────────────┘  │
│                          13/200  │  ← 형식: "현재글자수/200" (v3.4)
├──────────────────────────────────┤
│           [취소]      [저장]      │
└──────────────────────────────────┘
```

#### 동작

| 액션 | 흐름 | 결과 |
|---|---|---|
| 셀 클릭 | original 스냅샷 → 모달 열기 | S-103 표시 |
| [+ 추가] | S-104 폼 열기 (z-300) | - |
| [✏] | S-104 편집 모드 | - |
| [🗑] | S-107 확인 (z-400) | 확인 시 draft에서 제거 |
| [저장] | saveCalendarMonth → S-301 토스트 | 닫기 + 캘린더 갱신 |
| [취소]/[×]/ESC/외부 | isDirty 검사 | 변경 시 S-106, 아니면 즉시 닫기 |

#### 공휴일 셀 편집 사례 (예: 5/5 어린이날)

```
┌─ 5월 5일 (화) [어린이날] ─[×]┐
├──────────────────────────────┤
│ 기본 항목 (자동, 수정 불가)    │
│  (학교 등교 안 함 - 공휴일)   │
│  📚 학원 등원        2,320원  │  ← academy.holiday_attend=true
├──────────────────────────────┤
│ 임시 항목 (0/3)               │
│       [+ 임시 항목 추가]        │
├──────────────────────────────┤
│ 메모 (200자 이내)             │
│ [textarea]                   │
├──────────────────────────────┤
│           [취소]   [저장]     │
└──────────────────────────────┘
```

#### 학교/학원 모두 없는 빈 셀 (예: 5/3 일요일)

```
┌─ 5월 3일 (일) ─────────[×]┐
├────────────────────────────┤
│ (자동 항목 없음)             │
├────────────────────────────┤
│ 임시 항목 (0/3)             │
│       [+ 임시 항목 추가]      │
├────────────────────────────┤
│ 메모 (200자 이내)           │
│ [textarea]                 │
├────────────────────────────┤
│           [취소]   [저장]   │
└────────────────────────────┘
```

#### 상태

```typescript
{
  date: "2026-05-14",
  original: { extra_items: [...], memo: "..." },   // 변경 감지용
  draft: { extra_items: [...], memo: "..." },      // 편집 중
  showAddForm: false,
  editingItemId: null,
  showDeleteConfirm: null
}

// isDirty
JSON.stringify(original) !== JSON.stringify(draft)
```

### 7.4 S-104 / S-105: 임시 항목 폼 / 새 카테고리

#### S-104 영역

| 필드 | 컴포넌트 | 검증 |
|---|---|---|
| 카테고리 | Select (기본 9개 + custom + [+ 새 카테고리]) | 미선택 X |
| 이름 | Input maxLength=50 | 1~50자 |
| 금액 | CurrencyInput max=10,000,000 | 1~10,000,000 |

#### 카테고리 선택 흐름 (v3.2 명시)

```
1. S-104 카테고리 드롭다운 열기
   ├─ 기본 카테고리 9개 표시
   ├─ 사용자 정의 카테고리 (custom_categories_v1) 표시
   └─ 마지막에 [+ 새 카테고리] 항목

2. [+ 새 카테고리] 클릭
   → S-105 모달 열림 (S-104 위에 z-index 400 오버레이)
   → S-104의 다른 입력은 disabled 상태로 (이름·금액 편집 불가)

3a. S-105에서 [추가] 완료
    → addCustomCategory({ name, icon }) 호출 (4.12)
    → custom_categories_v1에 저장
    → S-105 닫힘
    → S-104의 카테고리 드롭다운 옵션 목록 즉시 갱신
    → 새로 추가한 카테고리가 자동 선택됨
    → S-104의 이름·금액 입력 다시 활성화

3b. S-105에서 [취소] 또는 ESC
    → S-105만 닫힘 (저장 X)
    → S-104의 카테고리 드롭다운: 이전 선택 상태 복원
       (사용자가 [+ 새 카테고리] 클릭 전에 선택한 값으로 복귀)
    → 아무것도 선택 안 한 상태였다면 빈 상태로
```

#### S-104 disabled 상태 관리 (v3.3 코드 명시)

S-105 오버레이가 떠있을 때 S-104 입력을 비활성화하는 React state 패턴:

```jsx
// src/components/modals/ExtraItemForm.jsx (S-104)
function ExtraItemForm({ onClose, onSubmit, defaultValues }) {
  const [category, setCategory] = useState(defaultValues?.category ?? "");
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [amount, setAmount] = useState(defaultValues?.amount ?? 0);

  // S-105 오버레이 상태
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  // S-105 진입 직전의 카테고리 (취소 시 복원용)
  const [previousCategory, setPreviousCategory] = useState(null);

  const isS105Open = showNewCategoryModal;

  function handleCategoryChange(value) {
    if (value === "__add_new__") {
      // [+ 새 카테고리] 선택
      setPreviousCategory(category);  // 현재 선택 백업
      setShowNewCategoryModal(true);
    } else {
      setCategory(value);
    }
  }

  function handleNewCategorySuccess(newCategory) {
    // S-105에서 추가 성공 → 목록 갱신 + 자동 선택 (v3.4 보완)
    const updated = loadCustomCategories();  // localStorage에서 갱신된 목록 로드
    setCustomCategories(updated);             // 드롭다운 옵션 즉시 반영
    setCategory(newCategory.name);
    setShowNewCategoryModal(false);
    setPreviousCategory(null);
  }

  function handleNewCategoryCancel() {
    // S-105 취소 → 이전 선택 복원
    setCategory(previousCategory ?? "");
    setShowNewCategoryModal(false);
    setPreviousCategory(null);
  }

  return (
    <>
      <Modal>
        <Select
          value={category}
          onChange={handleCategoryChange}
          disabled={isS105Open}   {/* ← S-105 떠있으면 disabled */}
        >
          {/* ... */}
        </Select>
        <Input
          value={name}
          onChange={setName}
          disabled={isS105Open}   {/* ← */}
        />
        <CurrencyInput
          value={amount}
          onChange={setAmount}
          disabled={isS105Open}   {/* ← */}
        />
        <Button
          onClick={() => onSubmit({ category, name, amount })}
          disabled={isS105Open}   {/* ← [추가] 버튼도 비활성 */}
        >
          {defaultValues ? "저장" : "추가"}
        </Button>
      </Modal>

      {showNewCategoryModal && (
        <NewCategoryModal
          onSuccess={handleNewCategorySuccess}
          onCancel={handleNewCategoryCancel}
        />
      )}
    </>
  );
}
```

**핵심 정책**:
- S-104의 모든 입력 컴포넌트는 `disabled={isS105Open}` prop을 받음
- 카테고리 드롭다운은 `[+ 새 카테고리]` 클릭 시점의 값을 `previousCategory`에 백업
- S-105 [추가] 성공 → 새 카테고리 자동 선택, 백업 폐기
- S-105 [취소]/ESC → `previousCategory`로 복원, 백업 폐기
- 시각 표현: disabled 상태는 `opacity: 0.6`, `pointer-events: none`

#### S-105 영역

| 필드 | 컴포넌트 | 검증 |
|---|---|---|
| 이름 | Input maxLength=20 | 1~20자, 중복 X (기본 9개 + 사용자 정의 전체 검사) |
| 아이콘 | 이모지 그리드 (아래 스펙) | 선택 필수 |

#### S-105 이모지 그리드 상세 (v3.2)

| 항목 | 값 |
|---|---|
| 그리드 | **6열 × N행** (`COMMON_EMOJIS` 33개 → 6행) |
| 셀 크기 | **44×44px** (터치 영역) |
| 셀 간격 | `--space-1` (4px) |
| 선택 표시 | `--color-primary` 배경 + 흰 체크마크 오버레이 (`✓`) |
| ARIA | `role="radiogroup"` (그리드 컨테이너), 각 셀 `role="radio"` `aria-checked` |

##### 키보드 네비게이션

| 키 | 동작 |
|---|---|
| Tab | 그리드 진입 (첫 셀 또는 선택된 셀에 포커스) |
| ↑↓←→ | 인접 이모지로 포커스 이동 |
| Enter / Space | 포커스된 이모지 선택 |
| Tab (그리드 떠나기) | 다음 폼 요소로 이동 |

##### 그리드 모서리 순환 정책 (v3.4)

| 상황 | 동작 |
|---|---|
| 행 끝에서 → | 같은 행 첫 셀로 순환 |
| 행 시작에서 ← | 같은 행 마지막 셀로 순환 |
| 첫 행에서 ↑ | 이동 없음 (행 넘김 금지) |
| 마지막 행에서 ↓ | 이동 없음 (행 넘김 금지) |
| 빈 셀(마지막 행) | 포커스 이동 건너뛰기 |

##### 그리드 표시 (모바일은 6열 유지, 가로 스크롤 없음)

```
┌──┬──┬──┬──┬──┬──┐
│🎵│🏃│🎨│🎮│⚽│🎬│
├──┼──┼──┼──┼──┼──┤
│📷│🎤│🌿│🐱│☕│🍔│
├──┼──┼──┼──┼──┼──┤
│🚗│✈️│🎂│🎃│📝│📐│
├──┼──┼──┼──┼──┼──┤
│🎒│📚│✂️│🖌️│👕│👟│
├──┼──┼──┼──┼──┼──┤
│🧢│🧥│💊│🩹│🦷│🎁│
├──┼──┼──┼──┼──┼──┤
│🎉│💰│✨│  │  │  │
└──┴──┴──┴──┴──┴──┘
```

### 7.5 S-201: 비고 드로어/바텀시트

#### 반응형

| < 768px | ≥ 768px |
|---|---|
| 바텀시트 (아래에서 위로) | 우측 드로어 (오른쪽에서 왼쪽으로) |
| 드래그 핸들 | (없음) |
| 아래 스와이프 100px+ → 닫기 | (지원 안 함) |

#### 콘텐츠

```
[헤더] 📌 비고  [×]
[섹션] 아이콘 안내
  🏫 학교 등교 (왕복 버스)
  📚 학원 등원 (왕복 버스)
  🎒 임시 항목 (체험학습 등)
  🔴 법정공휴일

[섹션] 경기도 시내버스 일반형 요금
  표 (3.6 KOREAN_BUS_FARES) — 청소년 행 ★ 강조
  출처: 경기버스운송사업조합 (gbus.or.kr)
  시행일: 2025-10-25

[섹션] 안내
  ※ 거주 지역에 따라 요금이 다를 수 있습니다.
```

### 7.6 S-202: 월 선택

#### 반응형

| < 768px | ≥ 768px |
|---|---|
| 바텀시트 (3개년 ±12개월 전체) | 팝오버 (월 표시 영역 아래) |

#### 영역 구조 (데스크톱 팝오버)

```
┌────────────────────────────────────┐
│  ◀ 2025      [2026]      2027 ▶   │ ← 연도 탭 (44px 높이)
├────────────────────────────────────┤
│  [1월]  [2월]  [3월]  [4월]        │
│  [5월]  [6월]  [7월]  [8월]        │ ← 4×3 그리드
│  [9월]  [10월] [11월] [12월]       │   각 셀 최소 44×44px
└────────────────────────────────────┘
```

#### 영역 구조 (모바일 바텀시트)

```
┌────────────────────────────────────┐
│  월 선택                      [×]  │
├────────────────────────────────────┤
│  ── 2025년 ──                       │
│  [1월]  [2월]  [3월]  [4월]        │
│  [5월]  [6월]  [7월]  [8월]        │
│  [9월]  [10월] [11월] [12월]       │
│                                    │
│  ── 2026년 ──                       │
│  [1월]  [2월]  [3월]  [4월]        │
│  [5월]●  ★    [7월]  [8월]         │  ← ●오늘 ★현재선택
│  ...                               │
│                                    │
│  ── 2027년 ──                       │
│  [1월]  [2월]  [3월]  [4월]        │
│  [5월]  ▒6월▒  ▒7월▒  ▒8월▒       │  ← 비활성(▒)
│  ...                               │
└────────────────────────────────────┘
```

#### 셀 상세 스펙

| 항목 | 값 |
|---|---|
| 그리드 | 4열 × 3행 (12개월) |
| 셀 크기 | 최소 **44×44px** (터치 영역 보장) |
| 셀 간격 | `--space-2` (8px) |

#### 셀 상태별 표시

| 상태 | 시각 표현 | 동작 |
|---|---|---|
| 일반 | 흰 배경 + 검정 텍스트 | 클릭 → 해당 월 이동 |
| 호버 (PC) | `--color-bg-secondary` 배경 | 클릭 가능 |
| **현재 선택 월** | `--color-primary` 배경 + 흰 텍스트 + 볼드 | (이미 선택된 월) |
| **오늘이 속한 월** | 우측 하단 작은 점 (`--color-primary`) | 현재 선택과 별개 |
| 현재 선택 = 오늘 | 파란 배경 + 흰 텍스트 + 점 (병합) | - |
| **비활성 (미래 +12개월 초과)** | `opacity: 0.4` + `pointer-events: none` | 클릭 불가 |

#### 연도 탭 동작

| 액션 | 결과 |
|---|---|
| `[◀]` 클릭 | 표시 연도 -1 (애니메이션 X, 즉시 갱신) |
| `[▶]` 클릭 | 표시 연도 +1 (단, 모든 월이 +12개월 초과면 비활성) |
| 연도 라벨 직접 클릭 | 동작 없음 (탭 형태로만) |

#### 동작

| 액션 | 결과 |
|---|---|
| 활성 월 클릭 | 팝오버/바텀시트 즉시 닫힘 + 메인 캘린더 해당 월 렌더링 |
| 비활성 월 클릭 | 동작 없음 |
| ESC | 닫기 (메인 캘린더 그대로) |
| 외부 클릭 | 닫기 |
| 모바일 아래 스와이프 | 닫기 |

#### 키보드 네비게이션 (PC 팝오버)

| 키 | 동작 |
|---|---|
| Tab | 다음 셀로 포커스 |
| ↑↓←→ | 인접 셀로 포커스 (그리드 네비게이션) |
| Enter / Space | 포커스된 월 선택 |
| ESC | 닫기 |

#### ARIA

```jsx
<div role="dialog" aria-label="월 선택" aria-modal="true">
  <div role="tablist" aria-label="연도">
    <button role="tab" aria-selected="false">2025</button>
    <button role="tab" aria-selected="true">2026</button>
    <button role="tab" aria-selected="false">2027</button>
  </div>
  <div role="grid" aria-label="2026년 월 선택">
    {Array.from({length: 12}, (_, i) => (
      <button
        role="gridcell"
        aria-label={`${i+1}월`}
        aria-current={isCurrentMonth ? "true" : "false"}
        aria-disabled={isFuture12 ? "true" : "false"}
        disabled={isFuture12}
      >
        {i+1}월
      </button>
    ))}
  </div>
</div>
```

### 7.7 S-106 / S-107: 확인 모달

#### S-106 (변경 확인)

```
⚠️
저장하지 않은 변경 사항이 있습니다.
닫으면 변경 사항이 사라집니다.

[계속 편집]   [닫기]
```

- ESC = [계속 편집] (안전 방향)
- 외부 클릭 무시

#### S-107 (삭제 확인)

```
🗑
이 임시 항목을 삭제할까요?

🎒 박물관 체험비
   8,000원

[취소]    [삭제]
```

- 모달 닫기 시 변경 안 됨 (draft만 영향, 저장은 S-103 [저장] 클릭 시)

### 7.8 S-108 / S-109: 시스템 안내

#### S-108 (정리 안내)

스토리지 가득 시 자동 표시. 정리 대상 (6개월 이전 calendar_v1_*) 미리보기 + [내보내기 후 정리] / [지금 정리] / [취소].

**정리 후 자동 재시도 정책 (v3.4)**:
1. [지금 정리] 또는 [내보내기 후 정리] 완료 시, 직전 실패한 `saveCalendarMonth()` 또는 `saveSettings()` 호출을 **자동 재실행**
2. 재실행 성공 → S-301 "✅ 저장되었습니다" + S-108 닫기
3. 재실행 실패 → S-302 "정리 후에도 저장 실패. 관리자 모드에서 확인하세요" + S-108 유지
4. 직전 실패 함수 참조는 S-108 열 때 `pendingSave: { fn, args }` 형태로 전달

#### S-109 (손상 안내)

settings 손상 시 자동 표시. 백업된 키 안내 + [다시 설정하기] (S-101 강제 진입).

**[복구 시도] 버튼 추가 (v3.4)**:
- 백업 키(`settings_v1_corrupted_*`)가 존재하면 [복구 시도] 버튼 표시
- 클릭 시 `recoverFromBackup("settings_v1")` 호출
- 성공 → S-301 "✅ 설정이 복구되었습니다" + S-109 닫기 + 앱 상태 갱신
- 실패 → 에러별 토스트 (NO_BACKUP: "백업 없음", PARSE_FAILED: "백업도 손상됨") + [다시 설정하기] 유지
- 백업 키 없으면 [복구 시도] 버튼 미표시, [다시 설정하기]만 표시

### 7.9 S-111: 클립보드 폴백

```
자동 복사가 지원되지 않는 환경이에요.
아래 메시지를 길게 눌러 (또는 Ctrl+A → Ctrl+C) 직접 복사해주세요.

[textarea readOnly, autoFocus, 자동 선택]

[모두 선택]    [닫기]
```

### 7.10 S-301~303: 토스트

#### 종류

| ID | 타입 | 색 | 자동 닫힘 |
|---|---|---|---|
| S-301 | Success | 녹색 | 3초 |
| S-302 | Error | 빨강 | 5초 (액션 있으면 0=수동) |
| S-303 | Warning | 주황 | 4초 |

#### 위치

- 모바일: 화면 상단 (헤더 아래 16px)
- 데스크톱: 화면 우측 하단 (24px 마진)

#### 사용 매트릭스

| 시점 | ID | 메시지 | 지속 |
|---|---|---|---|
| 메시지 복사 성공 | S-301 | "📋 복사되었습니다" | 3초 |
| 자녀 설정 저장 | S-301 | "✅ 저장되었습니다" | 3초 |
| 셀 편집 저장 | S-301 | "✅ 저장되었습니다" | 3초 |
| 카테고리 추가 | S-301 | "✅ 카테고리 추가됨" | 3초 |
| 저장 실패 (스토리지) | S-302 + 액션 | "저장 실패. [다시 시도]" | 0 |

**S-302 [다시 시도] 동작 (v3.4)**: 버튼 클릭 시 직전 실패한 저장 함수(saveCalendarMonth / saveSettings)를 동일 인자로 재실행. 성공 시 S-301 "✅ 저장되었습니다", 실패 시 S-302 재표시.
| 클립보드 거부 | S-302 | "복사 실패. 모달에서 수동 복사하세요" | 5초 |
| 임시 항목 한도 | S-303 | "최대 3개까지 추가할 수 있습니다" | 4초 |
| 미래 +12개월 도달 | S-303 | "12개월 후까지만 표시됩니다" | 4초 |

검증 실패는 토스트 X, **인라인 에러 메시지**로 처리.

### 7.11 S-401: 정산표

#### 행 종류

| 종류 | 표시 조건 | 형식 |
|---|---|---|
| 💰 기본 용돈 | always | "기본 용돈" + "X × 1" + 금액 |
| 🏫 학교 버스 | school_total > 0 | "학교 버스" + "단가 × 곱셈자 × 일수" + 금액 |
| 📚 학원 버스 | academy_total > 0 | 동일 패턴 |
| 임시 항목 (카테고리별) | 카테고리별 group | "아이콘 카테고리명" + "N건" + 합산 금액 |
| **합계** | always | 강조 표시 (볼드 + `--color-text-primary`) |

**행 순서 (v3.4 확정)**: 💰 기본 용돈 → 🏫 학교 → 📚 학원 → 임시 항목 (등록 시간순, 가장 먼저 등록된 카테고리가 위) → 합계. 순서는 고정.

**임시 항목 그룹화**: 같은 카테고리 여러 건은 합산 (예: "🎒 체험학습 2건 20,000원"). 개별 항목 펼치기 기능 없음 (1단계). 상세는 S-103 셀 편집에서 확인.

**계산식 반응형 (v3.4 확정)**:
- < 768px: 항목명 + 금액만 표시 (계산식 생략)
- ≥ 768px: 항목명 + 계산식 + 금액 (예: "1,160 × 2 × 18일  41,760원")

**정산표 행 상호작용**: 없음 (정보 표시 전용, 클릭/탭 불가, `cursor: default`).

빈 상태 (총합 0): S-403 빈 상태 표시 (정산표 영역을 교체).

### 7.12 S-402: 셀 호버 툴팁

#### 트리거

- PC: 마우스 200ms 호버
- 모바일: long press 500ms

#### 표시

```
┌────────────────────────────┐
│ 5월 14일 (수)              │
│                            │
│ 🏫 학교: 1,160 × 2 = 2,320 │
│ 📚 학원: 1,160 × 2 = 2,320 │
│ 🎒 박물관: 8,000           │
│ ───────────                │
│ 합계: 12,640원             │
│                            │
│ 📝 메모: ㅇㅇ박물관...      │
└────────────────────────────┘
```

**위치 결정 알고리즘 (v3.4 상세)**:
- PC: 셀 우측 8px 오프셋. 셀 우측 끝 + 툴팁 너비가 뷰포트를 초과하면 셀 좌측에 배치.
- 모바일: 셀 상단 중앙 정렬. 셀이 화면 상단 80px 이내이면 셀 하단에 배치.
- 최대 너비: 280px
- z-index: 500 (모든 UI 위)

**메모 표시 규칙 (v3.4 추가)**:
- 메모가 비어있으면 "📝 메모:" 행 자체를 숨김
- 메모가 있으면 최대 50자까지 표시, 초과 시 "..." 말줄임
- 전체 메모는 S-103 셀 편집에서 확인 가능

**계산 금액 출처**: settings 기반 실시간 계산 (저장된 값 아님). settings 변경 후 과거 달 툴팁도 새 단가로 표시됨 (의도된 동작).

**빈 셀**: 자동 항목(학교/학원)도 임시 항목도 없는 셀은 툴팁 미표시 (8.3 매트릭스의 "빈 평일" = 호버 강조만).

`pointer-events: none` (호버 영역에 영향 없도록).

---
## 8. 1단계 인터랙션·접근성·반응형

### 8.1 버튼 카탈로그 (전체)

| ID | 위치 | 라벨 | 동작 | 활성 조건 | 비활성 조건 |
|---|---|---|---|---|---|
| BTN-H-001 | 헤더 | ◀ | 이전 달 | 항상 | - |
| BTN-H-002 | 헤더 | 월 표시 | S-202 | 항상 | - |
| BTN-H-003 | 헤더 | ▶ | 다음 달 | < 미래+12개월 | 미래+12개월 도달 |
| BTN-H-004 | 헤더 | ⚙ | S-102 | 항상 | - |
| BTN-H-005 | 헤더 | 📌 | S-201 토글 | 항상 | - |
| BTN-H-006 | 헤더/하단 | 📋 | 메시지 복사 | 합계 > 0 | 합계 = 0 |
| BTN-C-001 | 캘린더 셀 | (각 셀) | S-103 | 비-placeholder | placeholder |
| BTN-CE-001 | S-103 | + 임시 항목 추가 | S-104 추가 | 임시 < 3 | 임시 = 3 |
| BTN-CE-002 | S-103 | ✏️ | S-104 편집 | - | - |
| BTN-CE-003 | S-103 | 🗑 | S-107 | - | - |
| BTN-CE-004 | S-103 | 취소 | isDirty 검사 | - | - |
| BTN-CE-005 | S-103 | 저장 | save → 닫기 | dirty | clean |
| BTN-EF-001 | S-104 | 카테고리 드롭다운 | 목록 | - | - |
| BTN-EF-002 | S-104 드롭다운 | + 새 카테고리 | S-105 | - | - |
| BTN-EF-003 | S-104 | 추가 / 저장 | 검증 → 부모 모달 갱신 | 검증 통과 | 검증 실패 |
| BTN-EF-004 | S-104 | 취소 | 닫기 | - | - |
| BTN-NC-001 | S-105 | 이모지 그리드 | 선택 | - | - |
| BTN-NC-002 | S-105 | 추가 | 검증 → 저장 | 검증 통과 | 검증 실패 |
| BTN-NC-003 | S-105 | 취소 | 닫기 | - | - |
| BTN-S-001 | S-101/S-102 | 요일 토글 | 선택/해제 | - | - |
| BTN-S-002 | S-101/S-102 | 편도/왕복 | 라디오 | - | - |
| BTN-S-003 | S-101/S-102 | 공휴일 처리 | 라디오 | - | - |
| BTN-S-004 | S-101/S-102 | 저장 | 검증 → 저장 | 검증 통과 | - |
| BTN-S-005 | S-102 | 취소 | isDirty 검사 | S-102만 | - |
| BTN-N-001~003 | S-201 | × / 외부 / 스와이프 | 닫기 | - | - |
| BTN-X-101 | S-106 | 계속 편집 | S-106 닫기 | - | - |
| BTN-X-102 | S-106 | 닫기 | 변경 폐기 + 부모 닫기 | - | - |
| BTN-X-201 | S-107 | 취소 | S-107 닫기 | - | - |
| BTN-X-202 | S-107 | 삭제 | draft에서 제거 | - | - |
| BTN-X-301 | S-108 | 취소/지금 정리/내보내기 후 정리 | 각 동작 | - | - |
| BTN-X-401 | S-109 | 다시 설정하기 | S-101 강제 | - | - |
| BTN-X-501 | S-111 | 모두 선택 / 닫기 | textarea select / 닫기 | - | - |
| BTN-A-001 | S-112 | 일반 모드로 돌아가기 | URL 변경 | - | - |
| BTN-A-002 | S-112 | 데이터 내보내기 | S-113 | - | - |
| BTN-A-003 | S-112 | 데이터 가져오기 | S-114 | - | - |
| BTN-A-004 | S-112 | 카테고리 관리 | S-203 | - | - |
| BTN-A-005 | S-112 | 오래된 데이터 정리 | 확인 → cleanupOldCalendars | - | - |
| BTN-A-006 | S-112 | 모든 데이터 초기화 | 2단계 type-to-confirm | - | - |
| BTN-A-007~009 | S-112 | 콘솔 로그 / 무결성 검사 / 공휴일 검증 | 각 디버그 | - | - |

### 8.2 키보드 단축키

#### 글로벌

| 키 | 동작 |
|---|---|
| Tab / Shift+Tab | 포커스 이동 |
| Enter | 활성 요소 클릭 / 폼 [저장] |
| Space | 체크박스/버튼 토글 |
| ESC | 가장 위 모달 닫기 (LIFO) |
| ← | 이전 달 (입력 외) |
| → | 다음 달 (입력 외) |

#### 모달 내부

- Tab: 모달 내 포커스 트랩 (외부로 안 나감)
- Enter: 폼 default 버튼 (보통 [저장])
- ESC: 모달 닫기 (변경 검사 적용)

### 8.3 마우스 / 터치 매트릭스

| 영역 | Hover (PC) | Click | Tap (Mobile) | Long Press (Mobile) |
|---|---|---|---|---|
| 캘린더 셀 (값 있음) | 강조 + S-402 | S-103 | S-103 | S-402 |
| 캘린더 셀 (빈 평일) | 강조 | S-103 | S-103 | - |
| 캘린더 셀 (placeholder) | - | - | - | - |
| 헤더 버튼 | 배경 강조 | 동작 | 동작 | - |
| 비고 바텀시트 | - | - | - | 아래 스와이프 → 닫기 |
| 모달 외부 | - | 닫기 (정책별) | 닫기 (정책별) | - |

### 8.4 접근성 (WCAG 2.1 AA)

#### 중첩 모달 포커스 트랩 정책 (v3.4)

- **최상위 모달에만** 포커스 트랩 적용 (Tab/Shift+Tab이 모달 내부에서만 순환)
- 하위 모달이 열리면 상위 모달의 포커스 트랩을 **비활성화** (aria-hidden="true"로 전환)
- 최상위 모달이 닫히면 이전 모달의 포커스 트랩 **재활성화** + 이전 포커스 위치로 복원
- 구현: z-index 기준 최상위 모달만 `inert` 속성 해제, 나머지는 `inert` 적용

#### ARIA 속성

##### 캘린더

```jsx
<div role="grid" aria-label={`${year}년 ${month}월 캘린더`}>
  <div role="row">
    <div role="columnheader">일</div>
    {/* ... */}
  </div>
  {weeks.map((week, i) => (
    <div key={i} role="row">
      {week.map(cell => (
        <div
          role="gridcell"
          aria-label={getCellAriaLabel(cell)}
          aria-selected={cell.date === selectedDate}
          tabIndex={cell.isPlaceholder ? -1 : 0}
        >...</div>
      ))}
    </div>
  ))}
</div>
```

##### ARIA 라벨 생성기

```javascript
export function getCellAriaLabel(cell) {
  const parts = [];
  parts.push(`${cell.month}월 ${cell.day}일 ${getWeekdayKor(cell.weekday)}요일`);
  if (cell.is_holiday) parts.push(`공휴일 ${cell.holiday_name}`);
  if (cell.school_fee > 0) parts.push(`학교 등교 ${cell.school_fee.toLocaleString()}원`);
  if (cell.academy_fee > 0) parts.push(`학원 등원 ${cell.academy_fee.toLocaleString()}원`);
  if (cell.extra_items.length > 0) {
    const t = cell.extra_items.reduce((s, i) => s + i.amount, 0);
    parts.push(`임시 항목 ${cell.extra_items.length}건 ${t.toLocaleString()}원`);
  }
  if (cell.memo) parts.push("메모 있음");
  if (cell.total > 0) parts.push(`합계 ${cell.total.toLocaleString()}원`);
  return parts.join(", ");
}
```

##### 모달

```jsx
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">5월 14일 (수)</h2>
  ...
</div>
```

##### 토스트

```jsx
<div role="status" aria-live="polite" aria-atomic="true">
  {toast.message}
</div>
```

#### 색상 대비 (WCAG AA)

모든 색상 조합이 4.5:1 이상 (6.5에서 정의된 토큰):
- `#1A1A1A on #FFFFFF` = 18.6:1 ✅
- `#1565C0 on #FFFFFF` = 7.8:1 ✅
- `#C0392B on #FFFFFF` = 5.4:1 ✅

### 8.5 반응형 동작 매트릭스

| 화면 ID | < 768px | 768~1023 | 1024~1439 | ≥ 1440 |
|---|---|---|---|---|
| S-001 | 세로, 셀 60px, 하단 액션바 | 세로, 셀 80px | 세로, 셀 90px | 좌측 캘린더 + 우측 정산표 |
| S-101/S-102 | 풀스크린 | 480px 모달 | 480px 모달 | 480px 모달 |
| S-103 | 95% 폭 | 480px 모달 | 480px 모달 | 480px 모달 |
| S-104/S-105 | 95% 폭 | 400px 모달 | 400px 모달 | 400px 모달 |
| S-106/S-107 | 90% 폭 | 360px 모달 | 360px 모달 | 360px 모달 |
| S-201 | 바텀시트 | 우측 드로어 320px | 우측 드로어 320px | 우측 드로어 320px |
| S-202 | 바텀시트 | 팝오버 | 팝오버 | 팝오버 |
| S-301~303 | 상단 토스트 | 우측 하단 | 우측 하단 | 우측 하단 |

---

## 9. 1단계 관리자 / 진단 모드

### 9.1 진입

| 방법 | 사용 |
|---|---|
| URL `?admin=1` | 메인 |
| 콘솔 `window.openAdmin()` | 디버그용 |
| 헤더 자녀 이름 5번 빠르게 탭 | 시크릿 |

### 9.2 S-112 진단 화면 영역

```
┌─ 🛠 관리자 / 진단 모드 ────[일반 모드로 돌아가기]┐
│                                                  │
│ [시스템 정보]                                     │
│ 앱 버전, 스키마 버전, 첫 사용일, 마지막 사용일     │
│                                                  │
│ [데이터 상태]                                     │
│ ✅ settings_v1: 정상 (488 bytes)                 │
│ ✅ meta_v1: 정상                                  │
│ ✅ custom_categories_v1: 2개                     │
│ 캘린더 데이터 (월별 목록):                        │
│  ✅ 2026-05: 정상 (2,150 bytes, 임시항목 3개)    │
│  ⚠️ 2026-03: 손상 [복구] [삭제]                  │
│ 백업 파일: settings_v1_corrupted_TS [보기][삭제] │
│                                                  │
│ [스토리지 사용량]                                 │
│ 14 KB / 5 MB (0.28%)                             │
│                                                  │
│ [작업]                                            │
│ 📤 데이터 내보내기 → S-113                        │
│ 📥 데이터 가져오기 → S-114                        │
│ 🏷 카테고리 관리 → S-203                         │
│ 🧹 오래된 데이터 정리                             │
│ 🗑 모든 데이터 초기화 (2단계 확인)                │
│                                                  │
│ [디버그]                                          │
│ 콘솔 로그 보기 / 무결성 검사 / 공휴일 검증         │
└──────────────────────────────────────────────────┘
```

### 9.3 데이터 검사 함수 (실제 코드)

```javascript
// src/utils/diagnostics.js
import { listAllAppKeys } from "./storage";

export function checkDataStatus() {
  return listAllAppKeys().map(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return { key, valid: false, size: 0, error: "키 없음" };
    const size = raw.length;
    try {
      const data = JSON.parse(raw);
      let itemCount;
      if (key.startsWith("calendar_v1_")) {
        const cells = Object.values(data.cells || {});
        itemCount = cells.reduce((s, c) => s + (c.extra_items?.length || 0), 0);
      } else if (key === "custom_categories_v1") {
        itemCount = data.categories?.length || 0;
      }
      return { key, valid: true, size, itemCount };
    } catch (e) {
      return { key, valid: false, size, error: e.message };
    }
  });
}

export function getSystemInfo() {
  const meta = JSON.parse(localStorage.getItem("meta_v1") || "{}");
  const firstDate = meta.first_used_at ? new Date(meta.first_used_at) : null;
  const today = new Date();
  const daysSince = firstDate
    ? Math.floor((today - firstDate) / (1000 * 60 * 60 * 24))
    : 0;
  return {
    appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
    schemaVersion: 1,
    firstUsedAt: meta.first_used_at,
    lastUsedAt: meta.last_used_at,
    daysSinceFirstUse: daysSince,
    userAgent: navigator.userAgent
  };
}

/**
 * 손상된 키를 가장 최근 백업으로 복구 (v3.2 신규)
 *
 * 백업 키 명명: {originalKey}_corrupted_{timestamp}
 * 가장 큰 timestamp = 가장 최근 백업
 *
 * 흐름:
 *   1. {originalKey}_corrupted_* 패턴 키 모두 찾음
 *   2. 정렬 후 가장 최근 백업 선택
 *   3. JSON 파싱 가능 여부 검증
 *   4. originalKey로 복원 + 백업 키 삭제
 *
 * @param {string} originalKey - 복구 대상 키 (예: "settings_v1")
 * @returns {{success: boolean, error?: string, restoredFrom?: string}}
 */
export function recoverFromBackup(originalKey) {
  const backupKeys = Object.keys(localStorage)
    .filter(k => k.startsWith(originalKey + "_corrupted_"))
    .sort();  // timestamp 오름차순

  if (backupKeys.length === 0) {
    return { success: false, error: "NO_BACKUP" };
  }

  const mostRecent = backupKeys[backupKeys.length - 1];
  const raw = localStorage.getItem(mostRecent);

  if (!raw) {
    return { success: false, error: "BACKUP_EMPTY" };
  }

  // 백업이 정상 JSON인지 검증
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { success: false, error: "PARSE_FAILED" };
  }

  // 복원 시도
  try {
    localStorage.setItem(originalKey, JSON.stringify(parsed));
    localStorage.removeItem(mostRecent);
    return { success: true, restoredFrom: mostRecent };
  } catch (e) {
    return { success: false, error: "RESTORE_FAILED" };
  }
}

/**
 * 손상 백업 키 삭제 (사용자가 복구 안 하기로 결정한 경우)
 */
export function discardBackup(backupKey) {
  if (!backupKey.includes("_corrupted_")) {
    return { success: false, error: "NOT_BACKUP_KEY" };
  }
  localStorage.removeItem(backupKey);
  return { success: true };
}
```

#### recoverFromBackup 에러별 토스트 메시지 (v3.4)

S-112 진단 화면의 [복구] 버튼 및 S-109의 [복구 시도] 버튼 클릭 후:

| error 코드 | 토스트 | 타입 |
|---|---|---|
| 성공 | "✅ {key} 복구 완료" | S-301 |
| `NO_BACKUP` | "백업 파일이 없습니다. 수동 복구가 필요합니다" | S-302 |
| `BACKUP_EMPTY` | "백업 파일이 비어있습니다" | S-302 |
| `PARSE_FAILED` | "백업 파일도 손상되었습니다. 데이터 가져오기를 이용하세요" | S-302 |
| `RESTORE_FAILED` | "복원 중 저장 오류. 스토리지 용량을 확인하세요" | S-302 |

### 9.4 S-113: 데이터 내보내기

#### 파일 포맷 (`ExportFile_v1`)

3.2 인터페이스 참조. 체크섬은 SHA-256.

#### 내보내기 함수

```javascript
// src/utils/exportImport.js
import { listAllAppKeys } from "./storage";

export async function exportData(options = {}) {
  const data = {
    export_version: 1,
    exported_at: new Date().toISOString(),
    app_version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    schema_version: 1,
    calendars: {}
  };

  if (options.includeSettings !== false) {
    const s = localStorage.getItem("settings_v1");
    if (s) data.settings = JSON.parse(s);
  }
  if (options.includeMeta !== false) {
    const m = localStorage.getItem("meta_v1");
    if (m) data.meta = JSON.parse(m);
  }
  if (options.includeCategories !== false) {
    const c = localStorage.getItem("custom_categories_v1");
    if (c) data.custom_categories = JSON.parse(c);
  }
  if (options.includeCalendars !== false) {
    Object.keys(localStorage)
      .filter(k => k.startsWith("calendar_v1_"))
      .forEach(k => {
        const m = k.match(/calendar_v1_(\d{4})_(\d{2})/);
        if (!m) return;
        const ym = `${m[1]}-${m[2]}`;
        if (options.dateRange && (ym < options.dateRange.start || ym > options.dateRange.end)) return;
        data.calendars[ym] = JSON.parse(localStorage.getItem(k));
      });
  }
  if (options.includeBackups) {
    data.backups = {};
    Object.keys(localStorage)
      .filter(k => k.includes("_corrupted_"))
      .forEach(k => { data.backups[k] = localStorage.getItem(k); });
  }

  // 체크섬 (v3.2 정규화: 키 정렬한 JSON으로 계산)
  data.checksum = "";
  data.checksum = await computeChecksum(data);

  return data;
}

/**
 * 정규화된 SHA-256 체크섬 계산 (v3.2 신규)
 *
 * JSON.stringify는 객체 키 순서를 보장하지 않을 수 있으므로,
 * 키를 정렬하여 같은 데이터는 항상 같은 해시가 되도록 정규화한다.
 *
 * 주의: 중첩 객체의 키도 정렬되어야 함 → 재귀 정렬 함수 사용
 *
 * @param {object} data
 * @returns {Promise<string>} 64자 hex SHA-256
 */
export async function computeChecksum(data) {
  const sorted = sortKeysDeep({ ...data, checksum: "" });
  return sha256(JSON.stringify(sorted));
}

/**
 * 객체의 키를 재귀적으로 정렬
 */
function sortKeysDeep(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);
  if (obj === null || typeof obj !== "object") return obj;
  const result = {};
  Object.keys(obj).sort().forEach(k => {
    result[k] = sortKeysDeep(obj[k]);
  });
  return result;
}

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function defaultExportFilename() {
  const today = new Date().toISOString().slice(0, 10);
  return `allowance-backup-${today}.json`;
}
```

### 9.5 S-114: 데이터 가져오기

#### 가져오기 함수

```javascript
export async function importData(file, mode = "overwrite") {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { success: false, error: "INVALID_JSON" };
  }

  if (data.export_version !== 1) return { success: false, error: "VERSION_MISMATCH" };
  if (!data.calendars) return { success: false, error: "INVALID_SCHEMA" };

  // 체크섬 검증 (v3.2: export와 같은 정규화 함수 사용)
  const expected = data.checksum;
  const computed = await computeChecksum(data);
  if (expected !== computed) return { success: false, error: "CHECKSUM_MISMATCH" };

  const result = { success: true, applied: { settings: 0, categories: 0, calendars: 0 } };

  if (mode === "overwrite") {
    // 앱 키만 삭제 (corrupted_* 백업 포함 — v3.4)
    Object.keys(localStorage)
      .filter(k =>
        k === "settings_v1" || k === "meta_v1" || k === "custom_categories_v1" ||
        k.startsWith("calendar_v1_") ||
        k.includes("_corrupted_")   // 손상 백업도 정리
      )
      .forEach(k => localStorage.removeItem(k));
  }

  if (data.settings && (mode === "overwrite" || !localStorage.getItem("settings_v1"))) {
    localStorage.setItem("settings_v1", JSON.stringify(data.settings));
    result.applied.settings = 1;
  }
  if (data.meta && (mode === "overwrite" || !localStorage.getItem("meta_v1"))) {
    localStorage.setItem("meta_v1", JSON.stringify(data.meta));
  }
  if (data.custom_categories) {
    if (mode === "overwrite") {
      localStorage.setItem("custom_categories_v1", JSON.stringify(data.custom_categories));
      result.applied.categories = data.custom_categories.categories?.length ?? 0;
    } else {
      // 병합
      const existing = JSON.parse(localStorage.getItem("custom_categories_v1") || '{"categories":[],"version":1}');
      data.custom_categories.categories.forEach(c => {
        if (!existing.categories.some(e => e.name === c.name)) {
          existing.categories.push(c);
          result.applied.categories++;
        }
      });
      localStorage.setItem("custom_categories_v1", JSON.stringify(existing));
    }
  }
  Object.entries(data.calendars).forEach(([ym, cal]) => {
    const [y, m] = ym.split("-");
    const key = `calendar_v1_${y}_${m}`;
    if (mode === "overwrite" || !localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(cal));
      result.applied.calendars++;
    }
  });

  return result;
}
```

### 9.6 S-203 카테고리 관리

```
┌─ 🏷 카테고리 관리 ──────────[×]┐
│                                  │
│ 기본 카테고리 (수정 불가, 9개)    │
│  📕 교재비, 🎒 체험학습, ...     │
│                                  │
│ 내가 추가한 카테고리             │
│  🎵 동아리 회비    [✏][🗑]      │
│                                  │
│       [+ 새 카테고리 추가]         │
│                                  │
│ ※ [✏] 수정: 인라인 편집 모드     │
│ ※ [🗑] 삭제: 확인 모달 표시      │
│                                  │
│ 사용 통계 (전체 기간):           │
│  🎒 체험학습     12건            │
│  📚 교재비        8건            │
│                                  │
│ [사용 안 한 사용자 카테고리 정리] │
└──────────────────────────────────┘
```

#### [✏] 카테고리 수정 — 인라인 편집 (v3.4)

1. [✏] 클릭 → 해당 행이 인라인 편집 모드로 전환
2. 이름: `<input>` (기존 값 pre-fill, maxLength=20)
3. 아이콘: 클릭 시 이모지 피커 팝오버 (S-105와 동일 COMMON_EMOJIS)
4. [저장] / [취소] 인라인 버튼
5. 검증: 이름 1~20자, 기본 9개 + 다른 사용자 카테고리와 중복 불가
6. 저장 시 `custom_categories_v1` 업데이트 + 기존 calendar 데이터의 해당 카테고리명도 일괄 변경
7. 한 번에 하나만 편집 가능 (다른 행 [✏] 비활성)

#### [🗑] 카테고리 삭제 — 확인 모달 (v3.4)

1. [🗑] 클릭 → 확인 모달 표시
2. 사용 중인 카테고리(임시항목에서 참조)인 경우:
   - 경고 메시지: "이 카테고리를 사용하는 임시 항목이 {N}건 있습니다. 삭제하면 해당 항목의 카테고리가 '미분류'로 변경됩니다."
   - [삭제] [취소] 버튼
3. 미사용 카테고리: "'{name}' 카테고리를 삭제하시겠습니까?" + [삭제] [취소]
4. 삭제 시: `custom_categories_v1`에서 제거 + 사용 중이었으면 해당 임시항목의 category를 "미분류"로 변경
5. S-301 "✅ 카테고리 삭제됨"

#### 통계·정리 함수

```javascript
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
```

---

## 10. 1단계 빌드·배포·운영

### 10.1 기술 스택 확정

| 영역 | 선택 | 버전 |
|---|---|---|
| 프레임워크 | React | 18.x |
| 빌드 도구 | Vite | 5.x |
| 언어 | JavaScript (TypeScript types/index.ts만) | - |
| 스타일 | Tailwind CSS + CSS 변수 | 3.x |
| 테스트 | Vitest | 1.x |
| 패키지 | npm | - |
| 호스팅 | GitHub Pages | - |

### 10.2 폴더 구조

```
allowance-mvp/
├── public/
│   └── holidays.json                    # 3.4 데이터
├── src/
│   ├── components/
│   │   ├── App.jsx
│   │   ├── MainScreen.jsx               # S-001
│   │   ├── CalendarGrid.jsx
│   │   ├── CalendarCell.jsx
│   │   ├── SummaryTable.jsx             # S-401
│   │   ├── MonthNavigator.jsx
│   │   ├── modals/
│   │   │   ├── SettingsModal.jsx        # S-101/S-102
│   │   │   ├── CellEditModal.jsx        # S-103
│   │   │   ├── ExtraItemForm.jsx        # S-104
│   │   │   ├── NewCategoryModal.jsx     # S-105
│   │   │   ├── ConfirmDirtyModal.jsx    # S-106
│   │   │   ├── ConfirmDeleteModal.jsx   # S-107
│   │   │   ├── StorageFullModal.jsx     # S-108
│   │   │   ├── DataCorruptedModal.jsx   # S-109
│   │   │   ├── ClipboardFallbackModal.jsx # S-111
│   │   │   ├── DiagnosticScreen.jsx     # S-112
│   │   │   ├── ExportModal.jsx          # S-113
│   │   │   └── ImportModal.jsx          # S-114
│   │   ├── drawers/
│   │   │   ├── NotesDrawer.jsx          # S-201
│   │   │   ├── MonthSelector.jsx        # S-202
│   │   │   └── CategoryManager.jsx      # S-203
│   │   ├── widgets/
│   │   │   ├── Toast.jsx                # S-301~303
│   │   │   └── CellTooltip.jsx          # S-402
│   │   └── inputs/
│   │       ├── CurrencyInput.jsx
│   │       ├── WeekdayPicker.jsx
│   │       └── RadioGroup.jsx
│   ├── utils/
│   │   ├── calculator.js                # 4.1
│   │   ├── calculator.test.js           # 4.2
│   │   ├── messageTemplate.js           # 4.3
│   │   ├── messageTemplate.test.js      # 4.5
│   │   ├── storage.js                   # 4.6
│   │   ├── validators.js                # 4.7
│   │   ├── idGenerator.js               # 4.8
│   │   ├── clipboard.js                 # 4.9
│   │   ├── diagnostics.js               # 9.3
│   │   ├── exportImport.js              # 9.4-9.5
│   │   └── categoryStats.js             # 9.6
│   ├── constants/
│   │   ├── categories.js                # 3.5
│   │   └── fares.js                     # 3.6
│   ├── hooks/
│   │   ├── useSettings.js
│   │   ├── useCalendar.js
│   │   ├── useToast.js
│   │   └── useSwipeToClose.js
│   ├── types/
│   │   └── index.ts                     # 3.2
│   ├── index.css                        # 6.5 디자인 토큰
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore                           # v3.2 신규
├── .eslintrc.json                       # v3.2 신규
├── .github/
│   └── workflows/
│       └── deploy.yml
├── README.md
├── CHANGELOG.md
└── LICENSE
```

#### .gitignore (실파일, v3.2 신규)

```
# Dependencies
node_modules/

# Build output
dist/
.vite/

# Environment files
.env
.env.local
.env.*.local

# OS / Editor
.DS_Store
Thumbs.db
.idea/
.vscode/*
!.vscode/extensions.json

# Logs
*.log
npm-debug.log*
yarn-debug.log*

# Testing
coverage/
.nyc_output/

# Vitest
__test_artifacts__/
```

#### .eslintrc.json (실파일, v3.2 신규)

```json
{
  "root": true,
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "settings": {
    "react": {
      "version": "18.2"
    }
  },
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "overrides": [
    {
      "files": ["*.test.js", "*.test.jsx"],
      "env": {
        "vitest-globals/env": true
      }
    }
  ]
}
```

### 10.3 package.json (실파일)

```json
{
  "name": "allowance-mvp",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite --port 4090",
    "build": "vite build",
    "preview": "vite preview --port 4091",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext .js,.jsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@vitest/ui": "^1.1.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "jsdom": "^23.0.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.1.0"
  }
}
```

### 10.4 vite.config.js (실파일)

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/allowance-mvp/",  // GitHub Pages 서브 경로
  plugins: [react()],
  server: {
    port: 4090,
    open: true
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false
  },
  test: {
    globals: true,
    environment: "jsdom"
  },
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(process.env.npm_package_version || "1.0.0")
  }
});
```

### 10.5 tailwind.config.js (실파일)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // CSS 변수와 동기화 (v3.2: spacing, borderRadius, fontSize 보강)
      colors: {
        // 기본·텍스트
        bg: "var(--color-bg)",
        "bg-secondary": "var(--color-bg-secondary)",
        "bg-card": "var(--color-bg-card)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        // 강조
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        secondary: "var(--color-secondary)",
        // 의미
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        // 캘린더 전용
        holiday: "var(--color-holiday)",
        saturday: "var(--color-saturday)",
        // 보더
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)"
      },
      fontFamily: {
        sans: ["var(--font-family)"]
      },
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)"
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)"
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)"
      },
      zIndex: {
        base: "0",
        tooltip: "var(--z-tooltip)",
        drawer: "var(--z-drawer)",
        backdrop: "var(--z-backdrop)",
        "modal-1": "var(--z-modal-1)",
        "modal-2": "var(--z-modal-2)",
        "modal-3": "var(--z-modal-3)",
        toast: "var(--z-toast)"
      }
    }
  },
  plugins: []
};
```

### 10.6 postcss.config.js (실파일)

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

### 10.7 GitHub Actions 배포 (실파일)

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 10.8 index.html (실파일)

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#1565C0" />
    <title>가족 용돈 청구 (1단계 MVP)</title>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.jsx"></script>
  </body>
</html>
```

### 10.9 README.md (실파일)

> 아래 README.md 내용은 4-tilde(`~~~~`) fence로 감싸 내부에 일반 backtick 코드 블록을 그대로 보존했다. 실제 파일에는 4-tilde fence를 빼고 내부 backtick(```` ``` ````)을 그대로 사용한다.

~~~~markdown
# 가족 용돈 청구 (1단계 MVP)

본인 사용용 캘린더 기반 용돈 청구 도구.

## 시작

```bash
npm install
npm run dev      # localhost:4090
```

## 빌드

```bash
npm run build    # → dist/
npm run preview
```

## 테스트

```bash
npm test         # 단위 테스트 실행
```

## 배포

main 브랜치에 push하면 GitHub Actions가 자동 배포.

## 관리자 모드

`?admin=1` URL 또는 콘솔 `window.openAdmin()`.

## 라이선스

MIT
~~~~

### 10.10 출시 체크리스트 (1페이지)

```
[기능]
[ ] F1-1 ~ F1-9 인수 조건 모두 통과
[ ] holidays.json 2026~2030 검증
[ ] settings_v1, calendar_v1, custom_categories_v1, meta_v1 스키마 검증

[테스트]
[ ] calculator.test.js 통과
[ ] messageTemplate.test.js 통과
[ ] 직접 5개 사용자 여정 통과
   1. 첫 사용자 → 청구 메시지 복사
   2. 학기 변경 (학교 요일/단가 변경)
   3. 미래 달 미리 등록
   4. 스토리지 가득 → 정리
   5. 손상 데이터 복구

[디바이스]
[ ] iPhone Safari
[ ] Galaxy Chrome
[ ] MacBook Safari/Chrome
[ ] Windows Chrome/Edge

[배포]
[ ] GitHub Pages 활성화
[ ] GitHub Actions 성공
[ ] /allowance-mvp/ 경로 정상 동작
[ ] HTTPS 정상

[관리자]
[ ] ?admin=1 진입 정상
[ ] 데이터 내보내기/가져오기 정상
[ ] 체크섬 검증 통과
[ ] 카테고리 관리 정상
```

---

## 11. 1단계 → 2단계 마이그레이션 사전 설계

### 11.1 매핑 표

| 1단계 키 | 2단계 DB 테이블 | 매핑 |
|---|---|---|
| `settings_v1` | `child_settings` | 1:1 (자녀 ID 신규 발급) |
| `calendar_v1_*.cells.{date}.extra_items` | `extra_items` | 1:N (date, child_id 추가) |
| `calendar_v1_*.cells.{date}.memo` | `memos` | 1:1 |
| `custom_categories_v1.categories` | `custom_categories` | N:N (family_id 추가) |
| `meta_v1` | (사용 안 함) | 메타 신규 생성 |

### 11.2 마이그레이션 흐름

```
[2단계 첫 진입]
1. localStorage 검사
   - settings_v1 존재 → 마이그레이션 가능 안내
2. 사용자: "기존 데이터 가져오기" 동의
3. 가족 만들기 (가족 코드 자동 생성)
4. 본인을 자녀(또는 부모)로 등록
5. POST /api/migrations/from-local
   Body: { settings, calendars, custom_categories }
6. 서버 검증 + 데이터 삽입
7. 응답: 마이그레이션 성공
8. 1단계 localStorage 90일 보존 (안전망)
9. 90일 후 자동 정리 (사용자 안내 후)
```

### 11.3 검증

마이그레이션 후 다음을 비교:
- 임시 항목 개수 일치
- 합계 금액 일치 (각 월별)
- 카테고리 목록 일치

불일치 시 사용자 안내 + 재시도.

### 11.4 실패 처리

- 1단계 데이터 그대로 유지 (삭제 X)
- 사용자가 2단계 사용 거부 시 1단계로 복귀 가능
- 단, 2단계 사용자는 1단계로 돌아갈 수 없음 (단방향)

---

## 12. 2~4단계 로드맵 (개요)

> 2~4단계는 1단계 출시·사용 후 별도 PRD로 상세화. 여기서는 **방향성과 핵심 기능 목록**만 명시.

### 12.1 2단계 (Growth) — 가족 양방향, 4~5주

#### 핵심 변화

- **부모 화면 추가**: 청구 검토·승인·거절·지급 흐름
- **클라우드 동기화 시작**: 1단계 로컬 → 가족 그룹 단위 클라우드
- **상태 머신 도입**: 청구 = `draft → pending → approved → paid` (또는 `rejected`)

#### 기능 14개 (대략)

| ID | 기능 |
|---|---|
| F2-1 | 자녀가 청구 제출 (1단계의 메시지 복사를 시스템 내부 액션으로 전환) |
| F2-2 | 부모가 청구 검토 (승인/거절) |
| F2-3 | 거절 사유 입력 |
| F2-4 | 부모가 지급 처리 (시스템 내부 기록) |
| F2-5 | 청구 이력 조회 |
| F2-6 | 추가 용돈 별도 요청 흐름 |
| F2-7 | 부분 입금 처리 |
| F2-8 | 차감 처리 (다음 달로 이월) |
| F2-9 | 클라우드 저장 (Supabase 또는 Firebase) |
| F2-10 | 가족 코드 + 가족 그룹 |
| F2-11 | 알림 (PWA Push 또는 카톡 webhook) |
| F2-12 | 수령 확인 |
| F2-13 | 메모 (1단계 메모 + 부모↔자녀 댓글) |
| F2-14 | 미리보기 + 상태 머신 검증 |

#### 데이터 변화

- 로컬스토리지 → 클라우드 DB (Postgres 또는 Firestore)
- 1단계 로컬 데이터는 마이그레이션 후 90일 보존

### 12.2 3단계 (Account System) — 정식 계정, 3~4주

#### 핵심 변화

- 회원가입 / 로그인 / 비밀번호 재설정 (이메일 또는 SNS)
- 가족 그룹 + 7일 만료 초대 코드
- 약관 / 개인정보 처리방침 (KISA 가이드 준수)
- 14세 미만 동의 (4단계 본격 도입 전 사전 처리)

#### 기능 11개

F3-1 회원가입, F3-2 로그인, F3-3 비밀번호 재설정, F3-4 계정 정보, F3-5 (1단계 F1-9에 통합되어 제거), F3-6 가족 그룹+초대, F3-7 7일 만료, F3-8 약관, F3-9 마이그레이션, F3-10 보안 정책, F3-11 이메일 인증, F3-12 가족 인원 제한.

### 12.3 4단계 (Production) — 일반 공개, 5~7주

#### 핵심 변화

- 일반 사용자 대상 출시
- 감사 로그 / 동시 처리 충돌 / 부분 승인 / 임시저장 / 거절 자동만료 등 운영 기능
- 통계, PDF 학사일정 가져오기, 영수증, 한도 경고
- 개인정보 보호 강화 (14세 미만 동의·데이터 삭제 권리)
- 데이터 내보내기 (1단계의 S-113 확장)

#### 기능 16개

F4-1~F4-16 (가족 구성원 관리, 데이터 삭제/탈퇴, 14세 미만 동의, 감사로그, 동시 처리 충돌, 부분 승인, 임시저장, 거절 자동만료, 영수증, 한도 경고, 알림 확장, 통계, PDF 학사일정, 데이터 내보내기, 에러 처리, 문의)

### 12.4 누적 일정

| 단계 | 누적 기간 | 누적 기능 수 |
|---|---|---|
| 1단계 | 2주 | 9 |
| 2단계 | 6~7주 | 23 |
| 3단계 | 10~11주 | 33 (F3-5 통합 후 32) |
| 4단계 | 15~18주 | 48 (F3-5 통합 후) |

---

## 13. 부록

### 13.1 의사결정 로그 (Decision Log)

| ID | 결정 | 근거 | 대안 |
|---|---|---|---|
| D-001 | 1단계는 단일 사용자 (본인) 한정 | 빠른 출시 + 검증 | 처음부터 가족 단위 → 4주+ 소요 |
| D-002 | LocalStorage (백엔드 X) | 인터넷 불필요, 가벼움 | IndexedDB → 1단계 분량 과함 |
| D-003 | React 18 + Vite | Hex님 익숙, 단일 HTML 빌드 가능 | Svelte → 학습 비용 |
| D-004 | TypeScript는 types/index.ts만 | 1단계 단순화 | 풀 TS → 작업량 증가 |
| D-005 | 청소년 카드 1,160원 기본값 | 경기버스 청소년 일반형 (2025-10-25) | 1,200원 (서울) → Hex님 거주지 |
| D-006 | 미래 +12개월 한도 | 학사일정 1년 단위 | 무제한 → 의미 없음 |
| D-007 | 셀당 임시 항목 ≤ 3개 | 셀 표시 가독성 | 무제한 → UI 복잡 |
| D-008 | 메모 ≤ 200자 | 한 줄짜리 메모 + 여유 | 1000자 → 카톡 메시지에 부담 |
| D-009 | 메시지 템플릿 1개 (정중 모드) | 사용 후 변형 결정 | 3종 → 결정 못 하면 보류 |
| D-010 | 다크 모드 4단계 이후 | 1단계 불필요 | 1단계 도입 → 분량 증가 |
| D-011 | 시간대 = KST 표시, UTC 저장 | 한국 사용자 한정 | 시스템 시간대 따름 → 이중 시각 혼동 |
| D-012 (v3.1) | cleanupOldCalendars는 미래 캘린더 절대 보호 | 사용자가 미리 입력해둔 데이터 손실 방지 | 단순 cutoff 비교 → 미래 데이터도 삭제될 위험 |
| D-013 (v3.1) | DEFAULT_CATEGORIES의 id = name | 임시 항목 category 필드 일관성 | 별도 ID → 마이그레이션·표시 복잡 |
| D-014 (v3.1) | settings 변경 시 과거 임시 항목 보존, 자동 항목만 새 단가 적용 | 사용자가 입력한 데이터는 사용자 자율 | 모든 과거 데이터 재계산 → 의도 손상 |
| D-015 (v3.1) | 모바일 viewport `100dvh` + safe-area-inset | iOS Safari 가상 키보드 + 홈 인디케이터 대응 | `100vh` → 키보드 올라오면 잘림 |
| D-016 (v3.2) | `fare` 0~100,000 범위로 통일 (days=0이면 0 강제) | TypeScript 타입과 검증 로직 일관성 | days=0이지만 fare>0 허용 → 의미 없는 값 저장 |
| D-017 (v3.2) | `ExtraItem.category`는 항상 카테고리 **name** 저장 | 사용자가 카테고리 삭제해도 임시 항목 표시 깨지지 않음 | ID 저장 → 카테고리 삭제 시 표시 깨짐 |
| D-018 (v3.2) | `cleanupOldCalendars` Date 객체 비교 | 문자열 비교의 잠재적 사이드 이펙트 제거 (예: 키 형식 변경 시) | 문자열 비교 → 미래 키 형식 도입 시 위험 |
| D-019 (v3.2) | Export/Import 체크섬 정규화 (키 정렬) | `JSON.stringify`의 키 순서 비결정성으로 같은 데이터 다른 해시 방지 | 정렬 안 함 → 환경 따라 체크섬 불일치 가능 |
| D-020 (v3.2) | `holidays.json`은 모듈 캐시 (앱 생애 1회 fetch) | SPA 환경에서 새로고침 안 하는 한 데이터 변경 X | 매 호출마다 fetch → 불필요한 네트워크 |
| D-021 (v3.3) | 사용자 정의 카테고리 삭제·수정 시 임시 항목의 `category` 필드는 갱신 안 함 | 1단계 단순화. ID 아닌 name 저장 정책의 부수 효과 — 카테고리 삭제 후 임시 항목은 이름은 유지·아이콘은 ✨ fallback | 일괄 마이그레이션 → 1단계 분량 증가, 2단계 이후 도입 검토 |
| D-022 (v3.3) | `holidays`는 `getHolidays()` 직접 호출, props 전달 안 함 | props drill 회피, 모듈 캐시가 SPA 생애주기와 같음 | props drill → 깊은 컴포넌트 트리에 전부 전달 부담 |
| D-023 (v3.3) | S-105 열린 상태에서 S-104의 모든 입력 disabled (이전 카테고리 백업 포함) | 사용자가 카테고리 추가 도중 S-104 입력값 변경 시 혼선 방지. 백업 패턴으로 취소 시 정확 복원 | 비활성화 안 함 → 새 카테고리 추가 중 다른 필드 입력 가능 (혼선) |

### 13.2 글자수 / 한도 매트릭스

| 항목 | 한도 | 비고 |
|---|---|---|
| 자녀 이름 | 0~20자 | 빈 값 허용 |
| 학교/학원 단가 | 0~100,000 | days 0개면 0, 1개+이면 1~100,000 (v3.2) |
| 기본 용돈 | 0~1,000,000 | 정수 |
| 임시 항목 이름 | 1~50자 | |
| 임시 항목 금액 | 1~10,000,000 | 정수 |
| 메모 | 0~200자 | |
| 셀당 임시 항목 | 0~3개 | |
| 사용자 정의 카테고리 이름 | 1~20자 | 중복 X |
| 미래 달 표시 한도 | 오늘 +12개월 | |
| 과거 달 표시 한도 | 무제한 | 1단계 한정 |

### 13.3 에러 코드 매트릭스

| 코드 | 발생 위치 | 처리 |
|---|---|---|
| `VALIDATION_REQUIRED` | 폼 검증 | 인라인 메시지 |
| `VALIDATION_TOO_LONG` | 입력 한도 | 인라인 메시지 |
| `VALIDATION_OUT_OF_RANGE` | 숫자 범위 | 인라인 메시지 |
| `STORAGE_QUOTA_EXCEEDED` | localStorage.setItem | S-108 정리 안내 |
| `STORAGE_DISABLED` | 시크릿 모드 | 시작 시 안내 모달 |
| `STORAGE_PARSE_ERROR` | JSON.parse | 자동 백업 + S-109 (settings 손상 시만) |
| `MAX_EXTRA_ITEMS_REACHED` | 4번째 추가 시도 | S-303 토스트 + 버튼 비활성 |
| `MAX_FUTURE_MONTHS` | +12개월 도달 | S-303 토스트 |
| `CLIPBOARD_DENIED` | 클립보드 거부 | S-111 폴백 |
| `CLIPBOARD_UNSUPPORTED` | API 미지원 | S-111 폴백 |
| `EMPTY_TOTAL` | 합계 0 | 버튼 비활성 |
| `CHECKSUM_MISMATCH` | 가져오기 검증 | 에러 모달 |
| `VERSION_MISMATCH` | 가져오기 버전 | 에러 모달 |

### 13.4 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-05-01 | 초안 (1~4단계 통합, 추상 수준) |
| v2.0 | 2026-05-01 | 1단계 상세 명세 추가 (4500줄) |
| v2.1 | 2026-05-01 | 1단계 화면 시스템·인터랙션 보강 (12000줄) |
| v3.0 | 2026-05-01 | 추상 서술·중복·의미 없는 분량 정리. 1단계는 실데이터·실동작 코드·빌드/배포 실파일·단위 테스트로 구체화. 2~4단계는 로드맵 1장으로 통합. 분량 3,282줄로 축소. |
| v3.1 | 2026-05-01 | v3.0 검토 후 보정. 6개 버그 수정 + 8개 누락 영역 보강. |
| v3.2 | 2026-05-01 | 외부 검토 19건(🔴 10건 + 🟡 9건) 전면 반영. 주요 변경: fare 0~100,000 통일, F1-9 Settings 영향 범위, ExtraItem.category=name 정책, 빈 셀 delete, cleanupOldCalendars Date 비교, holidays.js 신설, 체크섬 정규화, S-202 4×3 그리드, validateMemo 통일, S-104↔S-105 흐름, 중첩 모달 ESC LIFO, tailwind.config 매핑, S-105 이모지 그리드, recoverFromBackup, getWeekday KST, .gitignore/.eslintrc.json. D-016~D-020 추가. |
| **v3.3** | **2026-05-02** | **최종 검토 후 7건 보정. 🔴 Critical 1건: 2026 부처님오신날 5/25 → 5/24(일)로 정정 + 5/25(월) 대체공휴일 추가 (한국천문연구원 공식). 🟡 Medium 3건: addCustomCategory 함수 신설(4.12) + 단위 테스트 4건, S-104 disabled 상태 코드 명시(state 패턴), holidays.json 주의사항(지방선거·임시공휴일) 보강. 🟢 Low 3건: README 4-tilde fence로 헤딩 파싱 문제 해결, validateMemo 시그니처 안내 노트, holidays 접근 정책 단일화(getHolidays 직접 호출, BootResult.holidays deprecated). 의사결정 로그 D-021~D-023 추가.** |

---

**문서 끝 (v3.3)**
