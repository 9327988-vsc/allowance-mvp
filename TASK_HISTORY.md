# TASK_HISTORY — 완료·폐기 과업 이력

`BACKLOG.md`에서 종결·폐기된 과업의 이력을 보관한다. 관리 일자와 커밋 해시를 함께 기록해, 시간이 지나도 git 이력과 대조해 회복할 수 있게 한다.

## 상태 라벨
✅ 완료 / ♻️ 수정→폐기 / 🗑️ 폐기 / ❌ 중단

## 작성 원칙
- 등록일·착수일·종결일을 모두 기록한다 (절대 날짜).
- 관련 커밋 해시를 기록한다.
- 폐기된 과업은 판단 근거도 남긴다 (향후 유사 결정 시 참조).

---

## T-001 — 인증 시스템 전환 (PIN → 아이디+비밀번호) ✅

- **등록일**: 2026-05-21
- **착수일**: 2026-05-21
- **종결일**: 2026-05-23
- **상태**: ✅ 완료
- **커밋**: `d5d20fd` (v9.0.0 기본 구현), `677cbcd` (v9.1.0 배포 차단 이슈 5건 수정)
- **내용**: PIN 선택 → 아이디+비밀번호 인증 전환. PBKDF2-SHA256 해시, 보안 질문 기반 비밀번호 초기화, 5회 실패 잠금, 레거시 자동 마이그레이션.
- **미완료 항목**: 브라우저 실테스트 (수동 검증 필요)
- **관련 정책**: #001 Phase 1 완료

## T-002 — 레거시 PIN 코드 완전 제거 ✅

- **등록일**: 2026-05-21
- **착수일**: 2026-05-23
- **종결일**: 2026-05-23
- **상태**: ✅ 완료
- **커밋**: `40ebea7`
- **내용**: PinInput.jsx, PinResetModal.jsx 삭제. authStore에서 verifyPin, setUserPin 등 레거시 함수 7개 제거. -224줄.
- **관련 정책**: #001 Phase 2 완료

## T-004 — Red Team 잔여 이슈 정리 ✅

- **등록일**: 2026-05-23
- **착수일**: 2026-05-23
- **종결일**: 2026-05-23
- **상태**: ✅ 완료
- **커밋**: `0d11860` (코드 스플리팅 + 다크모드 색상), `5812f08` (BACKLOG 등록)
- **내용**: Red Team 검수 보고서 107건 전수 분류. Critical 14건 + High 30건 전부 수정 완료 확인. Medium 이슈 7건(C-13, H-7, H-14, H-15, H-16, H-20, H-21) 코드 실측 검증 → 이미 수정됨 또는 오탐 확인. 유효 잔여 5건(C-3, C-11, C-14, M-34, M-35)을 T-005로 등록.
- **분류 결과**:
  - 이미 수정: 102건 (Critical 14 + High 30 + Medium/Low 대부분)
  - 오탐(false positive): H-15(ClaimHistoryModal 무한루프 — deps 안정), H-16(FamilyInfoModal deps — 표준 패턴)
  - 잔여 유효: 5건 → T-005로 이관

## T-005 — Red Team 잔여 중간 이슈 수정 ✅

- **등록일**: 2026-05-23
- **착수일**: 2026-05-23
- **종결일**: 2026-05-23
- **상태**: ✅ 완료
- **커밋**: `b85c16b` (C-14 holidays toast + M-34 OS 다크모드 런타임 감지)
- **내용**: T-004에서 이관된 잔여 5건 전부 처리.
  - C-3: 서버 추가 청구 60초 시간 창 중복 방어 추가
  - C-11: 서버 상태 머신 `paid: []` → `paid: ["received"]` 수정
  - C-14: initApp holidays 실패 시 warning toast 추가
  - M-34: theme.js에 matchMedia change 리스너 추가 (OS 다크모드 런타임 자동 반영) + ErrorBoundary shadow CSS 변수 전환
  - M-35: 이미 완료 확인 (tabLayout.css 전역 prefers-reduced-motion)

## T-003 — 오프라인 동작 강화 (PWA) ✅

- **등록일**: 2026-05-23
- **착수일**: 2026-05-23
- **종결일**: 2026-05-23
- **상태**: ✅ 완료
- **버전**: v9.2.0
- **내용**: IndexedDB 기반 오프라인 큐 + 읽기 캐시 + 오프라인 배너 구현.
  - `offlineStore.js`: IndexedDB 래퍼 (api_cache + offline_queue 2개 store, 큐 구독, replay 로직)
  - `kvAdapter.js`: GET 응답 자동 캐시 + 오프라인 시 캐시 폴백, 쓰기 실패 시 큐에 자동 저장
  - `OfflineBanner.jsx`: 오프라인 상태 + 대기 작업 수 실시간 표시
  - 재접속 시 큐 자동 replay + CONFLICT/DUPLICATE 충돌 자동 건너뜀 + toast 알림
  - `errorMessages.js`: QUEUED_OFFLINE 메시지 추가
- **신규 파일**: 2개 (offlineStore.js, OfflineBanner.jsx)
- **수정 파일**: 3개 (kvAdapter.js, App.jsx, errorMessages.js)
