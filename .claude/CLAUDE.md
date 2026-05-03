# 가족 용돈관리 시스템

## 불변 원칙
1. 실제 동작만 완료다 — 코드 수정이 아닌 꼬마 브라우저 확인이 완료
2. 완료 선언 2단계 — [CODE_READY] → [VERIFY_NEEDED] → [CONFIRMED](꼬마만)
3. 모르면 모른다고 한다
4. PRD 기반 개발 — 땜질식 수정 금지

## 절대 금지
- npm run dev / build / node index.js — 꼬마가 직접 실행
- kill / pkill / lsof — 금지
- git push --force — 금지
- 파일 전체 재작성 — str_replace만
- Claude가 [CONFIRMED] 선언 — 꼬마만 가능

## 코딩 전 필수
1. 변경 예정 파일 목록 + 영향범위 출력
2. git 상태 확인
3. 꼬마 Y 승인 후 코딩 시작

## 코딩 원칙 (기존 claude.md.txt 통합)
1. Think Before Coding — 가정을 명시, 불확실하면 질문
2. Simplicity First — 요청받은 것만, 추측성 코드 금지
3. Surgical Changes — 변경 요청 부분만 수정, 인접 코드 건드리지 않기
4. Goal-Driven Execution — 검증 가능한 목표 설정 후 구현

## 세션 종료 시 브리핑 생성
1. 완료된 작업 2. 변경 파일 3. 다음 브리핑(3줄) 4. 미해결 5. VERIFY_NEEDED 6. 커밋 현황

## 프로젝트 정보
- 경로: C:\프로젝트\03-용돈관리
- PRD: PRD_가족용돈관리시스템_v3.1.md (최신)
- 기술스택: PRD 확정 후 결정 예정
