# BACKLOG — 진행 예정·진행 중 과업

진행 예정·진행 중 과업만 둔다. 종결·폐기 시 이 파일에서 제거하고 `TASK_HISTORY.md`로 옮긴다.

## 상태 라벨
📋 계획 / 🔄 진행중 / ⏸️ 보류

## 작성 원칙
- 과업 ID는 `T-NNN` 형식으로 순번을 부여한다.
- 등록일과 상태 변경 일자를 기록한다 (상대 날짜 금지 — 절대 날짜로).
- 정책에서 파생된 과업은 `POLICIES.md`의 정책 번호를 참조 링크한다.

---

## T-001 — 인증 시스템 전환 (PIN → 아이디+비밀번호)

### 🏷️ 상태
🔄 진행중 (시급도: 🔴 높음) — 코드 구현 완료, 브라우저 실테스트 대기

### 📅 등록일
2026-05-21

### 🎯 배경
- 베포 대비 보편적 로그인 시스템으로 전환 필요
- PIN 선택 방식 → 아이디+비밀번호 입력 방식

### ✅ 완료 기준
- [x] authStore.js: 아이디/비밀번호 인증 + 보안 질문 기반 비밀번호 초기화
- [x] LoginScreen.jsx: 아이디+비밀번호 로그인 폼 + 비밀번호 찾기
- [x] SignupScreen.jsx: 4단계 (유형→개인정보→아이디/비밀번호→보안질문)
- [x] initApp.js: migrateToPasswordAuth() 호출 추가
- [x] App.jsx: PinResetModal 제거
- [x] DiagnosticScreen.jsx: 비밀번호 관리 버튼 제거
- [x] exportImport.js: password 필드 내보내기 제외
- [x] storage.js: 키 패턴 업데이트
- [x] 테스트 743건 전체 통과 (v9.0.0)
- [ ] 브라우저 실테스트 (회원가입 → 로그인 → 비밀번호 찾기 → 기존 계정 마이그레이션)

### ⚠️ 위험
- 기존 2개 테스트 계정 자동 마이그레이션 (child01/Child1234!, parent01/Parent1234!)
- 레거시 PIN 인증 코드는 하위 호환용으로 잔류 (verifyPin)

### 🔗 관련
- 정책 #001 (인증 정책)

## T-002 — 레거시 PIN 코드 완전 제거

### 🏷️ 상태
📋 계획 (시급도: 🟡 중간)

### 📅 등록일
2026-05-21

### 🎯 배경
- T-001 완료 후, 레거시 호환용으로 남긴 PIN 관련 코드/파일 정리
- PinInput.jsx, PinResetModal.jsx 등 더 이상 사용하지 않는 컴포넌트 제거

### ✅ 완료 기준
- [ ] PinInput.jsx 삭제
- [ ] PinResetModal.jsx 삭제
- [ ] authStore.js에서 레거시 verifyPin, hashPinV1~V3, legacyHashVariants 제거
- [ ] 테스트 전체 통과 확인

### ⚠️ 위험
- 기존 PIN 해시로 저장된 계정이 남아있을 수 있음 → migrateToPasswordAuth 완전 실행 후에만 진행

### 🔗 관련
- T-001 (선행 과업)
