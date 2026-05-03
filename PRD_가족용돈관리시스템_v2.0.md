# 가족용 캘린더 기반 용돈 청구 관리 시스템 PRD

**문서 버전:** v2.0
**작성일:** 2026-05-01
**문서 종류:** Product Requirements Document
**대상 단계:** 1단계 ~ 4단계 통합 (1단계 상세, 2~4단계 개요)

**v2.0 변경 사항:**
- 1단계 PRD를 **개발 착수 가능한 상세 수준**으로 재작성
  - 각 기능마다 사용자 스토리, 정상/대체/예외 흐름, 검증 규칙, UI 구조, 데이터 처리, 비즈니스 로직, 인수 조건, 테스트 케이스를 모두 포함
  - 1단계 분량: 약 1,400줄 → 4,500줄 (3배 확장)
- 2~4단계는 v1.0 수준 유지 (개요 + 핵심 요구사항)
- 1단계 출시 후 사용 경험을 바탕으로 2단계 PRD를 별도로 상세화 예정

---

## 목차

1. 프로젝트 개요
2. 개발 사상 및 전략
3. 문제 정의 및 솔루션
4. 시장 분석 및 차별점
5. 사용자 정의
6. 시스템 핵심 원칙
7. 단계별 개발 로드맵
8. 1단계 상세 명세 (MVP)
9. 2단계 상세 명세 (Growth)
10. 3단계 상세 명세 (Account System)
11. 4단계 상세 명세 (Production)
12. 데이터 모델
13. 시스템 설계 (아키텍처)
14. 비기능 요구사항
15. 일정 및 마일스톤
16. 리스크 관리
17. 미결정 사항

---

## 1. 프로젝트 개요

### 1.1 프로젝트명

**가족용 캘린더 기반 용돈 청구 관리 시스템** (가칭)

### 1.2 한 줄 정의

자녀가 캘린더 기반으로 용돈을 자동 산정해 청구하고, 부모가 검토·승인·지급하는 부모-자녀 양방향 가족 SaaS

### 1.3 프로젝트 배경

기존에는 매달 자녀가 부모에게 용돈을 청구할 때 캘린더를 보면서 학교/학원 일수를 일일이 세고, 단가를 곱해 계산하는 수동 작업이 필요했다. 이 과정에서:

- 계산 오류가 가끔 발생함
- 부모-자녀 간 청구 내역이 카톡·구두로만 전달되어 추적이 어려움
- 추가 용돈, 차감, 부분 입금 같은 변동 사항을 체계적으로 관리할 도구가 부재

이러한 문제를 해결하기 위해 **캘린더 자동 산정 + 양방향 청구·검토 워크플로우** 기반의 가족용 용돈 관리 시스템을 개발한다.

### 1.4 프로젝트 목표

#### 단기 목표 (1단계)
- 자녀 본인의 매달 용돈 계산 자동화
- 카톡 등 외부 메신저로 청구 메시지 즉시 송신 가능

#### 중기 목표 (2~3단계)
- 가족 내부에서 청구·검토·지급의 완결된 양방향 흐름 제공
- 다른 가족도 사용 가능한 정식 서비스로 확장

#### 장기 목표 (4단계)
- 일반 사용자 누구나 사용 가능한 공개 서비스
- 관리·법적 안정성·자동화를 통한 운영 완성도 확보

### 1.5 프로젝트 범위

**포함되는 것:**
- 캘린더 기반 자동 용돈 산정
- 부모-자녀 양방향 청구·검토·지급 워크플로우
- 임시 항목, 추가 용돈, 차감, 부분 입금 처리
- 알림, 통계, 영수증 관리

**제외되는 것:**
- 실제 송금 기능 (외부 카톡·계좌이체 활용)
- 자녀용 카드 발급 (핀테크 영역 아님)
- 가계부 / 자녀 본인 지출 기록 (선택 기능, 후순위)
- 금융 교육 콘텐츠
- 위치 추적, 안심존
- 주식 투자, 저축 상품 연계

---

## 2. 개발 사상 및 전략

### 2.1 핵심 사상

> **"아주 간편한 프로그램으로 시작 → 사용 빈도와 만족도에 따라 점진적으로 고도화"**

### 2.2 사상의 의미

본 프로젝트는 본인 가족 사용을 우선 목표로 시작하되, 향후 다른 가족도 다운받아 사용할 수 있는 정식 서비스로 진화하는 것을 목표로 한다. 이를 위해 다음 원칙을 준수한다:

#### 원칙 1. 1단계는 의도적으로 가볍게
1단계에 너무 많은 기능을 넣으면 출시가 늦어지고, 실제 사용 피드백 없이 방향을 잃는다. 1단계는 핵심 가치 한 가지만 검증한다.

#### 원칙 2. 각 단계는 자연스러운 확장
이전 단계에서 다음 단계로 갈 때 기능 점프가 갑작스럽지 않아야 한다. 각 단계의 추가 기능은 그 단계의 정체성에 부합해야 한다.

#### 원칙 3. 각 단계는 완성된 프로그램
각 단계에서 출시하더라도 그 단계만으로 사용자가 완결된 가치를 얻을 수 있어야 한다. 어중간한 채로 다음 단계를 강제하지 않는다.

#### 원칙 4. 조기 도입 금지
"어차피 4단계에 추가될 거니까"라는 핑계로 1단계에 미리 욱여넣지 않는다. 단, 데이터 모델·아키텍처는 처음부터 확장 가능하게 설계한다.

### 2.3 빌드 순서

```
[1단계: 본인 도구]
  ↓ "잘 쓰이네"
[2단계: 가족 양방향]
  ↓ "다른 가족도 쓸 만하네"
[3단계: 정식 계정]
  ↓ "다른 가족 베타 검증"
[4단계: 일반 공개]
  ↓
[정식 출시]
```

### 2.4 단계별 사용자 확장

| 단계 | 사용자 | 확장 폭 |
|---|---|---|
| 1단계 | 본인 1명 | 단일 사용자 |
| 2단계 | 가족 1팀 (부모+자녀) | 양방향 |
| 3단계 | 여러 가족 | 다중 가족 격리 |
| 4단계 | 일반 사용자 | 공개 서비스 |

---

## 3. 문제 정의 및 솔루션

### 3.1 핵심 문제

#### 문제 1. 수동 계산의 비효율
매달 자녀가 캘린더를 보고 학교 등교일, 학원 등원일을 일일이 세어 단가와 곱하는 작업이 반복적이고 시간이 든다.

#### 문제 2. 계산 오류
수동 계산 과정에서 일수를 잘못 세거나, 공휴일을 빠뜨리거나, 곱셈 실수가 발생한다.

#### 문제 3. 청구 내역 추적 부재
부모-자녀 간 청구 내역이 카톡 메시지로만 전달되어 과거 기록을 찾기 어렵고, 분쟁 시 근거가 불충분하다.

#### 문제 4. 변동 사항 관리 부재
추가 용돈, 부분 입금, 차감 같은 변동 사항을 체계적으로 추적할 도구가 없다.

### 3.2 솔루션

#### 솔루션 1. 캘린더 자동 산정
사용자가 학교·학원 요일과 단가를 한 번 등록하면, 시스템이 자동으로 매달 캘린더를 채우고 합계를 계산한다. 공휴일은 자동 인식하여 제외한다.

#### 솔루션 2. 시각적 정산표
캘린더 셀에 그날 사용할 교통비를 표시하고, 화면 하단에 항목별 계산식과 합계를 보여주어 한눈에 확인 가능하다.

#### 솔루션 3. 양방향 워크플로우 (2단계~)
자녀가 청구하면 부모가 같은 시스템에서 검토·승인·지급을 처리한다. 카톡 외부 송신 없이 시스템 내부에서 완결된다.

#### 솔루션 4. 변동 사항 자동 처리 (2단계~)
추가 용돈, 부분 입금, 차감을 시스템이 자동으로 추적하고 다음 청구에 반영한다.

---

## 4. 시장 분석 및 차별점

### 4.1 기존 시장 카테고리

#### 카테고리 A. 핀테크 카드형
- 한국: 아이쿠카, 퍼핀, 아이부자
- 글로벌: Greenlight, GoHenry, BusyKid
- 특징: 자녀 명의 카드 발급, 부모 송금, 결제 추적

#### 카테고리 B. 자녀용 가계부
- 한국: 용돈생각, 똑똑가계부
- 글로벌: Money Vault
- 특징: 자녀 본인이 지출 기록

#### 카테고리 C. 단순 트래커
- 글로벌: AllowanceKit, iAllowance, RoosterMoney
- 특징: 카드 없이 가상 장부, 정기 자동 누적

#### 카테고리 D. 가족 가상 은행
- 글로벌: FamZoo (IOU 모드)
- 특징: 부모-자녀 간 IOU 거래, 차용증 시스템

#### 카테고리 E. 디지털 콘텐츠 승인
- Apple 구입 요청, Google Family Link
- 특징: 자녀의 앱·게임 구매 승인 (용돈과 무관)

### 4.2 시장 분석 결론

**조사 결과: "월 청구서 단위로 양방향 흐름을 다루는 도구"는 한국·글로벌 어디에도 거의 없음**

- 핀테크는 너무 무겁고 (카드·송금·교육 콘텐츠 다 묶임)
- 가계부는 단방향 (자녀 본인 기록)
- 단순 트래커는 부모가 일방 누적
- 디지털 콘텐츠 승인은 용돈 무관
- FamZoo만 IOU 모드로 유사하지만 UI 노후화

### 4.3 본 시스템의 차별점

| 차별점 | 설명 |
|---|---|
| **월 청구서 단위** | 기존 도구는 집안일/결제 건별/자동 정기. 본 시스템은 "월 단위 청구·승인" 흐름 |
| **캘린더 자동 산정** | 학교/학원 일수 자동 계산은 기존 도구에 전무 |
| **협상 워크플로우** | 거절·메모·재청구·부분 지급 등 가족 간 협상 모델링 |
| **카드/금융 인프라 불필요** | 외부 송금(카톡·계좌이체)은 그대로 두고 청구·검토만 디지털화 |
| **한국 환경 최적화** | 경기도 시내버스 청소년 요금, 한국 학사일정 형식 등 |

### 4.4 시장 포지셔닝

```
[ 핀테크 카드형 ]               [ 가계부형 ]
- 무거움, 카드 발급              - 단방향, 기록만
- 아이쿠카, 퍼핀, Greenlight      - 용돈생각, Money Vault

           [ 본 시스템 ]
              ↑ 시장 빈자리
   월 청구·검토·지급 워크플로우
   + 캘린더 자동 산정
   + 한국 학생 환경 최적화
   + 카드/금융 없이 작동

[ 단순 트래커 ]                 [ 디지털 승인 ]
- 단방향, 자녀 조회만            - 용돈 무관
- AllowanceKit, iAllowance       - Apple/Google 가족
```

### 4.5 기존 시스템에서 가져올 만한 요소

복잡한 핀테크·교육 콘텐츠는 빼고, 본 시스템의 컴팩트 컨셉에 맞는 것만 선별:

| 출처 | 가져올 요소 | 본 시스템 위치 |
|---|---|---|
| Chore Boss | 사진 증명 첨부 | F4-9 영수증과 통합 |
| Apple iOS 16.1 | 거절 자동 만료 (24h) | F4-8 거절 자동 만료 |
| Google Play | 확인 영수증 자동 발송 | F2-11 알림 시스템 |
| 아이부자 | "계획하기" 사전 협의 | 다음달 미리보기 양방향화 (Phase 5+) |
| Chores Bot | 부분 지급 % 슬라이더 | F4-6 부분 승인 |

---
## 5. 사용자 정의

### 5.1 사용자 페르소나

#### 페르소나 1. 자녀 (Primary User)

| 항목 | 내용 |
|---|---|
| 연령 | 만 13~18세 (중·고등학생) |
| 디바이스 | 본인 스마트폰 또는 가족 공용 PC |
| IT 친숙도 | 중상 (모바일 앱·웹 능숙) |
| 사용 빈도 | 매월 1~2회 (월말 청구 + 추가 용돈 발생 시) |
| 핵심 니즈 | 빠르고 정확한 청구, 부모와의 매끄러운 협상 |
| 우려 사항 | 청구 거절, 일수 계산 오류로 인한 신뢰 손상 |

#### 페르소나 2. 부모 (Co-Primary User)

| 항목 | 내용 |
|---|---|
| 연령 | 만 35~55세 |
| 디바이스 | 스마트폰 (출퇴근), PC (저녁) |
| IT 친숙도 | 중 (앱 사용 가능, 복잡한 설정은 부담) |
| 사용 빈도 | 매월 1~2회 + 자녀 청구 시 즉시 |
| 핵심 니즈 | 청구 내역 투명성, 빠른 검토·지급 |
| 우려 사항 | 자녀가 부풀려 청구할까, 추적 어려움 |

#### 페르소나 3. 만 14세 미만 자녀 (4단계부터)

| 항목 | 내용 |
|---|---|
| 연령 | 만 6~12세 |
| 특이 사항 | 법정대리인(부모) 동의 필수, 개인정보 수집 제한 |
| 사용 방식 | 부모 폰의 자녀 모드, 또는 부모 보조 |

### 5.2 사용자 시나리오

#### 시나리오 S1. 정기 청구 (정상 흐름) — 2단계 이상
1. 매월 28일경, 자녀A가 알림을 받음 ("5월 용돈 청구 준비")
2. 자녀A는 5월 캘린더를 열어 자동 채워진 학교/학원 일정 확인
3. 5월 14일에 체험학습이 있어 "🎒 박물관 체험비 8,000원" 임시 항목 추가
4. 메모 작성: "이번 달 체험학습 1회 있어요"
5. 청구 미리보기 → [청구하기] 버튼
6. 부모1이 알림 받음 → 청구 검토
7. 부모1: [승인] → 자녀A에게 알림 + 부모2에게도 알림
8. 부모1이 카톡으로 송금 후 시스템에서 [지급 완료] 표시
9. 자녀A가 송금 받았는지 확인 후 [수령 확인] 표시
10. 청구 종료

#### 시나리오 S2. 청구 거절 (변동 흐름) — 2단계 이상
1. 자녀A가 청구 → 142,640원 + 추가 용돈 50,000원 (옷 구매)
2. 부모2가 검토 → 옷 구매 항목이 과다하다고 판단
3. 부모2: [거절] + 사유 입력: "옷은 다음 달에 같이 가서 사자"
4. 자녀A에게 거절 알림 + 사유 표시
5. 자녀A: 옷 항목 삭제 후 재청구
6. 부모2: 재청구 검토 → [승인]

#### 시나리오 S3. 부분 입금 — 2단계 이상
1. 자녀A 청구 142,640원 → 부모1 [승인]
2. 부모1이 130,000원만 송금 가능한 상황
3. 부모1: [지급 완료] 시 입금액 130,000원 입력
4. 시스템: 미수금 12,640원 자동 추적
5. 자녀A: [수령 확인] 시 미수금 12,640원 확인
6. 다음 달 6월 청구 시 자동 합산: "5월 미수 12,640원 + 6월 청구"

#### 시나리오 S4. 차감 처리 — 2단계 이상
1. 4월 어느 날 자녀A가 부모1 카드를 잘못 사용 (5,000원)
2. 부모1: 시스템에 차감 입력 "4월 카드 잘못 사용 -5,000원"
3. 자녀A의 5월 청구 시: 자동 표시 "지난달 차감 -5,000원"
4. 5월 합계: 142,640 - 5,000 = 137,640원

#### 시나리오 S5. 추가 용돈 요청 — 2단계 이상
1. 6월에 수련회 예정 (참가비 80,000원)
2. 자녀A: [추가 용돈 요청] → 항목 "수련회 참가비" 80,000원 + 영수증 사진 첨부
3. 부모1: 검토 → [승인]
4. 다음 청구 시 자동 포함

---

## 6. 시스템 핵심 원칙

### P-01. 평균 금액 일괄 청구

```
캘린더 자동 채우기는 읽기 전용 (수정 불가)
결석/휴원으로 인한 차감 없음 (단기 변동 미반영)
"평균적으로 이 정도 쓴다"는 부모-자녀 합의 가정
```

**근거:** 결석/휴원이 발생할 때마다 차감하는 시스템은 매번 자녀가 캘린더를 수정해야 하므로 컨셉(간편함)에 위배. 또한 자녀가 청구액을 임의 조작할 가능성도 차단.

**예외:** 장기 결석/입원 등은 별도 정책 (4단계 이후)

### P-02. 변경 이력 표시

```
임시 항목은 누구나 수정/삭제 가능
모든 변경은 이력 기록 (누가, 언제, 무엇을)
투명성 기반 협의 보장
```

**근거:** 가족 간 신뢰 기반이라 누구나 수정 가능하지만, 변경 이력이 보여야 협의가 의미 있음.

**적용 시점:** 2단계부터 (1단계는 단일 사용자라 이력 불필요)

### P-03. 단계 간 데이터 호환성

```
이전 단계의 데이터는 다음 단계에서 손실 없이 보존
사용자는 업그레이드를 강제받지 않음
```

**근거:** 사용자가 1단계만 쓰다가 2단계로 갈 때, 또는 2단계 코드 사용자가 3단계 정식 계정으로 갈 때 데이터를 잃지 않아야 함.

### P-04. 사상 일관성

```
1단계는 가볍게, 무거워지면 사상 위배
각 단계는 그 단계의 정체성에 부합하는 기능만 추가
조기 도입 금지, 단계 적합성 우선
```

### P-05. 외부 송금은 시스템 외부

```
실제 송금(카톡·계좌이체)은 시스템 외부에서 처리
시스템은 청구·검토·지급 표시·수령 확인까지만 관여
```

**근거:** 핀테크 인프라(은행 연동, 카드 발급)는 진입 장벽이 너무 높음. 본 시스템은 "기록과 협의" 영역에 집중.

---

## 7. 단계별 개발 로드맵

### 7.1 단계 개요

| 단계 | 정체성 | 사용자 | 기능 수 | 누적 기능 | 개발 기간 | 누적 기간 |
|---|---|---|---|---|---|---|
| **1단계** | 본인 도구 | 본인 1명 | 9개 | 9개 | 1~2주 | 2주 |
| **2단계** | 가족 양방향 | 가족 1팀 | 14개 | 23개 | 4~5주 | 7주 |
| **3단계** | 정식 계정 | 여러 가족 | 11개 | 34개 | 3~4주 | 11주 |
| **4단계** | 일반 공개 | 일반 사용자 | 16개 | 50개 | 5~7주 | 18주 |

**총 개발 기간:** 13~18주 (약 3.5~4.5개월)

### 7.2 단계별 핵심 차별점

| 단계 | 추가 핵심 가치 | 가능해지는 것 |
|---|---|---|
| 1단계 | 캘린더 자동 산정 + 메시지 자동 생성 | 매달 일수 안 세도 됨 |
| 2단계 | 양방향 + 클라우드 동기화 | 카톡 없이 시스템 안에서 처리 |
| 3단계 | 정식 회원가입 + 보안 | 다른 가족도 안전하게 가입 |
| 4단계 | 관리·법적·자동화 | 일반 사용자 누구나 사용 가능 |

### 7.3 단계별 시스템 특성

| 항목 | 1단계 | 2단계 | 3단계 | 4단계 |
|---|---|---|---|---|
| 인증 방식 | 없음 | 가족 코드 | 이메일+비밀번호 | + 14세 미만 대응 |
| 데이터 저장 | 로컬스토리지 | 클라우드 DB | + 격리·보안 | + 감사 로그 |
| 외부 송신 | 카톡 복사 | 시스템 내부 | 시스템 내부 | + 알림 다각화 |
| 백엔드 필요 | ❌ | ✅ | ✅ + 인증 | ✅ + 운영 도구 |
| 법적 대응 | 불필요 | 불필요 | 약관 동의 | 14세, 탈퇴, GDPR |
| 배포 형태 | HTML 단독 | 웹+서버 | 정식 사이트 | 일반 공개 |

---
## 8. 1단계 상세 명세 (MVP) — Detailed Specification

### 8.1 1단계 개요

#### 8.1.1 컨셉 정의

**한 줄 정의:** "본인이 혼자 캘린더로 청구액 자동 계산 → 카톡으로 부모님께 메시지 전송"

#### 8.1.2 1단계 정체성

| 항목 | 내용 |
|---|---|
| **사용자** | Hex님 본인 1명 (단일 사용자) |
| **부모님** | 시스템 외부 (카톡 메시지 수신만) |
| **사용 빈도** | 매월 1회 (월말~월초) |
| **사용 시간** | 1회 30초 이내 |
| **인터넷** | 불필요 (HTML 단독 동작) |
| **회원가입** | 없음 |
| **기기** | PC 또는 폰 1대 (다중 기기 동기화 없음) |

#### 8.1.3 1단계 핵심 가치

1. **시간 절약** — 매달 캘린더 일수 세고 곱셈하는 5분 작업을 30초로 단축
2. **정확성** — 수동 계산 오류 0%로 감소
3. **표준화** — 부모님께 보내는 메시지 포맷 일관성 확보

#### 8.1.4 1단계 범위 (Scope)

##### 포함되는 것
- 캘린더 자동 채우기 (학교/학원/공휴일)
- 월별 정산표 자동 생성
- 임시 항목 입력 (1셀당 최대 3개)
- 메모 입력 (1셀당 200자)
- 청구 메시지 자동 생성 (카톡 복사용)
- 미래·과거 달 조회·편집 (12개월 범위)
- 한국 공휴일 자동 인식
- 로컬 데이터 저장
- 설정 변경 (학기 변경 대응)

##### 제외되는 것 (2단계 이후)
- 부모 화면, 부모 검토·승인
- 청구 이력 추적
- 미수금 자동 계산
- 차감 처리
- 추가 용돈 별도 요청 흐름
- 영수증 첨부
- 알림
- 통계
- 클라우드 동기화
- 회원가입 / 로그인

#### 8.1.5 1단계 가정 (Assumptions)

이 단계는 다음을 가정한다:

1. **부모님이 시스템 사용 안 함** — 부모님은 카톡으로 청구 메시지를 받고 외부에서 송금
2. **자녀가 정직하게 입력** — 청구액 부풀리기 방지 메커니즘 없음 (단일 사용자라 무의미)
3. **단일 기기 사용** — 폰에서 입력하면 폰에서만 보임 (PC와 동기화 X)
4. **인터넷 연결 불필요** — 한 번 다운로드 후 오프라인 작동
5. **공휴일 데이터 정적** — 2030년까지의 한국 법정공휴일이 코드에 내장
6. **1명의 자녀** — 1단계는 형제 분리 없음, 단일 자녀 데이터만

#### 8.1.6 1단계 목표 (Success Criteria)

| 지표 | 목표 | 측정 방법 |
|---|---|---|
| 청구 작성 시간 | 30초 이내 | 본인 시간 측정 |
| 계산 정확도 | 100% | 수동 계산과 비교 |
| 본인 만족도 | "다음 달에도 쓰겠다" | 본인 판단 |
| 출시까지 개발 기간 | 2주 이내 | 일정 추적 |
| 메시지 형식 만족도 | 부모님이 의미 즉시 이해 | 부모님 피드백 |

#### 8.1.7 1단계 사상 준수 검증

다음 질문에 모두 "예"여야 1단계 사상에 맞는다:

- [ ] 기능 9개가 모두 단일 사용자 컨텍스트 안에 머무는가?
- [ ] 백엔드 / 인증 / 양방향 흐름이 없는가?
- [ ] 주말 작업으로 끝낼 수준인가?
- [ ] 부모님이 시스템에 진입하지 않고도 본인이 가치를 얻는가?
- [ ] 4단계 기능을 미리 끌어와서 무거워진 부분이 없는가?

---

### 8.2 1단계 아키텍처

#### 8.2.1 시스템 구성도

```
┌─────────────────────────────────────────────────────┐
│  사용자 브라우저 (PC 또는 모바일)                       │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  index.html (단일 파일)                      │    │
│  │                                               │    │
│  │  [HTML 구조] + [CSS 스타일] + [JS 로직]       │    │
│  │                                               │    │
│  │  ┌────────────────────────────────────┐     │    │
│  │  │  React 18 (CDN 또는 빌드)           │     │    │
│  │  │  ├── App                           │     │    │
│  │  │  │   ├── CalendarView              │     │    │
│  │  │  │   ├── SummaryTable              │     │    │
│  │  │  │   ├── SettingsModal             │     │    │
│  │  │  │   ├── CellEditModal             │     │    │
│  │  │  │   └── NotesDrawer               │     │    │
│  │  │  └── utils/                        │     │    │
│  │  │      ├── calculator.js             │     │    │
│  │  │      ├── storage.js                │     │    │
│  │  │      ├── holidays.js               │     │    │
│  │  │      └── messageTemplate.js        │     │    │
│  │  └────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────┘    │
│                       ↕                              │
│  ┌─────────────────────────────────────────────┐    │
│  │  로컬스토리지 (브라우저 내장)                │    │
│  │                                               │    │
│  │  - settings_v1                                │    │
│  │  - calendar_v1_2026_05                        │    │
│  │  - calendar_v1_2026_06                        │    │
│  │  - custom_categories_v1                       │    │
│  │  - meta_v1                                    │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  클립보드 API (메시지 복사)                  │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  외부 통신: 없음 (인터넷 불필요)                      │
└─────────────────────────────────────────────────────┘
```

#### 8.2.2 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | React 18 | Hex님 익숙, 컴포넌트 재사용성 |
| 빌드 도구 | Vite | 빠른 HMR, 단일 HTML 빌드 가능 |
| 스타일 | Tailwind CSS | 빠른 프로토타이핑 |
| 언어 | JavaScript (TypeScript 선택) | 1단계는 단순화 |
| 상태 관리 | React useState/useReducer | 외부 라이브러리 불필요 |
| 라우팅 | 없음 (단일 페이지) | 단일 화면이라 불필요 |
| 패키지 관리 | npm | 표준 |
| 배포 | 단일 HTML / GitHub Pages | 간편 |

#### 8.2.3 파일 구조

```
allowance-mvp/
├── public/
│   └── holidays.json          # 한국 공휴일 데이터 (정적)
├── src/
│   ├── components/
│   │   ├── App.jsx
│   │   ├── CalendarView.jsx
│   │   ├── CalendarCell.jsx
│   │   ├── SummaryTable.jsx
│   │   ├── SettingsModal.jsx
│   │   ├── CellEditModal.jsx
│   │   ├── NotesDrawer.jsx
│   │   ├── MessagePreview.jsx
│   │   └── MonthNavigator.jsx
│   ├── utils/
│   │   ├── calculator.js      # 청구액 계산
│   │   ├── storage.js         # 로컬스토리지 추상화
│   │   ├── holidays.js        # 공휴일 조회
│   │   ├── messageTemplate.js # 메시지 생성
│   │   └── validators.js      # 입력 검증
│   ├── hooks/
│   │   ├── useSettings.js
│   │   ├── useCalendar.js
│   │   └── useClipboard.js
│   ├── constants/
│   │   ├── categories.js      # 기본 카테고리
│   │   └── icons.js           # 아이콘 매핑
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

### 8.3 1단계 데이터 모델

#### 8.3.1 로컬스토리지 키 구조

| 키 | 설명 | 생성 시점 | 수정 시점 |
|---|---|---|---|
| `settings_v1` | 자녀 기본 설정 | 첫 사용 시 | 설정 변경 시 |
| `calendar_v1_YYYY_MM` | 월별 캘린더 데이터 | 해당 월 첫 진입 시 | 임시 항목/메모 추가 시 |
| `custom_categories_v1` | 사용자 정의 카테고리 | 첫 추가 시 | 추가/삭제 시 |
| `meta_v1` | 메타 정보 (마지막 사용일 등) | 첫 사용 시 | 매 진입 시 |

#### 8.3.2 settings_v1 스키마

```typescript
interface Settings_v1 {
  // 자녀 정보
  child_name: string;              // 자녀 이름 (선택, 메시지에 포함)

  // 학교
  school: {
    days: WeekDay[];               // ["mon","tue","wed","thu","fri"]
    fare: number;                  // 1160 (원)
    round_trip: boolean;           // true (왕복) / false (편도)
    holiday_attend: boolean;       // false (공휴일에 학교 안 감)
  };

  // 학원
  academy: {
    days: WeekDay[];               // ["wed","fri"]
    fare: number;                  // 1160
    round_trip: boolean;           // true
    holiday_attend: boolean;       // true (공휴일에도 학원 감)
  };

  // 기본 용돈
  base_allowance: number;          // 80000

  // 메타
  created_at: string;              // ISO 8601: "2026-05-01T09:23:00.000Z"
  updated_at: string;              // ISO 8601
  version: number;                 // 데이터 스키마 버전 (1)
}

type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
```

**예시 데이터:**
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

#### 8.3.3 calendar_v1_YYYY_MM 스키마

```typescript
interface CalendarMonth_v1 {
  year: number;                    // 2026
  month: number;                   // 5 (1~12)

  // 셀별 데이터 (key: "YYYY-MM-DD")
  cells: {
    [date: string]: CellData;
  };

  // 메타
  created_at: string;
  updated_at: string;
  version: number;
}

interface CellData {
  extra_items: ExtraItem[];        // 임시 항목 (최대 3개)
  memo: string;                    // 메모 (최대 200자)
}

interface ExtraItem {
  id: string;                      // UUID v4
  category: string;                // "체험학습" 또는 사용자 정의
  name: string;                    // "박물관 체험비" (최대 50자)
  amount: number;                  // 8000 (원)
  created_at: string;              // ISO 8601
}
```

**예시 데이터:**
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

#### 8.3.4 custom_categories_v1 스키마

```typescript
interface CustomCategories_v1 {
  categories: CustomCategory[];
  version: number;
}

interface CustomCategory {
  id: string;                      // "cat_xxxxxx"
  name: string;                    // "동아리 회비"
  icon: string;                    // "🎵" (이모지)
  created_at: string;
}
```

#### 8.3.5 meta_v1 스키마

```typescript
interface Meta_v1 {
  first_used_at: string;           // 첫 사용일
  last_used_at: string;            // 마지막 사용일
  current_view_month: string;      // "2026-05" (마지막으로 본 달)
  app_version: string;             // "1.0.0"
  schema_version: number;          // 1
}
```

#### 8.3.6 holidays.json 스키마 (정적 데이터)

```typescript
interface Holidays {
  [date: string]: HolidayInfo;     // key: "YYYY-MM-DD"
}

interface HolidayInfo {
  name: string;                    // "노동절"
  type: "legal" | "alternative";   // 법정공휴일 / 대체공휴일
}
```

**데이터 범위:** 2024년 ~ 2030년

**예시:**
```json
{
  "2026-01-01": { "name": "신정", "type": "legal" },
  "2026-02-16": { "name": "설날", "type": "legal" },
  "2026-02-17": { "name": "설날", "type": "legal" },
  "2026-02-18": { "name": "설날", "type": "legal" },
  "2026-03-01": { "name": "삼일절", "type": "legal" },
  "2026-05-01": { "name": "노동절", "type": "legal" },
  "2026-05-05": { "name": "어린이날", "type": "legal" },
  "2026-05-25": { "name": "부처님오신날", "type": "legal" },
  "2026-06-06": { "name": "현충일", "type": "legal" },
  "2026-08-15": { "name": "광복절", "type": "legal" },
  "2026-09-25": { "name": "추석", "type": "legal" },
  "2026-09-26": { "name": "추석", "type": "legal" },
  "2026-09-27": { "name": "추석", "type": "legal" },
  "2026-10-03": { "name": "개천절", "type": "legal" },
  "2026-10-09": { "name": "한글날", "type": "legal" },
  "2026-12-25": { "name": "성탄절", "type": "legal" }
}
```

#### 8.3.7 데이터 무결성 규칙

| 규칙 | 설명 |
|---|---|
| **버전 호환성** | 모든 키에 `version` 필드 필수, 호환 안 될 시 마이그레이션 |
| **타임스탬프** | 모든 created_at/updated_at은 ISO 8601 UTC |
| **금액** | 모든 금액은 정수 (원 단위), 음수 불가 |
| **날짜 형식** | "YYYY-MM-DD" 통일 (시간 부분 없음) |
| **ID 생성** | UUID v4 또는 prefix + nanoid (예: "ex_a3f9k2") |
| **NULL 처리** | 빈 문자열은 NULL 아님, undefined는 키 미존재 |

#### 8.3.8 데이터 크기 추정

| 항목 | 크기 | 비고 |
|---|---|---|
| settings_v1 | ~500 bytes | 1회 |
| calendar_v1_YYYY_MM (평균) | ~2 KB | 월별, 임시항목 5개 가정 |
| custom_categories_v1 | ~500 bytes | |
| meta_v1 | ~200 bytes | |
| **12개월 누적** | **~25 KB** | 1년치 |
| **로컬스토리지 한도** | **5~10 MB** | 브라우저별 |

→ 1단계에서는 로컬스토리지 한도 도달 가능성 거의 0

#### 8.3.9 데이터 마이그레이션 정책

##### 1단계 → 2단계 마이그레이션

2단계 첫 진입 시 다음 절차 실행:

1. 로컬스토리지 `settings_v1` 존재 검사
2. 존재 시 → "기존 데이터를 가져올까요?" 안내
3. [예] → 클라우드 API 호출:
   ```
   POST /api/migrations/from-local
   Body: {
     settings: {...},
     calendars: {...},
     custom_categories: {...}
   }
   ```
4. 마이그레이션 성공 → 로컬스토리지 데이터 보존 (안전)
5. 90일 후 자동 정리 (사용자 안내 후)

##### 호환성 보장
- 1단계 스키마 필드는 2단계 DB 스키마에 1:1 매핑 가능하도록 설계됨
- 1단계 ID 체계는 2단계에서 별도 ID로 변환 (충돌 방지)

---

### 8.4 1단계 비즈니스 로직

#### 8.4.1 청구액 계산 알고리즘

```typescript
function calculateMonthlyAllowance(
  year: number,
  month: number,
  settings: Settings_v1,
  calendarData: CalendarMonth_v1,
  holidays: Holidays
): AllowanceCalculation {

  let school_total = 0;
  let academy_total = 0;
  let school_days_count = 0;
  let academy_days_count = 0;
  let extra_items_total = 0;
  const cells: CellCalculation[] = [];

  // 1. 해당 월의 모든 날짜 순회
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const weekday = getWeekday(year, month, day); // "mon" | "tue" | ...
    const isHoliday = holidays[date] !== undefined;
    const holidayName = isHoliday ? holidays[date].name : null;

    let school_fee = 0;
    let academy_fee = 0;

    // 2. 학교 등교 여부 판단
    if (settings.school.days.includes(weekday)) {
      // 평일이면서 학교 등교 요일
      if (isHoliday && !settings.school.holiday_attend) {
        school_fee = 0; // 공휴일 등교 안 함
      } else {
        const multiplier = settings.school.round_trip ? 2 : 1;
        school_fee = settings.school.fare * multiplier;
        school_total += school_fee;
        school_days_count++;
      }
    }

    // 3. 학원 등원 여부 판단
    if (settings.academy.days.includes(weekday)) {
      if (isHoliday && !settings.academy.holiday_attend) {
        academy_fee = 0;
      } else {
        const multiplier = settings.academy.round_trip ? 2 : 1;
        academy_fee = settings.academy.fare * multiplier;
        academy_total += academy_fee;
        academy_days_count++;
      }
    }

    // 4. 임시 항목 합산
    const cellData = calendarData.cells[date];
    let cell_extra_total = 0;
    let extra_items: ExtraItem[] = [];
    if (cellData) {
      extra_items = cellData.extra_items;
      cell_extra_total = extra_items.reduce((sum, item) => sum + item.amount, 0);
      extra_items_total += cell_extra_total;
    }

    // 5. 셀 데이터 저장
    cells.push({
      date,
      weekday,
      is_holiday: isHoliday,
      holiday_name: holidayName,
      school_fee,
      academy_fee,
      extra_items,
      total: school_fee + academy_fee + cell_extra_total
    });
  }

  // 6. 최종 합계 계산
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

function getWeekday(year: number, month: number, day: number): WeekDay {
  const days: WeekDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const date = new Date(year, month - 1, day);
  return days[date.getDay()];
}
```

#### 8.4.2 계산 정확도 보장

##### 부동소수점 회피
- 모든 금액은 **정수 (원 단위)**
- 곱셈·덧셈만 사용 (나눗셈 없음)
- JavaScript Number 안전 정수 한도: 2^53 - 1 ≈ 9 × 10^15
- 가족 1년 청구액 최대 ~10,000,000원 → 안전

##### 검증 로직
```typescript
function validateAllowance(calc: AllowanceCalculation): ValidationResult {
  const errors: string[] = [];

  // 음수 검사
  if (calc.total < 0) {
    errors.push("합계가 음수입니다");
  }

  // 합계 일치 검사
  const computed = calc.base_allowance
    + calc.school_total
    + calc.academy_total
    + calc.extra_items_total;
  if (Math.abs(computed - calc.total) > 0) {
    errors.push("합계가 항목 합과 일치하지 않습니다");
  }

  // 일수 검사 (학교 등교일 ≤ 22)
  if (calc.school_days_count > 22) {
    errors.push("학교 등교일이 비정상적으로 많습니다");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

#### 8.4.3 공휴일 인식 로직

```typescript
function isHoliday(date: string, holidays: Holidays): boolean {
  return date in holidays;
}

function getHolidayName(date: string, holidays: Holidays): string | null {
  return holidays[date]?.name ?? null;
}

// 예시
isHoliday("2026-05-05", holidays); // true
getHolidayName("2026-05-05", holidays); // "어린이날"
isHoliday("2026-05-06", holidays); // false (어린이날 다음날)
```

##### 공휴일 데이터 누락 처리
- holidays.json에 없는 날짜 = 평일 처리
- 신규 공휴일은 앱 업데이트로 추가 (1단계는 정적)
- 향후 2단계에서 학교 학사일정과 통합 (수업일/휴교일)

#### 8.4.4 메시지 템플릿 생성

```typescript
function generateClipboardMessage(
  year: number,
  month: number,
  calc: AllowanceCalculation,
  settings: Settings_v1,
  holidays: Holidays
): string {

  const lines: string[] = [];

  // 헤더
  lines.push(`📅 ${year}년 ${month}월 용돈 청구`);
  lines.push('');

  // 기본 용돈
  lines.push(`💰 기본 용돈           ${formatCurrency(calc.base_allowance)}원`);
  lines.push(`   = ${formatNumber(calc.base_allowance)} × 1`);
  lines.push('');

  // 학교 버스
  if (calc.school_total > 0) {
    const tripText = settings.school.round_trip ? "왕복" : "편도";
    const multiplier = settings.school.round_trip ? 2 : 1;
    lines.push(`🏫 학교 버스비         ${formatCurrency(calc.school_total)}원`);
    lines.push(`   = ${formatNumber(settings.school.fare)} × ${multiplier}(${tripText}) × ${calc.school_days_count}일`);
    lines.push('');
  }

  // 학원 버스
  if (calc.academy_total > 0) {
    const tripText = settings.academy.round_trip ? "왕복" : "편도";
    const multiplier = settings.academy.round_trip ? 2 : 1;
    lines.push(`📚 학원 버스비         ${formatCurrency(calc.academy_total)}원`);
    lines.push(`   = ${formatNumber(settings.academy.fare)} × ${multiplier}(${tripText}) × ${calc.academy_days_count}일`);
    lines.push('');
  }

  // 임시 항목
  if (calc.extra_items_total > 0) {
    const extraItemsList = collectExtraItems(calc.cells);
    extraItemsList.forEach(item => {
      const dateText = formatDateShort(item.date); // "5/14"
      const icon = getCategoryIcon(item.category);
      lines.push(`${icon} ${item.name} (${dateText})    ${formatCurrency(item.amount)}원`);
    });
    lines.push('');
  }

  // 구분선 + 합계
  lines.push('─'.repeat(30));
  lines.push(`합계                  ${formatCurrency(calc.total)}원`);

  // 비고: 공휴일
  const monthHolidays = getHolidaysInMonth(year, month, holidays);
  if (monthHolidays.length > 0) {
    lines.push('');
    const holidayText = monthHolidays
      .map(h => `${parseInt(h.date.split('-')[2])}일(${h.name})`)
      .join(', ');
    lines.push(`※ ${month}월 공휴일: ${holidayText}`);
  }

  return lines.join('\n');
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

function formatDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${parseInt(month)}/${parseInt(day)}`;
}
```

##### 메시지 출력 예시

```
📅 2026년 5월 용돈 청구

💰 기본 용돈           80,000원
   = 80,000 × 1

🏫 학교 버스비         41,760원
   = 1,160 × 2(왕복) × 18일

📚 학원 버스비         20,880원
   = 1,160 × 2(왕복) × 9일

🎒 박물관 체험비 (5/14)    8,000원

──────────────────────────────
합계                  150,640원

※ 5월 공휴일: 1일(노동절), 5일(어린이날), 25일(부처님오신날)
```

#### 8.4.5 메시지 템플릿 변형

1단계는 단일 스타일이지만, 다음 변형은 향후 추가 가능 (보류):

##### 변형 A: 정중 모드
```
어머니/아버지께,

5월 용돈 청구드립니다.
- 기본 용돈: 80,000원
- 교통비 (학교+학원): 62,640원
- 체험학습 1건: 8,000원
─────────────
합계: 150,640원

확인 부탁드립니다.
```

##### 변형 B: 간결 모드
```
5월: 150,640원
- 기본 80,000
- 학교 41,760 (×18)
- 학원 20,880 (×9)
- 체험 8,000
```

→ **1단계는 변형 A 1개로 시작, 다른 변형은 사용자 피드백 후 추가**

---
### 8.5 1단계 기능 상세 명세

> 각 기능은 다음 표준 템플릿으로 작성됨:
> 1. 사용자 스토리 / 2. 사전·사후 조건 / 3. 정상 흐름 / 4. 대체 흐름 /
> 5. 예외 흐름 / 6. 입력 검증 / 7. UI 컴포넌트 구조 / 8. 데이터 처리 /
> 9. 비즈니스 로직 / 10. 인수 조건 / 11. 테스트 케이스

---

#### 🎯 F1-1. 자녀 기본 설정

##### 1. 사용자 스토리

> **As** 시스템 첫 사용자
> **I want** 학교/학원 요일, 단가, 기본 용돈을 한 번 등록하면
> **So that** 매달 자동으로 청구액이 계산되어 시간을 절약할 수 있다

##### 2. 사전·사후 조건

| 구분 | 조건 |
|---|---|
| **사전 조건 (Pre)** | 1. 시스템에 처음 진입한 상태<br>2. 로컬스토리지에 `settings_v1` 키가 없음 |
| **사후 조건 (Post)** | 1. `settings_v1` 키가 로컬스토리지에 저장됨<br>2. 캘린더 화면이 자동 로드됨<br>3. 모든 평일 셀에 교통비가 자동 표시됨 |

##### 3. 정상 흐름 (Happy Path)

```
1. 사용자가 시스템 URL 접속
2. 시스템: localStorage.getItem("settings_v1") === null 확인
3. 시스템: 환영 모달 + 자녀 기본 설정 폼 표시
4. 사용자: 다음 항목 입력
   - 자녀 이름 (선택, 기본값 "")
   - 학교 등교 요일 (체크박스 5개, 기본값 월~금 체크)
   - 학교 버스비 단가 (입력 필드, 기본값 1160)
   - 학교 편도/왕복 (라디오, 기본값 왕복)
   - 학교 공휴일 처리 (라디오, 기본값 등교 안 함)
   - 학원 등원 요일 (체크박스 7개, 기본값 모두 미체크)
   - 학원 버스비 단가 (입력 필드, 학원 미선택 시 비활성)
   - 학원 편도/왕복 (라디오)
   - 학원 공휴일 처리 (라디오, 기본값 등원 함)
   - 기본 용돈 (입력 필드, 기본값 80000)
5. 사용자: [저장] 클릭
6. 시스템: 입력값 검증 (8.5.F1-1.6 참조)
7. 시스템: 검증 통과 시 settings_v1 객체 생성:
   {
     child_name: "...",
     school: {...},
     academy: {...},
     base_allowance: ...,
     created_at: now(),
     updated_at: now(),
     version: 1
   }
8. 시스템: localStorage.setItem("settings_v1", JSON.stringify(obj))
9. 시스템: meta_v1 생성 (first_used_at = now())
10. 시스템: 환영 모달 닫기 + 메인 캘린더 화면 전환
11. 시스템: 현재 달(이번 달) 캘린더 자동 로드 + 표시
```

##### 4. 대체 흐름 (Alternative Flows)

###### 4.1 학원 없음
- 사용자가 학원 등원 요일을 모두 미체크
- 시스템: 학원 단가/편도왕복/공휴일 입력 필드를 비활성화 (회색)
- 저장 시 `academy.days = []` 저장
- 캘린더에 학원 표시 없음

###### 4.2 자녀 이름 미입력
- 시스템: 빈 문자열로 저장
- 메시지 템플릿에서 자녀 이름 부분 생략

###### 4.3 입력 도중 페이지 새로고침
- 시스템: 입력값 손실 (1단계는 입력 중 자동 저장 없음)
- 다시 환영 모달 표시 → 처음부터 입력

##### 5. 예외 흐름 (Exception Flows)

###### 5.1 검증 실패
- 시스템: [저장] 클릭 시 에러 메시지 표시 (해당 필드 빨간색 강조)
- 모달 닫지 않음, 사용자 수정 대기

###### 5.2 로컬스토리지 쓰기 실패 (용량 부족 등)
- 시스템: try/catch로 캐치
- 에러 모달: "데이터 저장에 실패했습니다. 브라우저 저장 공간을 확보해주세요."
- [다시 시도] 버튼

###### 5.3 사용자가 모달 강제 닫기 시도
- 1단계는 첫 사용 시 모달 닫기 차단 (X 버튼 없음)
- ESC 키도 무시
- 저장 후에만 닫힘

##### 6. 입력 검증 규칙

| 필드 | 검증 규칙 | 에러 메시지 |
|---|---|---|
| **자녀 이름** | 0~20자, 특수문자 허용 | "20자 이내로 입력해주세요" |
| **학교 요일** | 최소 1개 체크 권장 (0개 허용) | (경고만, 차단 X) |
| **학교 단가** | 1 ~ 100,000 정수 | "1원 이상 100,000원 이하 정수로 입력해주세요" |
| **학교 단가 비어있음** | 학교 요일 1개 이상 시 필수 | "학교 단가를 입력해주세요" |
| **학원 요일** | 0개 이상 (없어도 OK) | - |
| **학원 단가** | 학원 요일 1개 이상 시 필수, 1~100,000 | "학원 단가를 입력해주세요" |
| **기본 용돈** | 0 ~ 1,000,000 정수 | "0원 이상 1,000,000원 이하 정수로 입력해주세요" |
| **편도/왕복** | "round" 또는 "one-way" 중 하나 | (라디오라 자동) |
| **공휴일 처리** | "attend" 또는 "skip" 중 하나 | (라디오라 자동) |

###### 검증 함수 (의사 코드)

```typescript
function validateSettings(input: SettingsInput): ValidationResult {
  const errors: { [field: string]: string } = {};

  // 자녀 이름
  if (input.child_name && input.child_name.length > 20) {
    errors.child_name = "20자 이내로 입력해주세요";
  }

  // 학교 단가
  if (input.school.days.length > 0) {
    if (!input.school.fare || input.school.fare < 1) {
      errors["school.fare"] = "학교 단가를 입력해주세요";
    } else if (input.school.fare > 100000) {
      errors["school.fare"] = "100,000원 이하로 입력해주세요";
    } else if (!Number.isInteger(input.school.fare)) {
      errors["school.fare"] = "정수로 입력해주세요";
    }
  }

  // 학원 단가 (동일 패턴)
  if (input.academy.days.length > 0) {
    if (!input.academy.fare || input.academy.fare < 1) {
      errors["academy.fare"] = "학원 단가를 입력해주세요";
    }
    // ... 이하 동일
  }

  // 기본 용돈
  if (input.base_allowance < 0) {
    errors.base_allowance = "0원 이상 입력해주세요";
  } else if (input.base_allowance > 1000000) {
    errors.base_allowance = "1,000,000원 이하로 입력해주세요";
  } else if (!Number.isInteger(input.base_allowance)) {
    errors.base_allowance = "정수로 입력해주세요";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
```

##### 7. UI 컴포넌트 구조

```jsx
<SettingsModal isOpen={firstTime} closable={false}>
  <Modal.Header>
    <Title>처음 시작합니다 👋</Title>
    <Subtitle>자녀 정보를 한 번만 등록해주세요</Subtitle>
  </Modal.Header>

  <Modal.Body>
    <FormSection title="자녀 정보">
      <Input
        label="자녀 이름 (선택)"
        name="child_name"
        maxLength={20}
        placeholder="예: 자녀A"
      />
    </FormSection>

    <FormSection title="기본 용돈">
      <CurrencyInput
        label="월 기본 용돈"
        name="base_allowance"
        defaultValue={80000}
        min={0}
        max={1000000}
        suffix="원"
      />
    </FormSection>

    <FormSection title="🏫 학교">
      <WeekdayPicker
        label="등교 요일"
        name="school.days"
        defaultValue={["mon","tue","wed","thu","fri"]}
        showWeekend={false}
      />
      <CurrencyInput
        label="버스비 단가"
        name="school.fare"
        defaultValue={1160}
        min={1}
        max={100000}
        suffix="원"
      />
      <RadioGroup
        label="편도/왕복"
        name="school.round_trip"
        options={[
          { value: false, label: "편도" },
          { value: true, label: "왕복" }
        ]}
        defaultValue={true}
      />
      <RadioGroup
        label="공휴일 처리"
        name="school.holiday_attend"
        options={[
          { value: false, label: "쉼" },
          { value: true, label: "등교" }
        ]}
        defaultValue={false}
      />
    </FormSection>

    <FormSection title="📚 학원 (선택)">
      <WeekdayPicker
        label="등원 요일"
        name="academy.days"
        defaultValue={[]}
        showWeekend={true}
      />
      <CurrencyInput
        label="버스비 단가"
        name="academy.fare"
        defaultValue={1160}
        disabled={academyDaysEmpty}
      />
      <RadioGroup ... 학교와 동일 ... />
    </FormSection>
  </Modal.Body>

  <Modal.Footer>
    <Button variant="primary" type="submit">
      저장하고 시작하기
    </Button>
  </Modal.Footer>
</SettingsModal>
```

###### 컴포넌트 명세

**WeekdayPicker**
- props: label, name, defaultValue, showWeekend
- 7개 토글 버튼 (월/화/수/목/금/토/일)
- 클릭 시 해당 요일 토글
- showWeekend=false면 토/일 비활성

**CurrencyInput**
- props: label, name, defaultValue, min, max, suffix, disabled
- 숫자만 입력 가능
- 입력 중 천 단위 콤마 자동 표시
- 내부 상태는 정수, 표시는 포맷팅
- disabled 시 회색 배경

**RadioGroup**
- props: label, name, options[], defaultValue
- 가로 배치
- 선택된 옵션 강조

##### 8. 데이터 처리

###### 저장 로직 (Pseudocode)

```typescript
async function saveSettings(input: SettingsInput): Promise<Result> {
  // 1. 검증
  const validation = validateSettings(input);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  // 2. 객체 생성
  const settings: Settings_v1 = {
    child_name: input.child_name || "",
    school: {
      days: input.school.days,
      fare: input.school.fare,
      round_trip: input.school.round_trip,
      holiday_attend: input.school.holiday_attend
    },
    academy: {
      days: input.academy.days,
      fare: input.academy.fare,
      round_trip: input.academy.round_trip,
      holiday_attend: input.academy.holiday_attend
    },
    base_allowance: input.base_allowance,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  };

  // 3. 저장 시도
  try {
    localStorage.setItem("settings_v1", JSON.stringify(settings));
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      return { success: false, error: "STORAGE_FULL" };
    }
    return { success: false, error: "STORAGE_ERROR" };
  }

  // 4. 메타 정보 초기화
  if (!localStorage.getItem("meta_v1")) {
    const meta: Meta_v1 = {
      first_used_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      current_view_month: getCurrentYearMonth(),
      app_version: "1.0.0",
      schema_version: 1
    };
    localStorage.setItem("meta_v1", JSON.stringify(meta));
  }

  return { success: true };
}
```

##### 9. 비즈니스 로직

###### 9.1 기본값 정책

| 항목 | 기본값 | 근거 |
|---|---|---|
| 학교 등교 요일 | 월~금 | 한국 일반 학교 |
| 학교 단가 | 1,160원 | 경기도 청소년 시내버스 (2025-10-25 시행) |
| 학교 편도/왕복 | 왕복 | 한국 등하교 일반 |
| 학교 공휴일 처리 | 등교 안 함 | 일반 학교 |
| 학원 등원 요일 | 없음 (빈 배열) | 학원 없는 가정도 있음 |
| 학원 단가 | 1,160원 | 학교와 동일 가정 |
| 학원 편도/왕복 | 왕복 | |
| 학원 공휴일 처리 | 등원 함 | 학원은 공휴일에도 운영 일반적 |
| 기본 용돈 | 80,000원 | Hex님 가정 기준값 |

###### 9.2 단가 검증 (1,160원 vs 다른 값)

- 1,160원: 경기도 청소년 시내버스 일반형 카드 요금
- 사용자가 다른 지역(서울 등) 거주 시 다른 단가 입력 가능
- 시스템은 단가 정책을 강제하지 않음 (사용자 자율)
- 비고 화면에 참고용 요금표 제공 (F1-4)

##### 10. 인수 조건 (Acceptance Criteria)

```gherkin
Given 시스템에 처음 진입한 사용자
When 환영 모달이 표시되면
Then 모달은 닫기 버튼이 없어야 한다 (X 없음)
And 모든 필드가 기본값으로 채워져 있어야 한다
And [저장하고 시작하기] 버튼이 표시되어야 한다

Given 사용자가 모든 필드를 정상 입력하고
When [저장하고 시작하기] 버튼을 클릭하면
Then 1초 이내에 저장이 완료되어야 한다
And 모달이 자동으로 닫혀야 한다
And 캘린더 화면이 표시되어야 한다
And 평일 셀에 교통비가 표시되어야 한다

Given 사용자가 학교 단가에 -100을 입력했을 때
When [저장] 버튼을 클릭하면
Then 에러 메시지 "1원 이상 100,000원 이하 정수로 입력해주세요"가 표시되어야 한다
And 모달은 닫히지 않아야 한다
And 학교 단가 필드가 빨간색으로 강조되어야 한다

Given 사용자가 학교 요일을 모두 체크 해제했을 때
When 화면을 보면
Then 경고 메시지 "학교 요일이 없습니다. 학교 버스비가 0원으로 계산됩니다"가 표시되어야 한다
But 저장은 가능해야 한다 (차단하지 않음)

Given settings_v1이 이미 저장된 상태에서
When 사용자가 시스템 URL에 다시 접속하면
Then 환영 모달은 표시되지 않아야 한다
And 캘린더 화면이 즉시 표시되어야 한다
```

##### 11. 테스트 케이스

###### 정상 케이스 (TC-F1-1-001 ~ 005)

| ID | 시나리오 | 입력 | 예상 결과 |
|---|---|---|---|
| TC-F1-1-001 | 모든 필드 정상 입력 | 학교 월~금, 1160, 왕복, 학원 없음, 기본 80000 | 저장 성공, 캘린더 표시 |
| TC-F1-1-002 | 학원 포함 입력 | 학교 + 학원 수금 1160 왕복 | 저장 성공, 학원 셀 표시 |
| TC-F1-1-003 | 자녀 이름 한글 입력 | "홍자녀A" | 저장 성공 |
| TC-F1-1-004 | 자녀 이름 영문 입력 | "Hong Kid A" | 저장 성공 |
| TC-F1-1-005 | 자녀 이름 미입력 | "" | 저장 성공, 메시지에서 이름 부분 생략 |

###### 예외 케이스 (TC-F1-1-101 ~ 110)

| ID | 시나리오 | 입력 | 예상 결과 |
|---|---|---|---|
| TC-F1-1-101 | 학교 단가 음수 | -1000 | 검증 실패, 에러 메시지 |
| TC-F1-1-102 | 학교 단가 0 | 0 | 검증 실패 |
| TC-F1-1-103 | 학교 단가 비정수 | 1160.5 | 검증 실패 |
| TC-F1-1-104 | 학교 단가 한도 초과 | 1000000 | 검증 실패 |
| TC-F1-1-105 | 기본 용돈 음수 | -100 | 검증 실패 |
| TC-F1-1-106 | 자녀 이름 21자 | "가나다라마바사아자차카타파하갸냐댜랴먀뱌" | 검증 실패 |
| TC-F1-1-107 | 학교 단가 비어있음 + 학교 요일 있음 | school.fare = "" | 검증 실패 |
| TC-F1-1-108 | 학원 단가 비어있음 + 학원 요일 있음 | academy.fare = "" | 검증 실패 |
| TC-F1-1-109 | 모든 필드 비어있음 | 모두 "" | 다수 검증 실패 |
| TC-F1-1-110 | 로컬스토리지 가득 참 | 정상 입력 + 스토리지 가득 | 저장 실패, "STORAGE_FULL" 에러 |

###### 엣지 케이스 (TC-F1-1-201 ~ 210)

| ID | 시나리오 | 예상 결과 |
|---|---|---|
| TC-F1-1-201 | 학교 요일 모두 미체크 | 경고 표시, 저장 가능, 학교 합계 0원 |
| TC-F1-1-202 | 학원 요일 모두 미체크 | 학원 단가 비활성, 저장 가능 |
| TC-F1-1-203 | 학교 학원 둘 다 없음 | 저장 가능, 기본 용돈만 표시 |
| TC-F1-1-204 | 학교 일요일 등교 | 일요일 셀에 표시 (있을 수 있는 케이스) |
| TC-F1-1-205 | 학교 매일(7일) 등교 | 모든 요일에 표시 |
| TC-F1-1-206 | 학교/학원 같은 요일 | 두 아이콘 모두 표시 |
| TC-F1-1-207 | 단가 1원 입력 | 정상 저장 (테스트 시) |
| TC-F1-1-208 | 단가 100,000원 입력 | 정상 저장 (한도 내) |
| TC-F1-1-209 | 새로고침 후 재진입 | 저장된 데이터 사용, 모달 안 뜸 |
| TC-F1-1-210 | 다른 브라우저에서 접속 | 새 환영 모달 표시 (브라우저별 분리) |

---

#### 🎯 F1-2. 캘린더 셀에 당일 교통비 자동 표시

##### 1. 사용자 스토리

> **As** 자녀
> **I want** 캘린더의 각 평일 셀에 그날의 교통비가 자동 표시되면
> **So that** 한눈에 매일 얼마인지 보고 청구 작성에 활용할 수 있다

##### 2. 사전·사후 조건

| 구분 | 조건 |
|---|---|
| **사전 조건** | 1. settings_v1이 저장됨<br>2. 표시할 월(year, month)이 결정됨 |
| **사후 조건** | 1. 해당 월의 모든 날짜 셀이 화면에 표시됨<br>2. 각 평일 셀에 교통비/아이콘이 표시됨<br>3. 공휴일 셀에 공휴일 이름이 표시됨 |

##### 3. 정상 흐름

```
1. 사용자가 캘린더 화면 진입 (또는 월 변경)
2. 시스템: 표시할 month 결정 (default: 이번 달)
3. 시스템: settings_v1 로드
4. 시스템: holidays.json 로드
5. 시스템: calendar_v1_YYYY_MM 로드 (없으면 빈 객체)
6. 시스템: 해당 월의 1일부터 마지막 날까지 순회
7. 각 날짜에 대해:
   a. 요일 계산
   b. 공휴일 여부 체크
   c. 학교 등교 여부 결정 (요일 + 공휴일 처리)
   d. 학원 등원 여부 결정 (요일 + 공휴일 처리)
   e. 교통비 계산
   f. 임시 항목 합산
8. 시스템: 캘린더 그리드 렌더링 (7열 × 6행 최대)
9. 각 셀에 다음 정보 표시:
   - 날짜 숫자 (좌측 상단)
   - 아이콘들 (🏫📚🎒)
   - 합계 금액 (하단)
   - 공휴일이면 빨간색 + 공휴일 이름
```

##### 4. 대체 흐름

###### 4.1 빈 셀 (평일 아니지만 학교/학원 없음)
- 셀이 표시되긴 하지만 아이콘/금액 없음
- 날짜 숫자만 표시

###### 4.2 임시 항목만 있는 셀
- 학교/학원 없는 날에 임시 항목 추가된 경우
- 🎒 아이콘 + 임시 항목 금액 표시
- 클릭 시 임시 항목 편집 모달

###### 4.3 월 첫 주가 일요일 시작
- 일요일이 좌측 첫 칸
- 그 전 토요일까지 빈 칸으로 채움

##### 5. 예외 흐름

###### 5.1 settings_v1 손상 (JSON 파싱 실패)
- 시스템: try/catch로 캐치
- 환영 모달 강제 표시 (재설정 유도)
- 사용자에게 안내: "설정 파일이 손상되었습니다. 다시 입력해주세요."

###### 5.2 holidays.json 로드 실패
- 시스템: 공휴일 인식 비활성화
- 모든 날짜를 평일로 처리
- 콘솔 경고 출력 (개발자용)
- 사용자 화면에는 영향 없음 (그대로 동작)

###### 5.3 calendar_v1_YYYY_MM 손상
- 시스템: 빈 객체로 폴백 ({cells: {}})
- 임시 항목 / 메모 표시 안 됨
- 새로 입력하면 정상 저장됨

##### 6. 입력 검증 규칙

이 기능은 사용자 입력이 없음 (자동 표시).

##### 7. UI 컴포넌트 구조

```jsx
<CalendarView year={2026} month={5}>
  <CalendarHeader>
    <MonthNavigator
      year={2026}
      month={5}
      onPrev={handlePrev}
      onNext={handleNext}
    />
    <ActionButtons>
      <Button onClick={handleSettings}>⚙</Button>
      <Button onClick={handleNotes}>📌 비고</Button>
      <Button onClick={handleCopy}>📋 메시지 복사</Button>
    </ActionButtons>
  </CalendarHeader>

  <CalendarGrid>
    <WeekdayHeader>일 월 화 수 목 금 토</WeekdayHeader>

    {/* 셀 렌더링 (35~42칸) */}
    {cells.map(cell => (
      <CalendarCell
        key={cell.date}
        date={cell.date}
        isHoliday={cell.is_holiday}
        holidayName={cell.holiday_name}
        schoolFee={cell.school_fee}
        academyFee={cell.academy_fee}
        extraItems={cell.extra_items}
        memo={cell.memo}
        onClick={() => handleCellClick(cell.date)}
      />
    ))}
  </CalendarGrid>

  <SummaryTable calc={calc} />
</CalendarView>
```

###### CalendarCell 컴포넌트 명세

```jsx
<CalendarCell>
  <CellNumber color={isHoliday ? "red" : "default"}>
    {dayOfMonth}
  </CellNumber>

  {isHoliday && (
    <HolidayLabel>{holidayName}</HolidayLabel>
  )}

  <IconRow>
    {schoolFee > 0 && <Icon>🏫</Icon>}
    {academyFee > 0 && <Icon>📚</Icon>}
    {extraItems.length > 0 && <Icon>🎒</Icon>}
    {memo && <DotIndicator />}
  </IconRow>

  {totalAmount > 0 && (
    <AmountText>{formatCurrency(totalAmount)}</AmountText>
  )}
</CalendarCell>
```

###### 셀 시각 디자인

```
┌──────────────────┐
│ 14  (검정)       │  ← 날짜 (공휴일이면 빨강)
│                  │
│ 🏫 📚 🎒          │  ← 아이콘 (해당하는 것만)
│                  │
│ 12,640원         │  ← 합계 (작게)
└──────────────────┘
```

##### 8. 데이터 처리

###### 캘린더 렌더링 흐름

```typescript
function renderCalendarMonth(year: number, month: number): CellData[] {
  const settings = loadSettings();
  const holidays = loadHolidays();
  const calendar = loadCalendarMonth(year, month);

  const cells: CellData[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  // 첫 날의 요일 계산 (캘린더 그리드 시작 위치)
  const firstDayWeekday = new Date(year, month - 1, 1).getDay(); // 0=일, 1=월, ...

  // 빈 셀 추가 (이전 달 마지막 부분)
  for (let i = 0; i < firstDayWeekday; i++) {
    cells.push({ date: null, isPlaceholder: true });
  }

  // 해당 월 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    const cellData = calculateCellData(dateStr, settings, holidays, calendar);
    cells.push(cellData);
  }

  // 마지막 주 빈 셀 (다음 달 시작 부분)
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, isPlaceholder: true });
  }

  return cells;
}

function calculateCellData(
  dateStr: string,
  settings: Settings_v1,
  holidays: Holidays,
  calendar: CalendarMonth_v1
): CellData {
  const [year, month, day] = dateStr.split('-').map(Number);
  const weekday = getWeekdayKey(year, month, day);
  const holidayInfo = holidays[dateStr];
  const isHoliday = !!holidayInfo;

  // 학교 등교 여부
  let school_fee = 0;
  if (settings.school.days.includes(weekday)) {
    if (!isHoliday || settings.school.holiday_attend) {
      const multiplier = settings.school.round_trip ? 2 : 1;
      school_fee = settings.school.fare * multiplier;
    }
  }

  // 학원 등원 여부
  let academy_fee = 0;
  if (settings.academy.days.includes(weekday)) {
    if (!isHoliday || settings.academy.holiday_attend) {
      const multiplier = settings.academy.round_trip ? 2 : 1;
      academy_fee = settings.academy.fare * multiplier;
    }
  }

  // 임시 항목
  const cellInCalendar = calendar.cells[dateStr];
  const extra_items = cellInCalendar?.extra_items || [];
  const memo = cellInCalendar?.memo || "";
  const extra_total = extra_items.reduce((s, item) => s + item.amount, 0);

  return {
    date: dateStr,
    weekday,
    is_holiday: isHoliday,
    holiday_name: holidayInfo?.name || null,
    school_fee,
    academy_fee,
    extra_items,
    extra_total,
    memo,
    total: school_fee + academy_fee + extra_total
  };
}
```

##### 9. 비즈니스 로직

###### 9.1 학교 등교일 결정 매트릭스

| 요일이 학교 등교 요일? | 공휴일? | settings.school.holiday_attend | 결과 |
|---|---|---|---|
| ❌ | - | - | 등교 X (school_fee=0) |
| ✅ | ❌ | - | 등교 (school_fee 계산) |
| ✅ | ✅ | false | 등교 X (공휴일에 안 감) |
| ✅ | ✅ | true | 등교 (공휴일에도 감) |

###### 9.2 학원 등원일 결정 매트릭스

| 요일이 학원 등원 요일? | 공휴일? | settings.academy.holiday_attend | 결과 |
|---|---|---|---|
| ❌ | - | - | 등원 X (academy_fee=0) |
| ✅ | ❌ | - | 등원 (academy_fee 계산) |
| ✅ | ✅ | false | 등원 X |
| ✅ | ✅ | true | 등원 |

###### 9.3 셀 표시 우선순위

1. 공휴일 표시 (있으면 빨간색 + 이름)
2. 학교 아이콘 (school_fee > 0이면 🏫)
3. 학원 아이콘 (academy_fee > 0이면 📚)
4. 임시 항목 아이콘 (extra_items 있으면 🎒)
5. 메모 표시기 (memo 있으면 작은 점)
6. 합계 금액 (total > 0이면 표시)

##### 10. 인수 조건

```gherkin
Given settings_v1에 학교 월~금, 1160, 왕복으로 저장된 상태
When 5월 캘린더가 표시되면
Then 5/4 (월요일) 셀에 "🏫" 아이콘과 "2,320" 금액이 표시되어야 한다
And 5/3 (일요일) 셀에 "🏫" 아이콘이 없어야 한다
And 5/5 (화요일, 어린이날) 셀에 "어린이날" 텍스트가 표시되어야 한다
And 5/5 셀에 "🏫" 아이콘이 없어야 한다 (공휴일 등교 안 함)

Given 학원 등원 요일이 수, 금이고 공휴일 등원함 설정
When 5/1 (금요일, 노동절) 셀을 보면
Then "📚" 아이콘이 표시되어야 한다 (공휴일에도 학원)
And 학원 금액 2,320이 합계에 포함되어야 한다

Given 5/14 셀에 임시 항목 8000원이 등록된 상태
When 캘린더를 보면
Then 5/14 셀에 "🎒" 아이콘이 표시되어야 한다
And 합계가 학교+학원+임시항목으로 계산되어야 한다 (예: 2320+2320+8000=12640)
```

##### 11. 테스트 케이스

###### 정상 (TC-F1-2-001 ~ 010)

| ID | 시나리오 | 예상 |
|---|---|---|
| TC-F1-2-001 | 평일 학교 등교일 | 🏫, 학교 단가×2 |
| TC-F1-2-002 | 평일 학원 등원일 | 📚, 학원 단가×2 |
| TC-F1-2-003 | 평일 학교+학원 | 🏫📚, 합계 |
| TC-F1-2-004 | 평일 임시항목만 | 🎒, 임시 금액 |
| TC-F1-2-005 | 토요일 (학교 없음) | 빈 셀 (날짜만) |
| TC-F1-2-006 | 일요일 | 빈 셀 (날짜만, 빨간색 숫자 X) |
| TC-F1-2-007 | 공휴일 + 학교 안 감 설정 | 공휴일 이름 + 학교 아이콘 X |
| TC-F1-2-008 | 공휴일 + 학원 감 설정 | 공휴일 이름 + 📚 |
| TC-F1-2-009 | 공휴일 + 임시항목 | 공휴일 이름 + 🎒 |
| TC-F1-2-010 | 메모만 있는 셀 | 점 표시기만 |

###### 엣지 케이스 (TC-F1-2-101 ~ 110)

| ID | 시나리오 | 예상 |
|---|---|---|
| TC-F1-2-101 | 월의 1일이 일요일 (5월 같은) | 일요일 첫 칸에 1일 |
| TC-F1-2-102 | 월의 마지막 날이 토요일 | 마지막 행 일부 빈 셀 |
| TC-F1-2-103 | 28일 짜리 달 (2월) | 4행 표시 |
| TC-F1-2-104 | 31일 + 첫날 토요일 (5주에 걸침) | 6행 표시 |
| TC-F1-2-105 | 윤년 2월 29일 | 정상 표시 (2024, 2028 등) |
| TC-F1-2-106 | 임시항목 3개 | 🎒 1개 + 합계 표시 |
| TC-F1-2-107 | 학교 요일에 공휴일 | 공휴일 우선 표시 |
| TC-F1-2-108 | 단가 1원 | 1원 표시 |
| TC-F1-2-109 | 공휴일 데이터 없는 미래 (2031) | 평일로 처리 |
| TC-F1-2-110 | 학교 학원 없는 날 + 임시 0원 | 빈 셀 |

---

#### 🎯 F1-3. 화면 하단 정산표 + 합계

##### 1. 사용자 스토리

> **As** 자녀
> **I want** 캘린더 아래에 항목별 계산식과 월 합계를 한눈에 보면
> **So that** 청구액을 빠르게 확인하고 부모님께 설명할 수 있다

##### 2. 사전·사후 조건

| 구분 | 조건 |
|---|---|
| **사전 조건** | 1. F1-2 캘린더가 렌더링됨<br>2. 셀별 계산이 완료됨 |
| **사후 조건** | 1. 정산표가 캘린더 하단에 표시됨<br>2. 합계가 강조 표시됨 |

##### 3. 정상 흐름

```
1. F1-2 완료 후 시스템이 모든 셀 데이터를 수집
2. 시스템: 항목별 합계 계산
   - 기본 용돈 = settings.base_allowance
   - 학교 합계 = Σ(cells 중 school_fee > 0인 것의 school_fee)
   - 학교 일수 = count(cells 중 school_fee > 0)
   - 학원 합계 = Σ(academy_fee > 0인 것)
   - 학원 일수 = count(academy_fee > 0)
   - 임시 항목 합계 = Σ(모든 cells의 extra_total)
3. 시스템: 총 합계 = 기본 + 학교 + 학원 + 임시
4. 시스템: 정산표 컴포넌트 렌더링
5. 사용자: 한눈에 항목별 계산식과 합계 확인
```

##### 4. 대체 흐름

###### 4.1 학교 또는 학원 없음
- 해당 행 표시 안 함 (정산표가 짧아짐)
- 예: 학원 없으면 "📚 학원 버스" 행 생략

###### 4.2 임시 항목 없음
- "임시 항목" 행 표시 안 함

###### 4.3 임시 항목 다수 (5개 이상)
- 각 항목별로 표시할지, 카테고리별로 묶을지 결정
- 1단계: 카테고리별로 그룹핑 (가독성)

##### 5. 예외 흐름

###### 5.1 합계가 0원 (모든 항목 0)
- "이번 달 청구할 항목이 없습니다" 안내 메시지
- [메시지 복사] 버튼 비활성

###### 5.2 합계가 비정상적으로 큼 (1억 이상)
- 콘솔 경고 출력 (개발자용)
- 사용자에게는 그대로 표시 (사용자 자율)

##### 6. 입력 검증 규칙

이 기능은 사용자 입력 없음.

##### 7. UI 컴포넌트 구조

```jsx
<SummaryTable>
  <SummaryHeader>
    <Title>{`${year}년 ${month}월 정산`}</Title>
  </SummaryHeader>

  <SummaryBody>
    {calc.base_allowance > 0 && (
      <SummaryRow>
        <Cell>💰 기본 용돈</Cell>
        <Cell align="right">{formatCurrency(calc.base_allowance)}원</Cell>
      </SummaryRow>
    )}

    {calc.school_total > 0 && (
      <SummaryRow>
        <Cell>🏫 학교 버스</Cell>
        <Cell>
          <Subtext>
            {formatCurrency(settings.school.fare)} × {settings.school.round_trip ? 2 : 1} × {calc.school_days_count}일
          </Subtext>
        </Cell>
        <Cell align="right">{formatCurrency(calc.school_total)}원</Cell>
      </SummaryRow>
    )}

    {calc.academy_total > 0 && (
      <SummaryRow>...</SummaryRow>
    )}

    {extraItemsByCategory.map(group => (
      <SummaryRow key={group.category}>
        <Cell>{group.icon} {group.category}</Cell>
        <Cell>
          <Subtext>{group.items.length}건</Subtext>
        </Cell>
        <Cell align="right">{formatCurrency(group.total)}원</Cell>
      </SummaryRow>
    ))}
  </SummaryBody>

  <Divider />

  <SummaryFooter>
    <Cell>총 합계</Cell>
    <Cell align="right">
      <TotalAmount>{formatCurrency(calc.total)}원</TotalAmount>
    </Cell>
  </SummaryFooter>
</SummaryTable>
```

##### 8. 데이터 처리

```typescript
function buildSummary(
  settings: Settings_v1,
  cells: CellData[]
): Summary {
  // 학교 합계
  const schoolCells = cells.filter(c => c.school_fee > 0);
  const school_total = schoolCells.reduce((s, c) => s + c.school_fee, 0);
  const school_days_count = schoolCells.length;

  // 학원 합계
  const academyCells = cells.filter(c => c.academy_fee > 0);
  const academy_total = academyCells.reduce((s, c) => s + c.academy_fee, 0);
  const academy_days_count = academyCells.length;

  // 임시 항목 합계 + 카테고리별 그룹핑
  const allExtraItems: ExtraItem[] = [];
  cells.forEach(c => allExtraItems.push(...c.extra_items));

  const extraByCategory = new Map<string, ExtraItem[]>();
  allExtraItems.forEach(item => {
    if (!extraByCategory.has(item.category)) {
      extraByCategory.set(item.category, []);
    }
    extraByCategory.get(item.category)!.push(item);
  });

  const extraItemsTotal = allExtraItems.reduce((s, i) => s + i.amount, 0);

  // 총 합계
  const total = settings.base_allowance + school_total + academy_total + extraItemsTotal;

  return {
    base_allowance: settings.base_allowance,
    school_total,
    school_days_count,
    academy_total,
    academy_days_count,
    extra_items_total: extraItemsTotal,
    extra_by_category: extraByCategory,
    total
  };
}
```

##### 9. 비즈니스 로직

###### 9.1 표시 우선순위
1. 기본 용돈 (항상 표시, 0원이어도)
2. 학교 (있을 때만)
3. 학원 (있을 때만)
4. 임시 항목 카테고리별 (있을 때만)
5. 합계 (항상 강조)

###### 9.2 카테고리별 그룹핑

같은 카테고리 임시 항목 다수면:
```
🎒 체험학습 (3건)    32,000원
```
처럼 묶어서 표시 (개별 클릭 시 상세는 캘린더 셀에서)

###### 9.3 실시간 갱신

임시 항목 추가/삭제 시 즉시 정산표 갱신 (React state 사용)

##### 10. 인수 조건

```gherkin
Given 5월 캘린더에 학교 18일, 학원 9일, 체험학습 8000원 1건이 등록된 상태
When 정산표를 보면
Then 다음 행이 표시되어야 한다:
  | 항목 | 계산 | 금액 |
  | 💰 기본 용돈 | | 80,000원 |
  | 🏫 학교 버스 | 1,160 × 2 × 18일 | 41,760원 |
  | 📚 학원 버스 | 1,160 × 2 × 9일 | 20,880원 |
  | 🎒 체험학습 | 1건 | 8,000원 |
And 합계 행에 "150,640원"이 강조 표시되어야 한다

Given 학원이 없는 가정 (academy.days = [])
When 정산표를 보면
Then "📚 학원 버스" 행이 표시되지 않아야 한다

Given 임시 항목이 모두 같은 카테고리 (체험학습 3건)
When 정산표를 보면
Then "🎒 체험학습 (3건)" 으로 묶여서 표시되어야 한다
```

##### 11. 테스트 케이스

| ID | 시나리오 | 예상 |
|---|---|---|
| TC-F1-3-001 | 기본 + 학교 + 학원 | 3행 + 합계 |
| TC-F1-3-002 | 학원만 없음 | 학교 행만 표시 |
| TC-F1-3-003 | 임시 항목 1건 | 임시 행 추가 |
| TC-F1-3-004 | 임시 항목 동일 카테고리 3건 | 1개 행으로 묶임 (3건) |
| TC-F1-3-005 | 임시 항목 다른 카테고리 3건 | 3개 행 |
| TC-F1-3-006 | 합계 0원 | "청구할 항목이 없습니다" |
| TC-F1-3-007 | 임시 항목 추가 후 | 정산표 즉시 갱신 |
| TC-F1-3-008 | 임시 항목 삭제 후 | 정산표 즉시 갱신 |
| TC-F1-3-009 | 학교 일수 0일 (모두 공휴일) | 학교 행 표시 안 함 |
| TC-F1-3-010 | 학교 단가 변경 후 | 모든 합계 재계산 |

---
#### 🎯 F1-4. 비고 버튼 (요금표 + 아이콘 안내)

##### 1. 사용자 스토리

> **As** 자녀
> **I want** 캘린더 옆 [비고] 버튼을 누르면 아이콘 의미와 최신 요금표를 볼 수 있어
> **So that** 단가가 정확한지 확인하고 부모님께 근거를 제시할 수 있다

##### 2. 사전·사후 조건

| 구분 | 조건 |
|---|---|
| **사전 조건** | 1. 메인 화면 표시됨 |
| **사후 조건** | 1. 비고 패널이 화면에 표시됨 (드로어/바텀시트)<br>2. 아이콘 의미와 요금표가 표시됨 |

##### 3. 정상 흐름

```
1. 사용자가 [📌 비고] 버튼 클릭
2. 시스템: 디바이스 폭 확인
   - 768px 이상: 우측 드로어 슬라이드 인 (300ms)
   - 768px 미만: 하단 바텀시트 슬라이드 업 (300ms)
3. 시스템: 비고 패널에 다음 표시:
   - 아이콘 안내 (8.5.F1-4.7.1 참조)
   - 경기도 시내버스 일반형 요금표 (8.5.F1-4.7.2 참조)
   - 출처 + 시행일
4. 사용자: 패널 닫기
   - [×] 버튼
   - 외부 클릭 (드로어/바텀시트 외부)
   - ESC 키
   - 모바일: 아래로 스와이프
```

##### 4. 대체 흐름

###### 4.1 패널이 이미 열려있는 상태에서 버튼 재클릭
- 패널 닫기 (토글 동작)

###### 4.2 디바이스 회전 (모바일)
- 가로 모드: 우측 드로어로 전환
- 세로 모드: 하단 바텀시트로 전환

##### 5. 예외 흐름

###### 5.1 매우 작은 화면 (320px 미만)
- 바텀시트가 화면 거의 전체를 차지
- 스크롤 가능

##### 6. 입력 검증 규칙

이 기능은 사용자 입력 없음.

##### 7. UI 컴포넌트 구조

```jsx
<NotesPanel
  isOpen={showNotes}
  variant={isMobile ? "bottom-sheet" : "drawer"}
  onClose={handleClose}
>
  <PanelHeader>
    <Title>📌 비고</Title>
    <CloseButton onClick={handleClose} />
  </PanelHeader>

  <PanelBody>
    <Section title="아이콘 안내">
      <IconList>
        <IconRow icon="🏫" label="학교 등교 (왕복 버스)" />
        <IconRow icon="📚" label="학원 등원 (왕복 버스)" />
        <IconRow icon="🎒" label="임시 항목 (체험학습 등)" />
        <IconRow icon="🔴" label="법정공휴일" />
      </IconList>
    </Section>

    <Section title="경기도 시내버스 일반형 요금표">
      <FareTable>
        <thead>
          <tr>
            <th>대상</th>
            <th>편도</th>
            <th>왕복</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>일반 (만 19세 이상)</td>
            <td>1,650원</td>
            <td>3,300원</td>
          </tr>
          <tr className="highlighted">
            <td>청소년 (만 13~18세) ★</td>
            <td>1,160원</td>
            <td>2,320원</td>
          </tr>
          <tr>
            <td>어린이 (만 6~12세)</td>
            <td>830원</td>
            <td>1,660원</td>
          </tr>
        </tbody>
      </FareTable>

      <SourceInfo>
        <Label>출처:</Label> 경기버스운송사업조합 (gbus.or.kr)
        <Label>시행일:</Label> 2025년 10월 25일
      </SourceInfo>
    </Section>

    <Section title="기타">
      <NotesText>
        ※ 이 정보는 참고용이며, 실제 요금은 거주 지역에 따라 다를 수 있습니다.
        설정에서 단가를 변경할 수 있습니다.
      </NotesText>
    </Section>
  </PanelBody>
</NotesPanel>
```

##### 8. 데이터 처리

요금표는 **정적 데이터** (코드에 내장).

```typescript
// constants/fares.js
export const KOREAN_BUS_FARES = {
  region: "경기도",
  type: "시내버스 일반형",
  effective_from: "2025-10-25",
  source: "경기버스운송사업조합 (gbus.or.kr)",
  fares: [
    {
      category: "일반",
      age_range: "만 19세 이상",
      one_way: 1650,
      round_trip: 3300
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
      round_trip: 1660
    }
  ]
};
```

##### 9. 비즈니스 로직

###### 9.1 반응형 분기

```typescript
function getPanelVariant(): "drawer" | "bottom-sheet" {
  if (window.innerWidth >= 768) return "drawer";
  return "bottom-sheet";
}

// 윈도우 리사이즈 감지
useEffect(() => {
  const handler = () => setVariant(getPanelVariant());
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}, []);
```

###### 9.2 애니메이션

- 드로어: 우측에서 좌측으로 슬라이드 (transform: translateX)
- 바텀시트: 아래에서 위로 슬라이드 (transform: translateY)
- 지속 시간: 300ms
- Easing: ease-out
- 외부 영역: 반투명 검은 배경 (rgba(0,0,0,0.5))

###### 9.3 키보드 접근성

- ESC 키: 닫기
- Tab: 패널 내부 포커스 트랩
- 닫힌 후: 트리거 버튼([📌 비고])에 포커스 복귀

##### 10. 인수 조건

```gherkin
Given 메인 화면이 표시된 상태
When 사용자가 [📌 비고] 버튼을 클릭하면
Then 데스크톱(≥768px)에서는 우측 드로어가 표시되어야 한다
And 모바일(<768px)에서는 하단 바텀시트가 표시되어야 한다
And 패널 안에 아이콘 안내가 표시되어야 한다
And 패널 안에 경기도 시내버스 요금표가 표시되어야 한다
And 청소년 요금 행이 강조 표시되어야 한다 (★ 표시 + 배경 색상)
And 출처와 시행일이 표시되어야 한다

Given 비고 패널이 열린 상태
When 사용자가 ESC 키를 누르면
Then 패널이 닫혀야 한다
And 포커스가 [📌 비고] 버튼으로 돌아가야 한다

Given 비고 패널이 열린 상태
When 사용자가 패널 외부 영역을 클릭하면
Then 패널이 닫혀야 한다
```

##### 11. 테스트 케이스

| ID | 시나리오 | 예상 |
|---|---|---|
| TC-F1-4-001 | 데스크톱에서 클릭 | 우측 드로어 표시 |
| TC-F1-4-002 | 모바일에서 클릭 | 하단 바텀시트 표시 |
| TC-F1-4-003 | 닫기 X 버튼 | 패널 닫힘 |
| TC-F1-4-004 | 외부 클릭 | 패널 닫힘 |
| TC-F1-4-005 | ESC 키 | 패널 닫힘 |
| TC-F1-4-006 | 비고 버튼 재클릭 (열린 상태) | 패널 닫힘 (토글) |
| TC-F1-4-007 | 모바일 아래 스와이프 | 바텀시트 닫힘 |
| TC-F1-4-008 | 데스크톱 → 모바일 리사이즈 | 드로어 → 바텀시트 전환 |
| TC-F1-4-009 | 320px 작은 화면 | 바텀시트가 화면 대부분 차지 |
| TC-F1-4-010 | 키보드 Tab | 패널 내부 포커스 트랩 |

---

#### 🎯 F1-5. 임시 항목 추가 + 메모

##### 1. 사용자 스토리

> **As** 자녀
> **I want** 특정 날짜에 비정기 지출(체험학습 등)을 추가하고 메모를 남길 수 있어
> **So that** 청구 시 빠뜨리지 않고 부모님께 설명할 수 있다

##### 2. 사전·사후 조건

| 구분 | 조건 |
|---|---|
| **사전 조건** | 1. 캘린더 화면 표시됨<br>2. 셀 하나 이상 클릭 가능 |
| **사후 조건** | 1. 임시 항목이 calendar_v1_YYYY_MM에 저장됨<br>2. 캘린더 셀에 🎒 아이콘 추가됨<br>3. 정산표에 임시 항목 합산됨 |

##### 3. 정상 흐름 — 임시 항목 추가

```
1. 사용자가 캘린더 셀 클릭
2. 시스템: 셀 편집 모달 표시
   - 상단: 날짜 + 요일 + (공휴일 시 이름)
   - 기본 항목 섹션 (학교, 학원 - 수정 불가)
   - 임시 항목 섹션
   - 메모 섹션
3. 사용자가 [+ 임시 항목 추가] 버튼 클릭
4. 시스템: 빈 임시 항목 폼 추가:
   - 카테고리 드롭다운 (선택, 자동 포커스)
   - 이름 입력 필드
   - 금액 입력 필드
5. 사용자: 입력
   - 카테고리: "체험학습" 선택
   - 이름: "박물관 체험비"
   - 금액: 8000
6. 사용자: [저장] 버튼 클릭
7. 시스템: 검증 (8.5.F1-5.6)
8. 시스템: 검증 통과 시:
   - 임시 항목 객체 생성:
     {
       id: "ex_" + nanoid(6),
       category: "체험학습",
       name: "박물관 체험비",
       amount: 8000,
       created_at: now()
     }
   - calendar_v1_YYYY_MM의 해당 셀에 추가
   - localStorage 저장
9. 시스템: 모달 닫기
10. 시스템: 캘린더 셀 갱신 (🎒 아이콘 + 합계 갱신)
11. 시스템: 정산표 갱신
```

##### 3.b 정상 흐름 — 메모 추가

```
1. 사용자가 캘린더 셀 클릭 → 모달 표시
2. 사용자: 메모 영역에 "ㅇㅇ박물관 단체 관람" 입력
3. 사용자: [저장] 클릭
4. 시스템: 메모 검증 (200자 이내)
5. 시스템: calendar_v1의 cells[date].memo에 저장
6. 시스템: 모달 닫기
7. 시스템: 셀에 메모 표시기(작은 점) 추가
```

##### 4. 대체 흐름

###### 4.1 임시 항목 4개째 추가 시도
- [+ 임시 항목 추가] 버튼이 비활성 상태
- 안내 텍스트: "최대 3개까지 추가할 수 있습니다"

###### 4.2 임시 항목 수정
- 기존 항목 옆 [수정] 버튼 클릭
- 카테고리/이름/금액 편집 가능
- [저장] 시 동일 ID로 덮어쓰기

###### 4.3 임시 항목 삭제
- 기존 항목 옆 [삭제] 버튼 클릭
- 확인 모달: "이 항목을 삭제할까요?"
- [삭제] 클릭 시 calendar_v1에서 해당 ID 제거

###### 4.4 메모만 추가/수정
- 임시 항목 추가 없이 메모만 입력 가능
- 빈 메모로 저장 시 cells[date].memo = "" (필드는 유지)

###### 4.5 셀이 비어있는 상태에서 클릭
- 모달 표시 (학교/학원 없는 평일도)
- 임시 항목 / 메모 추가 가능

###### 4.6 사용자 정의 카테고리 추가
- 카테고리 드롭다운 마지막에 [+ 새 카테고리]
- 클릭 시 입력 필드 + 이모지 선택 표시
- 저장 시 custom_categories_v1에 추가

##### 5. 예외 흐름

###### 5.1 검증 실패
- 빨간 에러 메시지 표시
- 모달 닫지 않음

###### 5.2 저장 실패 (스토리지 에러)
- 에러 모달: "저장 실패"
- [다시 시도] 버튼

###### 5.3 모달 외부 클릭 시 (저장 안 한 변경 있음)
- 확인 모달: "저장하지 않은 변경 사항이 있습니다. 닫을까요?"
- [닫기] / [계속 편집]

###### 5.4 ID 중복 발생 (이론상 거의 0%)
- 새 ID 재생성 후 다시 시도

##### 6. 입력 검증 규칙

###### 임시 항목

| 필드 | 규칙 | 에러 메시지 |
|---|---|---|
| 카테고리 | 필수 선택, 1자 이상 | "카테고리를 선택해주세요" |
| 이름 | 필수, 1~50자 | "이름을 입력해주세요" / "50자 이내로 입력해주세요" |
| 금액 | 필수, 정수, 1 ~ 10,000,000 | "금액을 입력해주세요" / "1원 이상 10,000,000원 이하로 입력해주세요" |

###### 메모

| 필드 | 규칙 | 에러 메시지 |
|---|---|---|
| 내용 | 0~200자 | "200자 이내로 입력해주세요" |

###### 셀당 임시 항목 한도

- 셀당 최대 3개
- 4번째 추가 시도 시 [+ 추가] 버튼 비활성

##### 7. UI 컴포넌트 구조

```jsx
<CellEditModal
  date={selectedDate}
  isOpen={isOpen}
  onClose={handleClose}
  onSave={handleSave}
>
  <ModalHeader>
    <DateText>
      {formatDateLong(date)}{" "}
      {weekday}{" "}
      {isHoliday && <HolidayBadge>{holidayName}</HolidayBadge>}
    </DateText>
  </ModalHeader>

  <ModalBody>
    <Section title="기본 항목 (자동, 수정 불가)">
      {schoolFee > 0 && <RowReadOnly>🏫 학교 등교 - {formatCurrency(schoolFee)}원</RowReadOnly>}
      {academyFee > 0 && <RowReadOnly>📚 학원 등원 - {formatCurrency(academyFee)}원</RowReadOnly>}
    </Section>

    <Section title={`임시 항목 (${extraItems.length}/3)`}>
      {extraItems.map(item => (
        <ExtraItemRow
          key={item.id}
          item={item}
          onEdit={() => setEditing(item.id)}
          onDelete={() => confirmDelete(item.id)}
        />
      ))}

      {extraItems.length < 3 && (
        <Button onClick={handleAdd} variant="outlined">
          + 임시 항목 추가
        </Button>
      )}

      {extraItems.length >= 3 && (
        <Hint>최대 3개까지 추가할 수 있습니다</Hint>
      )}
    </Section>

    {showAddForm && (
      <ExtraItemForm
        onSave={handleAddSave}
        onCancel={() => setShowAddForm(false)}
      />
    )}

    <Section title="메모">
      <Textarea
        value={memo}
        onChange={handleMemoChange}
        maxLength={200}
        placeholder="메모를 입력해주세요 (선택)"
      />
      <CharCount>{memo.length} / 200</CharCount>
    </Section>
  </ModalBody>

  <ModalFooter>
    <Button onClick={handleClose} variant="text">취소</Button>
    <Button onClick={handleSave} variant="primary">저장</Button>
  </ModalFooter>
</CellEditModal>
```

###### ExtraItemForm 컴포넌트

```jsx
<ExtraItemForm>
  <FormRow>
    <Label>카테고리</Label>
    <CategorySelect
      value={category}
      onChange={setCategory}
      options={[
        ...defaultCategories,
        ...customCategories,
        { value: "__add_new__", label: "+ 새 카테고리" }
      ]}
    />
  </FormRow>

  <FormRow>
    <Label>이름</Label>
    <Input
      value={name}
      onChange={setName}
      maxLength={50}
      placeholder="예: 박물관 체험비"
    />
  </FormRow>

  <FormRow>
    <Label>금액</Label>
    <CurrencyInput
      value={amount}
      onChange={setAmount}
      min={1}
      max={10000000}
      suffix="원"
    />
  </FormRow>

  <FormFooter>
    <Button onClick={onCancel} variant="text">취소</Button>
    <Button onClick={onSave} variant="primary">추가</Button>
  </FormFooter>
</ExtraItemForm>
```

###### 기본 카테고리 목록

```typescript
export const DEFAULT_CATEGORIES = [
  { id: "교재비", icon: "📚", name: "교재비" },
  { id: "체험학습", icon: "🎒", name: "체험학습" },
  { id: "준비물", icon: "✏️", name: "준비물" },
  { id: "식비", icon: "🍱", name: "식비" },
  { id: "의류", icon: "👕", name: "의류" },
  { id: "선물", icon: "🎁", name: "선물" },
  { id: "의료비", icon: "💊", name: "의료비" },
  { id: "교통(특별)", icon: "🚇", name: "교통(특별)" },
  { id: "기타", icon: "✨", name: "기타" }
];
```

##### 8. 데이터 처리

###### 8.1 임시 항목 추가

```typescript
async function addExtraItem(
  date: string,
  input: ExtraItemInput
): Promise<Result> {
  // 1. 검증
  const validation = validateExtraItem(input);
  if (!validation.valid) return { success: false, errors: validation.errors };

  // 2. 한도 검사
  const calendar = loadCalendarMonth(...);
  const cell = calendar.cells[date] || { extra_items: [], memo: "" };
  if (cell.extra_items.length >= 3) {
    return { success: false, error: "MAX_ITEMS_REACHED" };
  }

  // 3. ID 생성 (충돌 방지)
  const id = "ex_" + nanoid(6);
  // 충돌 검사 (이론상 거의 0%, 충돌 시 재생성)

  // 4. 객체 생성
  const item: ExtraItem = {
    id,
    category: input.category,
    name: input.name,
    amount: input.amount,
    created_at: new Date().toISOString()
  };

  // 5. 추가
  cell.extra_items.push(item);
  calendar.cells[date] = cell;
  calendar.updated_at = new Date().toISOString();

  // 6. 저장
  try {
    saveCalendarMonth(calendar);
  } catch (e) {
    return { success: false, error: "STORAGE_ERROR" };
  }

  return { success: true, item };
}
```

###### 8.2 임시 항목 수정

```typescript
async function updateExtraItem(
  date: string,
  itemId: string,
  changes: Partial<ExtraItemInput>
): Promise<Result> {
  // ... 검증 ...

  const calendar = loadCalendarMonth(...);
  const cell = calendar.cells[date];
  const item = cell?.extra_items.find(i => i.id === itemId);
  if (!item) return { success: false, error: "ITEM_NOT_FOUND" };

  // 변경 적용
  Object.assign(item, changes);
  calendar.updated_at = new Date().toISOString();

  saveCalendarMonth(calendar);
  return { success: true };
}
```

###### 8.3 임시 항목 삭제

```typescript
async function deleteExtraItem(
  date: string,
  itemId: string
): Promise<Result> {
  const calendar = loadCalendarMonth(...);
  const cell = calendar.cells[date];
  if (!cell) return { success: false, error: "CELL_NOT_FOUND" };

  cell.extra_items = cell.extra_items.filter(i => i.id !== itemId);

  // 셀이 완전히 비면 삭제 (메모도 없을 때)
  if (cell.extra_items.length === 0 && !cell.memo) {
    delete calendar.cells[date];
  }

  calendar.updated_at = new Date().toISOString();
  saveCalendarMonth(calendar);
  return { success: true };
}
```

###### 8.4 메모 저장

```typescript
async function setMemo(date: string, memo: string): Promise<Result> {
  if (memo.length > 200) {
    return { success: false, error: "MEMO_TOO_LONG" };
  }

  const calendar = loadCalendarMonth(...);
  const cell = calendar.cells[date] || { extra_items: [], memo: "" };
  cell.memo = memo;

  if (memo === "" && cell.extra_items.length === 0) {
    delete calendar.cells[date];
  } else {
    calendar.cells[date] = cell;
  }

  calendar.updated_at = new Date().toISOString();
  saveCalendarMonth(calendar);
  return { success: true };
}
```

##### 9. 비즈니스 로직

###### 9.1 카테고리 정책

- 기본 카테고리는 항상 제공
- 사용자 정의 카테고리는 `custom_categories_v1`에 저장
- 카테고리 이름 중복 허용 (예: "체험학습" 기본 + "체험학습" 사용자 추가)
- 사용자 정의 삭제 시 사용 중인 임시 항목은 그대로 (이름 보존)

###### 9.2 ID 생성 정책

- 임시 항목 ID: `ex_` + nanoid(6) (예: `ex_a3f9k2`)
- 충돌 가능성: 36^6 ≈ 22억 → 가족 단위에서 거의 0%
- 충돌 시: 재생성 후 재시도 (최대 3회)

###### 9.3 변경 이력 정책

1단계는 변경 이력 기록 안 함 (단일 사용자라 불필요).
- updated_at만 갱신
- 2단계에서 변경 이력 추가

###### 9.4 빈 셀 정리

- extra_items가 빈 배열이고 memo도 빈 문자열이면 cells[date] 자체를 삭제
- 데이터 크기 최소화

##### 10. 인수 조건

```gherkin
Given 5/14 셀에 임시 항목이 없는 상태
When 사용자가 5/14 셀을 클릭하면
Then 셀 편집 모달이 열려야 한다
And [+ 임시 항목 추가] 버튼이 활성 상태여야 한다
And 메모 영역이 비어있어야 한다

Given 셀 편집 모달이 열린 상태
When 사용자가 [+ 임시 항목 추가] 클릭 후
   카테고리 "체험학습", 이름 "박물관", 금액 8000 입력하고
   [추가] 버튼 클릭하면
Then 임시 항목 폼이 닫혀야 한다
And 임시 항목 목록에 1건 표시되어야 한다
And [저장] 클릭 후 모달이 닫혀야 한다
And 5/14 셀에 🎒 아이콘이 표시되어야 한다
And 5/14 셀의 합계에 8,000원이 추가되어야 한다
And 정산표에 "🎒 체험학습 (1건) 8,000원" 행이 추가되어야 한다

Given 5/14 셀에 임시 항목 3개가 이미 있는 상태
When 셀 편집 모달을 열면
Then [+ 임시 항목 추가] 버튼이 비활성 상태여야 한다
And "최대 3개까지 추가할 수 있습니다" 안내가 표시되어야 한다

Given 메모에 250자 입력 시도
When 200자에 도달하면
Then 추가 입력이 차단되어야 한다
And "200/200" 카운터가 빨간색으로 표시되어야 한다
```

##### 11. 테스트 케이스

| ID | 시나리오 | 예상 |
|---|---|---|
| TC-F1-5-001 | 임시 항목 1개 추가 | 셀에 🎒, 합계 갱신 |
| TC-F1-5-002 | 임시 항목 3개 추가 | 4번째 추가 버튼 비활성 |
| TC-F1-5-003 | 임시 항목 수정 | 동일 ID로 갱신 |
| TC-F1-5-004 | 임시 항목 삭제 | 셀에서 제거 |
| TC-F1-5-005 | 모든 임시 항목 삭제 | 🎒 아이콘 사라짐 |
| TC-F1-5-006 | 메모만 입력 | 점 표시기, 임시 항목 0개 |
| TC-F1-5-007 | 메모 200자 정확히 | 정상 저장 |
| TC-F1-5-008 | 메모 201자 | 입력 차단 |
| TC-F1-5-009 | 카테고리 선택 안 함 | 검증 실패 |
| TC-F1-5-010 | 이름 0자 | 검증 실패 |
| TC-F1-5-011 | 이름 51자 | 입력 차단 |
| TC-F1-5-012 | 금액 0 | 검증 실패 |
| TC-F1-5-013 | 금액 음수 | 검증 실패 |
| TC-F1-5-014 | 금액 1천만 초과 | 검증 실패 |
| TC-F1-5-015 | 사용자 정의 카테고리 추가 | custom_categories_v1에 저장 |
| TC-F1-5-016 | 같은 셀에 다른 카테고리 항목 | 모두 표시, 정산표 분리 |
| TC-F1-5-017 | 같은 셀에 같은 카테고리 항목 2개 | 정산표에서 카테고리별 묶임 |
| TC-F1-5-018 | 모달 외부 클릭 (변경 안 함) | 모달 그냥 닫힘 |
| TC-F1-5-019 | 모달 외부 클릭 (변경 있음) | 확인 모달 |
| TC-F1-5-020 | 빈 셀에서 추가 후 모두 삭제 | cells[date] 키 자체 삭제 |

---

#### 🎯 F1-6. 청구 메시지 자동 생성 (카톡 복사용)

##### 1. 사용자 스토리

> **As** 자녀
> **I want** [메시지 복사] 버튼을 누르면 청구 메시지가 자동 생성되어 클립보드에 복사되어
> **So that** 카톡 등에 바로 붙여넣어 부모님께 보낼 수 있다

##### 2. 사전·사후 조건

| 구분 | 조건 |
|---|---|
| **사전 조건** | 1. 캘린더 표시됨<br>2. 정산표 합계 > 0 |
| **사후 조건** | 1. 메시지가 클립보드에 복사됨<br>2. 토스트 알림 "복사되었습니다" 표시 |

##### 3. 정상 흐름

```
1. 사용자가 [📋 메시지 복사] 버튼 클릭
2. 시스템: 합계 검증 (0원이면 차단)
3. 시스템: 메시지 생성 (8.4.4 알고리즘)
4. 시스템: 클립보드 API 호출
   navigator.clipboard.writeText(message)
5. 시스템: 성공 시:
   - 토스트 알림 "📋 복사되었습니다" (3초)
   - 버튼 잠시 강조 (✓ 아이콘 1초 후 원복)
6. 사용자: 카톡 등에 붙여넣기 → 부모님께 송신
```

##### 4. 대체 흐름

###### 4.1 합계 0원
- 토스트: "청구할 항목이 없습니다"
- 버튼은 비활성 상태 (회색)

###### 4.2 미리보기 후 복사 (선택 추가)
- 1단계는 직접 복사 (미리보기 없음)
- 향후 [미리보기] 모달 추가 가능

##### 5. 예외 흐름

###### 5.1 클립보드 API 미지원 (구형 브라우저)
- 시스템: try/catch로 감지
- 폴백: 메시지를 텍스트 영역에 표시 + "수동 복사해주세요" 안내
- [복사 모달]에 readonly textarea + 자동 선택

###### 5.2 클립보드 권한 거부
- 시스템: 동일하게 폴백 모달 표시

###### 5.3 메시지 생성 실패 (settings/calendar 손상)
- 토스트: "메시지 생성 실패. 설정을 확인해주세요"

##### 6. 입력 검증 규칙

이 기능은 사용자 입력 없음.

##### 7. UI 컴포넌트 구조

```jsx
<MessageCopyButton
  disabled={total === 0}
  onClick={handleCopy}
>
  📋 메시지 복사
</MessageCopyButton>

<Toast
  isOpen={toastOpen}
  onClose={() => setToastOpen(false)}
  duration={3000}
>
  📋 복사되었습니다
</Toast>

{/* 폴백 모달 (클립보드 API 미지원 시) */}
<FallbackCopyModal
  isOpen={showFallback}
  message={generatedMessage}
  onClose={() => setShowFallback(false)}
>
  <Instructions>
    아래 메시지를 길게 눌러 복사해주세요:
  </Instructions>
  <Textarea readOnly value={message} autoFocus selected />
</FallbackCopyModal>
```

##### 8. 데이터 처리

```typescript
async function copyMessageToClipboard(): Promise<Result> {
  // 1. 메시지 생성
  const settings = loadSettings();
  const calendar = loadCalendarMonth(currentYear, currentMonth);
  const calc = calculateMonthlyAllowance(...);

  if (calc.total === 0) {
    return { success: false, error: "EMPTY_TOTAL" };
  }

  const message = generateClipboardMessage(...);

  // 2. 클립보드 API 호출
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(message);
      return { success: true };
    } catch (e) {
      // 권한 거부 등
      return { success: false, error: "CLIPBOARD_DENIED", message };
    }
  } else {
    // 구형 브라우저 폴백
    return { success: false, error: "CLIPBOARD_UNSUPPORTED", message };
  }
}
```

##### 9. 비즈니스 로직

###### 9.1 메시지 템플릿 변형

1단계는 단일 템플릿 (8.4.4의 메시지 형식). 향후 변형 추가 가능 (보류).

###### 9.2 메시지 길이

- 평균: 200~400자
- 최대 (임시항목 다수 시): 800자
- 카톡 메시지 한도: 5,000자 → 안전

###### 9.3 특수 문자 처리

- 이모지 그대로 사용 (UTF-8)
- 줄바꿈: `\n`
- 천 단위 구분: `Number.toLocaleString('ko-KR')`

##### 10. 인수 조건

```gherkin
Given 정산표 합계가 142,640원인 상태
When 사용자가 [📋 메시지 복사] 버튼을 클릭하면
Then 메시지가 클립보드에 복사되어야 한다
And "📋 복사되었습니다" 토스트가 3초간 표시되어야 한다
And 버튼이 1초간 ✓ 아이콘으로 강조되어야 한다

Given 클립보드의 내용
When 메모장 등에 붙여넣으면
Then 다음 형식으로 표시되어야 한다:
"""
📅 2026년 5월 용돈 청구

💰 기본 용돈           80,000원
   = 80,000 × 1

🏫 학교 버스비         41,760원
   = 1,160 × 2(왕복) × 18일

(...이하 생략)

합계                  142,640원

※ 5월 공휴일: 1일(노동절), 5일(어린이날), 25일(부처님오신날)
"""

Given 합계가 0원인 상태
When [📋 메시지 복사] 버튼을 보면
Then 버튼이 비활성 상태(회색)여야 한다
And 클릭해도 동작하지 않아야 한다

Given 구형 브라우저 (클립보드 API 미지원)에서
When [메시지 복사] 버튼을 클릭하면
Then 폴백 모달이 표시되어야 한다
And 메시지가 textarea에 표시되고 자동 선택되어야 한다
And "길게 눌러 복사해주세요" 안내가 표시되어야 한다
```

##### 11. 테스트 케이스

| ID | 시나리오 | 예상 |
|---|---|---|
| TC-F1-6-001 | 정상 복사 (Chrome 최신) | 클립보드 복사, 토스트 |
| TC-F1-6-002 | 정상 복사 (Safari 최신) | 동일 |
| TC-F1-6-003 | 정상 복사 (Edge 최신) | 동일 |
| TC-F1-6-004 | 정상 복사 (모바일 Chrome) | 동일 |
| TC-F1-6-005 | 정상 복사 (모바일 Safari) | 동일 |
| TC-F1-6-006 | 합계 0원 | 버튼 비활성 |
| TC-F1-6-007 | 임시항목 0개 | 임시항목 부분 메시지에서 생략 |
| TC-F1-6-008 | 학원 없음 | 학원 부분 메시지에서 생략 |
| TC-F1-6-009 | 공휴일 없는 달 | 공휴일 안내 메시지에서 생략 |
| TC-F1-6-010 | 임시항목 5건 | 모두 메시지에 포함 |
| TC-F1-6-011 | 합계 1,000,000원 | 1,000,000원 표시 |
| TC-F1-6-012 | 합계 100원 | 100원 표시 |
| TC-F1-6-013 | 자녀 이름 있음 | 메시지에 자녀 이름 포함 (선택) |
| TC-F1-6-014 | 자녀 이름 없음 | 자녀 이름 부분 생략 |
| TC-F1-6-015 | 클립보드 권한 거부 | 폴백 모달 |
| TC-F1-6-016 | 클립보드 API 없음 | 폴백 모달 |
| TC-F1-6-017 | 메시지 800자 (긴 케이스) | 정상 처리 |
| TC-F1-6-018 | 토스트 후 다시 복사 | 정상 동작 |
| TC-F1-6-019 | 복사 직후 카톡 붙여넣기 | 정확한 내용 확인 |
| TC-F1-6-020 | 한글 + 이모지 | 깨짐 없이 표시 |

---
#### 🎯 F1-7. 사용자가 원하는 달 미리 생성·편집

##### 1. 사용자 스토리

> **As** 자녀
> **I want** 이번 달뿐 아니라 다음 달, 그 다음 달도 미리 캘린더를 보고 임시 항목을 등록할 수 있어
> **So that** 학사일정 받자마자 미리 입력해두고 청구 시 빠뜨리지 않을 수 있다

##### 2. 사전·사후 조건

| 구분 | 조건 |
|---|---|
| **사전 조건** | 1. 캘린더 화면 표시됨 |
| **사후 조건** | 1. 사용자가 선택한 월의 캘린더가 표시됨<br>2. 임시 항목 / 메모가 해당 월의 데이터로 표시됨 |

##### 3. 정상 흐름

```
1. 사용자가 [◀ 이전 달] 또는 [다음 달 ▶] 버튼 클릭
2. 시스템: 현재 표시 월에서 ±1 적용
3. 시스템: 새 월의 calendar_v1_YYYY_MM 로드
   - 데이터 없으면 빈 객체 ({cells: {}}) 사용
4. 시스템: 캘린더 재렌더링
5. 시스템: meta_v1.current_view_month 갱신
6. 사용자: 해당 월에 임시 항목 추가 가능 (F1-5)
```

##### 3.b 정상 흐름 — 직접 월 선택

```
1. 사용자가 월 표시 영역 클릭
2. 시스템: 월 선택 드롭다운 표시
   - 현재 월 강조
   - ±12개월 범위 표시
3. 사용자: 원하는 월 선택
4. 시스템: 해당 월로 이동
```

##### 4. 대체 흐름

###### 4.1 미래 12개월 한도 도달
- [다음 달 ▶] 버튼이 비활성 (회색)
- 안내: "12개월 이후는 표시할 수 없습니다"

###### 4.2 과거 무한대 이동
- [◀ 이전 달] 버튼은 항상 활성
- 데이터 없는 과거 달은 빈 캘린더 표시

###### 4.3 키보드 화살표
- ← → 키로 월 이동
- 입력 필드 포커스 시 비활성

##### 5. 예외 흐름

###### 5.1 calendar_v1_YYYY_MM 손상
- 빈 객체로 폴백
- 에러 콘솔 출력
- 사용자에게는 영향 없음 (새로 입력 가능)

##### 6. 입력 검증 규칙

이 기능은 사용자 입력 없음.

##### 7. UI 컴포넌트 구조

```jsx
<MonthNavigator>
  <Button
    onClick={handlePrev}
    disabled={false /* 과거 무한대 */}
    aria-label="이전 달"
  >
    ◀
  </Button>

  <MonthSelector onClick={handleSelectorClick}>
    <Year>{year}년</Year>
    <Month>{month}월</Month>
  </MonthSelector>

  <Button
    onClick={handleNext}
    disabled={isFutureLimit}
    aria-label="다음 달"
  >
    ▶
  </Button>

  {showSelector && (
    <MonthDropdown
      currentYear={year}
      currentMonth={month}
      range={{
        from: { year: year - 1, month: 1 },
        to: { year: year + 1, month: 12 }
      }}
      onSelect={handleSelect}
    />
  )}
</MonthNavigator>
```

##### 8. 데이터 처리

```typescript
function navigateMonth(direction: "prev" | "next") {
  const { year, month } = currentMonth;
  let newYear = year, newMonth = month;

  if (direction === "next") {
    if (isAtFutureLimit()) return; // 12개월 한도
    newMonth++;
    if (newMonth > 12) { newYear++; newMonth = 1; }
  } else {
    newMonth--;
    if (newMonth < 1) { newYear--; newMonth = 12; }
  }

  // calendar_v1_YYYY_MM 로드
  const calendar = loadCalendarMonth(newYear, newMonth);

  // meta 갱신
  saveMetaCurrentView(`${newYear}-${pad(newMonth)}`);

  // state 갱신
  setCurrentMonth({ year: newYear, month: newMonth });
  setCurrentCalendar(calendar);
}

function isAtFutureLimit(): boolean {
  const today = new Date();
  const limit = new Date(today.getFullYear(), today.getMonth() + 12, 1);
  const current = new Date(year, month - 1, 1);
  return current >= limit;
}
```

##### 9. 비즈니스 로직

###### 9.1 미래 한도 정책

- 오늘 기준 +12개월까지 이동 가능
- 12개월 이상은 의미 없음 (학사일정도 1년 단위)
- 한도 변경 시 코드 상수만 수정

###### 9.2 과거 한도 정책

- 1단계는 무제한 (제한할 이유 없음)
- 단, 데이터 없는 과거 달은 빈 캘린더 표시
- 향후 4단계에서 데이터 보관 기간 정책 도입 시 변경

###### 9.3 월 변경 시 데이터 영향

- 현재 월 데이터는 그대로 유지 (자동 저장)
- 새 월의 데이터 로드
- 임시 항목 / 메모는 월별 독립

##### 10. 인수 조건

```gherkin
Given 현재 표시 월이 2026년 5월인 상태
When 사용자가 [다음 달 ▶] 버튼을 클릭하면
Then 표시 월이 2026년 6월로 변경되어야 한다
And 6월 캘린더가 렌더링되어야 한다
And 정산표가 6월 기준으로 갱신되어야 한다

Given 표시 월이 오늘 기준 11개월 후 (예: 2027년 4월)
When 사용자가 [다음 달 ▶] 버튼을 한 번 더 누르면
Then 표시 월이 2027년 5월로 이동해야 한다
And [다음 달 ▶] 버튼이 비활성화되어야 한다 (12개월 도달)

Given 표시 월이 12개월 후로 이동된 상태
When 사용자가 [◀ 이전 달] 버튼을 누르면
Then [다음 달 ▶] 버튼이 다시 활성화되어야 한다

Given 5월 캘린더에 임시 항목이 있는 상태
When 사용자가 6월로 이동 후 다시 5월로 돌아오면
Then 5월의 임시 항목이 그대로 표시되어야 한다
```

##### 11. 테스트 케이스

| ID | 시나리오 | 예상 |
|---|---|---|
| TC-F1-7-001 | 다음 달 이동 | 월+1, 캘린더 갱신 |
| TC-F1-7-002 | 이전 달 이동 | 월-1 |
| TC-F1-7-003 | 12월에서 다음 달 | 다음 해 1월 |
| TC-F1-7-004 | 1월에서 이전 달 | 작년 12월 |
| TC-F1-7-005 | 오늘 +12개월 도달 | [다음] 비활성 |
| TC-F1-7-006 | 미래 달에 임시 항목 추가 | 정상 저장 |
| TC-F1-7-007 | 과거 달 (데이터 없음) | 빈 캘린더 |
| TC-F1-7-008 | 5월 ↔ 6월 왕복 | 각 달 데이터 보존 |
| TC-F1-7-009 | 월 선택 드롭다운 | ±12개월 표시 |
| TC-F1-7-010 | 키보드 ← → | 월 이동 |
| TC-F1-7-011 | 모바일 좌우 스와이프 | 월 이동 (선택) |
| TC-F1-7-012 | 새로고침 후 마지막 본 달 | meta_v1.current_view_month로 복원 |

---

#### 🎯 F1-8. 로컬스토리지 저장

##### 1. 사용자 스토리

> **As** 자녀
> **I want** 입력한 데이터가 자동으로 브라우저에 저장되어
> **So that** 다시 페이지 열어도 데이터가 그대로 있다

##### 2. 사전·사후 조건

| 구분 | 조건 |
|---|---|
| **사전 조건** | 1. 브라우저가 로컬스토리지 지원 (현대 브라우저 모두 지원) |
| **사후 조건** | 1. 변경된 데이터가 로컬스토리지에 저장됨<br>2. 페이지 재진입 시 데이터 복원됨 |

##### 3. 정상 흐름 — 자동 저장

```
1. 사용자가 임의의 입력 (설정 변경, 임시 항목 추가 등)
2. 시스템: 변경 감지 → localStorage.setItem 호출
3. 시스템: try/catch로 에러 처리
4. 시스템: 성공 시 (사용자 인지 없이) 즉시 반영
5. 페이지 새로고침 시: 자동 복원
```

##### 4. 대체 흐름

###### 4.1 페이지 로드 시 데이터 복원
```
1. 페이지 진입
2. 시스템: localStorage에서 모든 키 읽기
   - settings_v1
   - calendar_v1_*
   - custom_categories_v1
   - meta_v1
3. 각 데이터 검증 (스키마 일치)
4. 검증 통과 시 메모리에 로드
5. 검증 실패 시 폴백 처리 (8.5.F1-8.5)
```

##### 5. 예외 흐름

###### 5.1 로컬스토리지 용량 부족 (QuotaExceededError)
- 시스템: 에러 캐치
- 모달 표시: "저장 공간이 부족합니다. 오래된 달의 데이터를 정리하시겠습니까?"
- [정리하기] / [취소]
- [정리하기] 클릭 시: 오래된 calendar_v1_YYYY_MM부터 삭제 (최근 6개월만 유지)

###### 5.2 로컬스토리지 비활성 (사파리 시크릿 모드 등)
- 시스템: 시작 시 검사
- 안내 모달: "이 브라우저는 데이터 저장이 비활성화되어 있습니다. 설정을 변경해주세요."
- 일반 사용 차단

###### 5.3 settings_v1 손상 (JSON 파싱 실패)
- 시스템: 손상된 키 백업 (settings_v1_corrupted_TIMESTAMP)
- 환영 모달 강제 표시 (재설정)
- 사용자에게 안내

###### 5.4 calendar_v1 손상
- 해당 월만 빈 객체로 폴백
- 다른 월 데이터는 유지
- 사용자에게 알림 (간단한 토스트)

###### 5.5 version 불일치
- 시스템: 마이그레이션 함수 실행 (1단계는 v1뿐이라 실제 동작 X)
- 향후 v2 도입 시 자동 변환

##### 6. 입력 검증 규칙

저장 시 항상 다음 검증:
- JSON.stringify 실패 시 저장 안 함
- 키 이름 형식 검증

##### 7. UI 컴포넌트 구조

이 기능은 백그라운드 동작 (UI 없음).

단, 다음 시나리오에서는 UI 표시:
- 용량 부족 모달
- 손상 시 안내 모달

##### 8. 데이터 처리

###### 8.1 storage.js 추상화 레이어

```typescript
// utils/storage.js

const KEYS = {
  SETTINGS: "settings_v1",
  CALENDAR: (year, month) => `calendar_v1_${year}_${pad(month)}`,
  CUSTOM_CATEGORIES: "custom_categories_v1",
  META: "meta_v1"
};

// 일반 set/get 추상화
function set(key: string, value: any): Result {
  try {
    const json = JSON.stringify(value);
    localStorage.setItem(key, json);
    return { success: true };
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      return { success: false, error: "QUOTA_EXCEEDED" };
    }
    return { success: false, error: "WRITE_ERROR", details: e };
  }
}

function get<T>(key: string, defaultValue?: T): T | null {
  try {
    const json = localStorage.getItem(key);
    if (json === null) return defaultValue ?? null;

    const value = JSON.parse(json);

    // 버전 검사
    if (value && typeof value === "object" && "version" in value) {
      if (value.version !== 1) {
        // 마이그레이션 (v1 only for now)
        return migrateData(value);
      }
    }

    return value;
  } catch (e) {
    console.error(`Failed to read key: ${key}`, e);
    // 손상 백업
    backupCorrupted(key);
    return defaultValue ?? null;
  }
}

function backupCorrupted(key: string): void {
  const value = localStorage.getItem(key);
  if (!value) return;
  const backupKey = `${key}_corrupted_${Date.now()}`;
  localStorage.setItem(backupKey, value);
  localStorage.removeItem(key);
}

// 도메인별 헬퍼
export function loadSettings(): Settings_v1 | null {
  return get<Settings_v1>(KEYS.SETTINGS);
}

export function saveSettings(settings: Settings_v1): Result {
  settings.updated_at = new Date().toISOString();
  return set(KEYS.SETTINGS, settings);
}

export function loadCalendarMonth(year: number, month: number): CalendarMonth_v1 {
  const key = KEYS.CALENDAR(year, month);
  return get<CalendarMonth_v1>(key, {
    year,
    month,
    cells: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  });
}

export function saveCalendarMonth(calendar: CalendarMonth_v1): Result {
  const key = KEYS.CALENDAR(calendar.year, calendar.month);
  calendar.updated_at = new Date().toISOString();
  return set(key, calendar);
}

// 정리 (용량 부족 시)
export function cleanupOldCalendars(keepRecent: number = 6): number {
  const allKeys = Object.keys(localStorage);
  const calendarKeys = allKeys
    .filter(k => k.startsWith("calendar_v1_"))
    .sort()
    .reverse();

  const toDelete = calendarKeys.slice(keepRecent);
  toDelete.forEach(k => localStorage.removeItem(k));
  return toDelete.length;
}

// 디버그 / 데이터 export
export function exportAllData(): object {
  const result: any = {};
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("settings_v1") ||
        key.startsWith("calendar_v1_") ||
        key.startsWith("custom_categories_v1") ||
        key.startsWith("meta_v1")) {
      try {
        result[key] = JSON.parse(localStorage.getItem(key)!);
      } catch (e) {
        result[key] = `<corrupted: ${e.message}>`;
      }
    }
  });
  return result;
}
```

##### 9. 비즈니스 로직

###### 9.1 저장 전략

- **즉시 저장 (Eager)**: 사용자 액션 직후 저장
- **지연 저장 (Lazy)**: 1단계는 사용 안 함 (데이터 양 적음)
- **트랜잭션**: 단일 키 단위 (멀티 키 동시 저장 시 부분 실패 가능)

###### 9.2 데이터 호환성

- 모든 키에 `version` 필드 → 미래 v2 마이그레이션 대비
- 1단계는 v1만, 마이그레이션 코드는 미작성

###### 9.3 백업 정책

1단계는 자동 백업 없음.
- 사용자가 [데이터 내보내기] 버튼으로 수동 백업 (선택 기능)
- 4단계에서 클라우드 자동 백업

###### 9.4 데이터 삭제 정책

1단계는 자동 삭제 없음. 사용자가 명시적으로 삭제 요청 시:
- "모든 데이터 삭제" 메뉴 → 확인 후 localStorage.clear()

##### 10. 인수 조건

```gherkin
Given 사용자가 자녀 기본 설정을 입력하고 [저장] 클릭한 후
When 페이지를 새로고침하면
Then 환영 모달이 표시되지 않아야 한다
And 캘린더 화면이 즉시 표시되어야 한다
And 입력했던 설정값이 그대로 유지되어야 한다

Given 5월 캘린더에 임시 항목 3개를 추가한 후
When 페이지를 새로고침하면
Then 5월 캘린더에 임시 항목 3개가 모두 표시되어야 한다
And 정산표 합계도 동일해야 한다

Given 로컬스토리지가 가득 찬 상태
When 사용자가 새로운 임시 항목을 추가하면
Then "저장 공간이 부족합니다" 모달이 표시되어야 한다
And [정리하기] 버튼이 표시되어야 한다
And [정리하기] 클릭 시 오래된 달 데이터가 정리되어야 한다

Given settings_v1이 잘못된 JSON으로 손상된 상태
When 페이지에 진입하면
Then 손상된 데이터가 백업되어야 한다 (settings_v1_corrupted_TIMESTAMP)
And 환영 모달이 강제 표시되어야 한다
```

##### 11. 테스트 케이스

| ID | 시나리오 | 예상 |
|---|---|---|
| TC-F1-8-001 | 정상 저장 후 새로고침 | 데이터 유지 |
| TC-F1-8-002 | 다른 탭에서 같은 페이지 | 동일 데이터 (브라우저별) |
| TC-F1-8-003 | 시크릿 모드 (Safari) | 차단 안내 |
| TC-F1-8-004 | 시크릿 모드 (Chrome) | 정상 동작 (세션 한정) |
| TC-F1-8-005 | localStorage 가득 참 | 정리 모달 |
| TC-F1-8-006 | settings 손상 | 백업 + 재설정 |
| TC-F1-8-007 | calendar 1개 손상 | 해당 월만 폴백 |
| TC-F1-8-008 | 모든 데이터 삭제 | 환영 모달 |
| TC-F1-8-009 | 12개월치 누적 | 약 25KB |
| TC-F1-8-010 | 동시 저장 (이론상) | 마지막 쓰기 우선 |

---

#### 🎯 F1-9. 설정 변경

##### 1. 사용자 스토리

> **As** 자녀
> **I want** 학기 변경 시 학교/학원 요일이나 단가를 다시 설정할 수 있어
> **So that** 매 학기마다 정확한 청구액이 계산된다

##### 2. 사전·사후 조건

| 구분 | 조건 |
|---|---|
| **사전 조건** | 1. settings_v1이 이미 저장됨 (첫 사용 후) |
| **사후 조건** | 1. 변경된 설정이 저장됨<br>2. 현재 표시 중인 달이 새 설정으로 재계산됨 |

##### 3. 정상 흐름

```
1. 사용자가 [⚙ 설정] 버튼 클릭
2. 시스템: 설정 모달 표시
   - F1-1과 동일한 폼
   - 기존 값 prefilled
   - 닫기 버튼 활성 (X)
3. 사용자: 원하는 항목 수정
4. 사용자: [저장] 클릭
5. 시스템: 검증 (F1-1과 동일)
6. 시스템: settings_v1 갱신
   - updated_at = now()
7. 시스템: 모달 닫기
8. 시스템: 현재 표시 월 재계산 + 캘린더 재렌더링
```

##### 4. 대체 흐름

###### 4.1 변경 안 하고 닫기
- [취소] 버튼 또는 X 버튼
- 변경 사항 없으면 그냥 닫기

###### 4.2 변경 후 [취소] 클릭
- 확인 모달: "변경 사항이 있습니다. 저장하지 않고 닫을까요?"
- [닫기] / [계속 편집]

###### 4.3 학교 학원 요일 변경
- 캘린더의 해당 요일 셀이 변경됨
- 즉시 갱신

###### 4.4 단가 변경
- 모든 셀의 학교/학원 금액 재계산
- 정산표 갱신

##### 5. 예외 흐름

###### 5.1 검증 실패
- F1-1과 동일

###### 5.2 저장 실패
- F1-1과 동일

##### 6. 입력 검증 규칙

F1-1과 동일.

##### 7. UI 컴포넌트 구조

```jsx
<SettingsModal
  isOpen={showSettings}
  closable={true}  // F1-1과 차이: 닫기 가능
  initialValues={loadSettings()}
  onSave={handleSave}
  onCancel={handleCancel}
>
  {/* F1-1과 동일한 폼 */}
</SettingsModal>
```

##### 8. 데이터 처리

```typescript
async function updateSettings(input: SettingsInput): Promise<Result> {
  // 1. 검증
  const validation = validateSettings(input);
  if (!validation.valid) return { success: false, errors: validation.errors };

  // 2. 기존 설정 로드
  const oldSettings = loadSettings();
  if (!oldSettings) return { success: false, error: "NO_EXISTING_SETTINGS" };

  // 3. 새 설정 객체 생성
  const newSettings: Settings_v1 = {
    ...oldSettings,
    ...input,
    updated_at: new Date().toISOString()
  };

  // 4. 저장
  return saveSettings(newSettings);
}
```

##### 9. 비즈니스 로직

###### 9.1 변경 영향 정책

설정 변경 시:
- **현재 월부터 적용** (당장의 캘린더 갱신)
- **과거 월은 영향 없음** (이미 본 데이터 유지)
- **단, 1단계는 과거 월의 캘린더 데이터를 보관 안 함** (cells만 보관)
- 그래서 과거 월로 이동 시 새 설정으로 재계산됨 (의도된 동작)

##### 9.2 학기 변경 시나리오

| 변경 시점 | 변경 내용 | 영향 |
|---|---|---|
| 3월 | 학교 요일 변경 (예: 시간표 변경) | 3월부터 캘린더 자동 갱신 |
| 3월 | 학원 시작 (월~금) | 3월부터 학원 표시 |
| 8월 | 학원 종료 (방학) | 8월부터 학원 안 표시 |
| 10월 | 단가 인상 (1,160 → 1,200) | 10월부터 단가 적용 |

##### 10. 인수 조건

```gherkin
Given 학교 등교 요일이 월~금으로 설정된 상태
When 사용자가 [⚙ 설정] 버튼 클릭 후
   학교 등교 요일을 월,수,금으로 변경하고 [저장] 클릭하면
Then settings_v1의 school.days가 ["mon","wed","fri"]로 갱신되어야 한다
And 현재 캘린더의 화/목 셀에서 🏫 아이콘이 사라져야 한다
And 정산표의 학교 일수가 갱신되어야 한다

Given 학교 단가가 1,160원으로 설정된 상태
When 사용자가 단가를 1,200원으로 변경 후 [저장] 클릭하면
Then 모든 학교 셀의 금액이 1,200×2=2,400원으로 갱신되어야 한다
And 정산표 합계가 갱신되어야 한다

Given 설정 변경 후 [취소] 클릭 시 (변경 사항 있음)
When 확인 모달이 표시되면
Then "저장하지 않고 닫을까요?" 메시지가 표시되어야 한다
And [닫기] 클릭 시 변경 사항 폐기되어야 한다
And [계속 편집] 클릭 시 모달 유지되어야 한다
```

##### 11. 테스트 케이스

| ID | 시나리오 | 예상 |
|---|---|---|
| TC-F1-9-001 | 학교 요일 변경 | 캘린더 즉시 갱신 |
| TC-F1-9-002 | 학교 단가 변경 | 모든 학교 셀 갱신 |
| TC-F1-9-003 | 학원 추가 (없던 학원) | 캘린더에 학원 표시 |
| TC-F1-9-004 | 학원 삭제 | 학원 표시 사라짐 |
| TC-F1-9-005 | 기본 용돈 변경 | 정산표 갱신 |
| TC-F1-9-006 | 자녀 이름 변경 | 메시지에 반영 |
| TC-F1-9-007 | 변경 안 하고 닫기 | 그냥 닫힘 |
| TC-F1-9-008 | 변경 후 [취소] | 확인 모달 |
| TC-F1-9-009 | 변경 후 X 버튼 | 확인 모달 |
| TC-F1-9-010 | 검증 실패 후 [취소] | 변경 사항 폐기 |

---
### 8.6 1단계 UI 정책

#### 8.6.1 반응형 디자인

##### 분기점

| 디바이스 | 최소 폭 | 최대 폭 | 레이아웃 |
|---|---|---|---|
| 모바일 | 320px | 767px | 세로 스택, 폰트 작게 |
| 태블릿 | 768px | 1023px | 캘린더 큰 셀 |
| 데스크톱 | 1024px | ∞ | 좌측 캘린더 + 우측 사이드바 (선택) |

##### 모바일 최적화

- 캘린더 셀 높이: 60px (터치 가능)
- 폰트 크기: 본문 14px, 셀 숫자 12px
- 버튼 최소 크기: 44 × 44px (Apple HIG 기준)
- 마진: 8~16px

##### 데스크톱 최적화

- 캘린더 셀 높이: 80~100px (정보 더 많이)
- 폰트 크기: 본문 16px
- 마우스 호버 효과 (셀 강조)

#### 8.6.2 디자인 시스템

##### 색상 팔레트

```css
:root {
  /* 기본 */
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F5F5;
  --color-bg-card: #FFFFFF;

  /* 텍스트 */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-text-tertiary: #999999;

  /* 강조 */
  --color-primary: #1565C0;       /* 파란색 (도서관플러스 컬러) */
  --color-primary-hover: #0D47A1;
  --color-secondary: #FFA726;     /* 오렌지 (포인트) */

  /* 의미 */
  --color-success: #43A047;
  --color-warning: #FFA726;
  --color-error: #C0392B;
  --color-info: #1976D2;

  /* 캘린더 */
  --color-holiday: #C0392B;
  --color-school-icon: #1976D2;
  --color-academy-icon: #FFA726;
  --color-extra-icon: #43A047;

  /* 보더 */
  --color-border: #E0E0E0;
  --color-border-strong: #BDBDBD;

  /* 그림자 */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

##### 폰트

```css
:root {
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
}
```

##### 간격 (Spacing)

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

##### 모서리 둥글기

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

#### 8.6.3 컴포넌트 라이브러리

##### Button

```jsx
<Button
  variant="primary | secondary | outlined | text"
  size="sm | md | lg"
  disabled={boolean}
  onClick={handler}
>
  Label
</Button>
```

##### Input

```jsx
<Input
  type="text | number | tel | email"
  label="Label"
  value={value}
  onChange={handler}
  error="에러 메시지"
  placeholder="플레이스홀더"
  maxLength={number}
/>
```

##### CurrencyInput (커스텀)

- 천 단위 콤마 자동
- 숫자만 입력
- 정수만

##### Modal

```jsx
<Modal
  isOpen={boolean}
  closable={boolean}
  onClose={handler}
  title="제목"
  size="sm | md | lg"
>
  <Modal.Body>...</Modal.Body>
  <Modal.Footer>...</Modal.Footer>
</Modal>
```

##### Toast

```jsx
<Toast
  isOpen={boolean}
  message="메시지"
  type="success | error | info | warning"
  duration={3000}
/>
```

#### 8.6.4 접근성 (Accessibility)

##### WCAG 2.1 Level A 준수 (1단계 최소 기준)

- 시맨틱 HTML (`<button>`, `<nav>`, `<main>` 등)
- alt 텍스트 (이미지에)
- aria-label (아이콘 버튼에)
- 키보드 네비게이션 (Tab 가능)
- 포커스 표시 (outline)
- 색상 대비 4.5:1 이상

##### 키보드 단축키

| 키 | 동작 |
|---|---|
| Tab | 다음 요소로 포커스 |
| Shift+Tab | 이전 요소로 포커스 |
| Enter | 버튼 클릭, 모달 저장 |
| ESC | 모달 닫기, 드로어 닫기 |
| ← → | 월 이동 (입력 필드 외) |

##### 스크린 리더

- 정산표 합계는 "총 합계 142,640원"으로 읽힘
- 캘린더 셀은 "5월 14일 수요일, 학교 등교 2,320원, 학원 등원 2,320원, 합계 4,640원"

#### 8.6.5 다크 모드

1단계: 미지원 (보류, 4단계 이후)
- 단, CSS 변수 구조는 다크 모드 대비 (--color-* 변수 사용)
- 향후 `[data-theme="dark"]` 추가만으로 전환 가능

#### 8.6.6 다국어

1단계: 한국어 한정
- 단, i18n 라이브러리 도입 가능 구조
- 텍스트는 코드에 직접 작성, 향후 분리 가능

---

### 8.7 1단계 에러 처리 매트릭스

#### 8.7.1 에러 분류

| 카테고리 | 예시 | 처리 |
|---|---|---|
| **검증 에러** | 입력값 형식 오류 | 인라인 메시지 |
| **저장 에러** | 로컬스토리지 가득 참 | 모달 + 정리 옵션 |
| **로드 에러** | JSON 파싱 실패 | 폴백 + 백업 |
| **권한 에러** | 클립보드 거부 | 폴백 모달 |
| **호환성 에러** | 시크릿 모드 등 | 안내 모달 |

#### 8.7.2 에러 메시지 표준

##### 인라인 (필드별)
- 위치: 입력 필드 바로 아래
- 색상: var(--color-error)
- 폰트 크기: 12px
- 형식: "[원인]을 입력해주세요" / "[제약]을 지켜주세요"

##### 모달 (시스템 에러)
- 제목: "오류가 발생했습니다"
- 본문: 친근한 한국어 설명
- 버튼: [다시 시도] / [닫기]
- 추가 정보: 콘솔 로그 (개발자용)

##### 토스트 (가벼운 알림)
- 위치: 화면 상단 또는 하단
- 지속: 3초
- 색상: 종류별 (success/error/info/warning)

#### 8.7.3 에러 발생 시 사용자 액션

| 에러 종류 | 사용자가 할 수 있는 액션 |
|---|---|
| 검증 실패 | 입력값 수정 |
| 스토리지 가득 | 오래된 달 정리 |
| JSON 손상 | 재설정 (자동 안내) |
| 클립보드 거부 | 폴백 모달에서 수동 복사 |
| 시크릿 모드 | 일반 브라우저로 변경 |

#### 8.7.4 에러 코드 표준

```typescript
enum ErrorCode {
  // 검증
  VALIDATION_REQUIRED = "VALIDATION_REQUIRED",
  VALIDATION_TOO_LONG = "VALIDATION_TOO_LONG",
  VALIDATION_INVALID_FORMAT = "VALIDATION_INVALID_FORMAT",
  VALIDATION_OUT_OF_RANGE = "VALIDATION_OUT_OF_RANGE",

  // 스토리지
  STORAGE_QUOTA_EXCEEDED = "STORAGE_QUOTA_EXCEEDED",
  STORAGE_DISABLED = "STORAGE_DISABLED",
  STORAGE_PARSE_ERROR = "STORAGE_PARSE_ERROR",
  STORAGE_WRITE_ERROR = "STORAGE_WRITE_ERROR",

  // 한도
  MAX_EXTRA_ITEMS_REACHED = "MAX_EXTRA_ITEMS_REACHED",
  MAX_MEMO_LENGTH = "MAX_MEMO_LENGTH",
  MAX_FUTURE_MONTHS = "MAX_FUTURE_MONTHS",

  // 클립보드
  CLIPBOARD_DENIED = "CLIPBOARD_DENIED",
  CLIPBOARD_UNSUPPORTED = "CLIPBOARD_UNSUPPORTED",

  // 데이터
  DATA_CORRUPTED = "DATA_CORRUPTED",
  EMPTY_TOTAL = "EMPTY_TOTAL"
}
```

---

### 8.8 1단계 QA 시나리오

#### 8.8.1 사용자 여정 기반 QA

##### 여정 1: 첫 사용자 (신규)

```
1. 브라우저에서 URL 첫 접속
   → 환영 모달 자동 표시
2. 자녀 정보 입력
   → 학교 월~금, 1160, 왕복, 기본 80000
3. [저장하고 시작하기]
   → 캘린더 화면 진입
4. 5월 캘린더 확인
   → 평일 셀에 🏫 + 2,320원 표시
   → 정산표에 학교 일수 표시
5. 5/14 셀 클릭 (체험학습 등록)
   → 셀 편집 모달
6. 임시 항목 추가: 체험학습 8,000원
   → [저장]
7. 캘린더 5/14 셀에 🎒 아이콘 + 합계 갱신
8. 정산표에 체험학습 행 추가
9. [📋 메시지 복사] 클릭
   → 토스트 "복사되었습니다"
10. 카톡 열고 붙여넣기
    → 메시지 정상 표시
11. 부모님께 송신
12. 페이지 닫기
```

##### 여정 2: 학기 변경

```
1. 학기 변경 (3월 새 시간표)
2. [⚙ 설정] 클릭
3. 학교 요일 변경: 월수금 → 화목
4. [저장]
5. 3월 캘린더 갱신: 화/목에 🏫, 월/수/금에 X
6. 정산표 학교 일수 변경
```

##### 여정 3: 미래 달 미리 등록

```
1. 4월 → 5월로 이동 ([다음 달 ▶])
2. 5월 캘린더 표시 (임시 항목 없음)
3. 5/19 셀 클릭 (수련회 등록)
4. 임시 항목: 수련회 회비 50,000원
5. [저장]
6. 5월 정산표에 수련회 항목 추가
7. 4월로 다시 이동 ([◀ 이전 달])
8. 4월 데이터 그대로 유지
9. 5월로 다시 이동
10. 5/19 임시 항목 그대로 유지
```

##### 여정 4: 데이터 정리 (스토리지 가득)

```
1. 12개월치 데이터 누적된 상태
2. 추가 입력 시도
3. "저장 공간 부족" 모달
4. [정리하기] 클릭
5. 6개월 이상 된 calendar_v1_* 삭제
6. 입력 다시 시도 → 성공
```

##### 여정 5: 손상 데이터 복구

```
1. 외부 도구로 settings_v1 임의 수정 (잘못된 JSON)
2. 페이지 새로고침
3. 시스템: 손상 감지 → 백업 (settings_v1_corrupted_TIMESTAMP)
4. 환영 모달 강제 표시
5. 사용자: 다시 입력
6. [저장] → 정상 동작
```

#### 8.8.2 디바이스/브라우저 매트릭스

| 디바이스 | OS | 브라우저 | 우선순위 |
|---|---|---|---|
| iPhone 13+ | iOS 16+ | Safari | High |
| iPhone | iOS 16+ | Chrome | Medium |
| Galaxy S22+ | Android 12+ | Chrome | High |
| Galaxy | Android | Samsung Internet | Medium |
| MacBook | macOS | Safari 16+ | High |
| MacBook | macOS | Chrome | High |
| Windows 11 | - | Edge | High |
| Windows | - | Chrome | High |
| Windows | - | Firefox | Low |

#### 8.8.3 성능 QA

| 항목 | 측정 방법 | 목표 |
|---|---|---|
| 첫 로드 시간 | Lighthouse | FCP < 2초 |
| 캘린더 렌더링 | Performance API | < 100ms |
| 임시 항목 추가 | 타이밍 측정 | < 50ms |
| 메시지 복사 | 타이밍 측정 | < 200ms |
| 월 이동 | 타이밍 측정 | < 100ms |

---

### 8.9 1단계 운영 정책

#### 8.9.1 배포 전략

##### 배포 옵션 비교

| 옵션 | 장점 | 단점 | 1단계 권고 |
|---|---|---|---|
| **A. 단일 HTML 파일** | 다운로드 후 오프라인 사용, 가장 가벼움 | 업데이트 시 다시 받아야 함 | ⭐ |
| **B. GitHub Pages** | 자동 호스팅, 업데이트 즉시 반영 | 인터넷 필요 | ⭐ |
| **C. 둘 다 제공** | 사용자 선택 | 약간의 빌드 복잡 | 권고 |

##### 권고 배포 방식

1. **메인**: GitHub Pages (https://hex.github.io/allowance-mvp)
2. **백업**: 단일 HTML 다운로드 링크 (오프라인용)

##### 배포 절차

```
1. 개발 → 로컬 테스트
2. main 브랜치에 push
3. GitHub Actions가 빌드 (Vite)
4. gh-pages 브랜치에 자동 배포
5. URL 자동 갱신 (5분 내)
6. 단일 HTML 파일도 빌드 → Releases에 첨부
```

#### 8.9.2 모니터링

1단계는 본인 사용이라 외부 모니터링 불필요. 다음만 확인:
- 본인 사용 시 발견하는 버그 (직접 기록)
- 주간 회고 (1회/주, 사용 경험 기록)

#### 8.9.3 버전 관리

##### Semantic Versioning

```
v1.0.0 - 1단계 초기 출시
v1.0.1 - 버그 수정
v1.1.0 - 기능 추가 (소규모)
v2.0.0 - 2단계 마이그레이션 (큰 변화)
```

##### 변경 이력 관리

`CHANGELOG.md` 파일:
```markdown
# v1.0.0 (2026-05-15)
- 1단계 MVP 출시
- 캘린더 자동 산정
- 메시지 자동 생성
- 로컬 저장

# v1.0.1 (2026-05-22)
- 임시 항목 카테고리 표시 버그 수정
- 모바일 셀 터치 영역 개선
```

#### 8.9.4 사용자 피드백 (1단계)

1단계는 본인 사용이라 공식 피드백 채널 없음.
- 본인 사용 메모는 별도 문서 (notes.md)
- 2단계 출시 전에 모든 피드백 정리

---

### 8.10 1단계 출시 체크리스트

#### 8.10.1 개발 완료 체크

##### 기능 완성도
- [ ] F1-1. 자녀 기본 설정 (모든 인수 조건 통과)
- [ ] F1-2. 캘린더 셀 자동 표시
- [ ] F1-3. 정산표 + 합계
- [ ] F1-4. 비고 버튼
- [ ] F1-5. 임시 항목 + 메모
- [ ] F1-6. 메시지 자동 생성
- [ ] F1-7. 미래 달 미리 생성
- [ ] F1-8. 로컬스토리지 저장
- [ ] F1-9. 설정 변경

##### 데이터 모델
- [ ] settings_v1 스키마 정확
- [ ] calendar_v1_YYYY_MM 스키마 정확
- [ ] custom_categories_v1 스키마 정확
- [ ] meta_v1 스키마 정확
- [ ] holidays.json 데이터 (2026~2030)

##### 코드 품질
- [ ] 모든 파일에 ESLint 통과
- [ ] 주요 함수에 JSDoc 작성
- [ ] TypeScript 사용 시 타입 체크 통과 (선택)
- [ ] 콘솔 에러 0건
- [ ] 콘솔 경고 0건 (개발 모드 제외)

#### 8.10.2 테스트 완료 체크

##### 단위 테스트 (선택, 1단계는 강제 X)
- [ ] calculator.js 테스트
- [ ] storage.js 테스트
- [ ] messageTemplate.js 테스트

##### E2E 테스트 (수동)
- [ ] 여정 1 (첫 사용자) 통과
- [ ] 여정 2 (학기 변경) 통과
- [ ] 여정 3 (미래 달) 통과
- [ ] 여정 4 (데이터 정리) 통과
- [ ] 여정 5 (손상 복구) 통과

##### 디바이스 테스트
- [ ] iPhone Safari 동작
- [ ] Galaxy Chrome 동작
- [ ] MacBook Safari 동작
- [ ] Windows Chrome 동작
- [ ] Windows Edge 동작

##### 성능 테스트
- [ ] Lighthouse 점수 90+ (Performance)
- [ ] 첫 로드 < 2초
- [ ] 캘린더 렌더링 < 100ms

#### 8.10.3 배포 준비 체크

##### 빌드
- [ ] Production 빌드 성공
- [ ] 빌드 산출물 크기 < 500KB
- [ ] 단일 HTML 파일 빌드 가능

##### 호스팅
- [ ] GitHub Pages 설정
- [ ] 도메인 연결 (선택)
- [ ] HTTPS 동작
- [ ] SEO 메타 태그 (선택)

##### 문서
- [ ] README.md 작성
- [ ] CHANGELOG.md 작성
- [ ] LICENSE 파일 (MIT 권고)

#### 8.10.4 출시 후 30일 체크

##### 사용 빈도
- [ ] 매일 1회 이상 사용
- [ ] 매월 청구 작성에 실제로 사용됨
- [ ] 부모님이 메시지 받고 의미 이해

##### 버그 수집
- [ ] 발견된 버그 목록 작성
- [ ] 우선순위 분류 (Critical / Major / Minor)
- [ ] 수정 또는 보류 결정

##### 2단계 결정
- [ ] 2단계로 가야 할지 판단
- [ ] 빠진 기능 / 불편한 기능 정리
- [ ] 2단계 PRD 작성 시작

---

### 8.11 1단계 → 2단계 마이그레이션 사전 설계

#### 8.11.1 마이그레이션 전제

1단계 데이터 구조는 2단계 DB 스키마로 1:1 매핑 가능하도록 설계됨.

#### 8.11.2 데이터 매핑

| 1단계 키 | 2단계 DB 테이블 | 매핑 |
|---|---|---|
| `settings_v1` | `child_settings` | 1:1 (자녀 ID 신규 발급) |
| `calendar_v1_YYYY_MM.cells.{date}.extra_items` | `extra_items` | 1:N (date, child_id 추가) |
| `calendar_v1_YYYY_MM.cells.{date}.memo` | `memos` | 1:1 |
| `custom_categories_v1.categories` | `custom_categories` | N:N (family_id 추가) |
| `meta_v1` | (사용 안 함) | 메타 정보는 신규 |

#### 8.11.3 마이그레이션 흐름

```
[2단계 첫 진입]
1. 시스템: localStorage 검사
   - settings_v1 존재? → 마이그레이션 가능 안내
2. 사용자: "기존 데이터 가져오기" 동의
3. 시스템: 가족 만들기 (가족 코드 자동 생성)
4. 시스템: 본인을 자녀(또는 부모)로 등록
5. 시스템: 1단계 데이터 → 2단계 API 전송
   POST /api/migrations/from-local
   Body: {
     settings: {...},
     calendars: {
       "2026_05": {...},
       "2026_06": {...}
     },
     custom_categories: [...]
   }
6. 서버: 데이터 삽입 + 검증
7. 응답: 마이그레이션 성공
8. 시스템: 1단계 localStorage는 90일간 보존 (안전망)
9. 90일 후 자동 정리 (사용자 안내 후)
```

#### 8.11.4 데이터 무결성 검증

마이그레이션 후 다음을 비교 검증:
- 임시 항목 개수 일치
- 합계 금액 일치 (각 월별)
- 카테고리 목록 일치

불일치 시 사용자에게 안내 + 재시도 옵션

#### 8.11.5 마이그레이션 실패 처리

- 1단계 데이터는 그대로 유지 (삭제 X)
- 사용자가 2단계 사용 거부 시 1단계로 복귀 가능
- 2단계 사용자는 1단계 시스템으로 돌아갈 수 없음 (단방향)

---
## 9. 2단계 상세 명세 (Growth)

### 9.1 2단계 개요

#### 컨셉
**"자녀가 청구하면 부모가 같은 화면에서 검토·승인하고 지급 표시. 카톡 외부 송신 없이 시스템 안에서 완결"**

#### 사용자
- 가족 1팀 (자녀 1~2명 + 부모 1~2명)
- 회원가입 없음 (가족 코드로 접근)

#### 핵심 가치
**"카톡 대신 시스템 안에서 청구·검토·지급 흐름 완결, 변동 사항 자동 처리"**

#### 시스템 특성
- 백엔드 도입 (클라우드 DB)
- 가족 단위 데이터 공유
- 회원가입 아직 없음 ("가족 코드"로 접근)
- 다중 기기 지원
- 계정 보안 약함 (코드만 알면 접근, 가족용이라 OK)

#### 인증 방식 (2단계 한정)
```
1. 첫 사용자: "가족 만들기" → 가족 코드 자동 생성 (예: MYFAM-A3F9K2)
2. 다른 가족 구성원: 코드 입력으로 접근
3. 본인 역할(부모/자녀) 선택
4. 비밀번호·이메일 없음
```

#### 배포
- 웹 호스팅 + 백엔드 서버
- 가족 코드만 알면 어디서든 접속

---

### 9.2 2단계 추가 기능 명세

> 1단계 9개 기능은 모두 유지됨. 다음은 **추가되는 14개 기능**.

#### F2-1. 자녀 청구 작성 + 송신

**설명:** 자녀가 캘린더 화면에서 청구 내역을 확인하고 [청구하기] 버튼으로 부모에게 송신.

**입력 항목:**
| 항목 | 타입 | 필수 | 비고 |
|---|---|---|---|
| 청구 대상 월 | 자동 | 필수 | 현재 표시 중인 월 |
| 청구 메모 | 텍스트 | 선택 | F2-13 참조, 500자 |
| 임시 항목 (선택) | 자동 | - | F1-5에서 입력한 것 |
| 추가 용돈 (선택) | 자동 | - | F2-6에서 등록한 것 |

**송신 직전 자동 검증:**
- 합계 금액이 0원 이하인 경우 차단
- 청구 메모에 금지어 필터링 없음 (가족 간 자유)
- 같은 달 미해결 청구가 있는지 확인 → 있으면 경고 ("이미 5월 청구가 진행 중입니다")

**송신 후:**
- 청구 상태: `DRAFT` → `SUBMITTED`
- 부모 모두에게 알림 발송 (F2-11)
- 자녀 화면: "청구 송신 완료, 부모님 검토 대기 중" 표시

**UI 위치:** 화면 하단 정산표 아래 [청구하기] 버튼

#### F2-2. 부모 청구 검토 (승인 / 거절)

**설명:** 부모가 자녀 청구를 받아 검토 후 승인하거나 거절.

**부모 청구함 화면:**
```
┌─ 청구함 ──────────────────────────┐
│                                    │
│ 🆕 자녀A의 5월 청구  142,640원      │
│    송신: 2026-04-30 14:23          │
│    상태: 검토 대기                  │
│    [열어 보기 ▶]                   │
│                                    │
│ ✅ 자녀B의 4월 청구  98,560원       │
│    완료: 2026-04-02                 │
│    [이력 보기]                     │
│                                    │
└────────────────────────────────────┘
```

**검토 화면:**
- 자녀가 보낸 캘린더 그대로 표시 (읽기 전용)
- 정산표 표시
- 청구 메모 표시
- 임시 항목 표시
- 영수증 첨부 표시 (4단계부터)

**부모 액션:**
- [✅ 승인] : 청구 → 지급 대기 상태로
- [❌ 거절] : 거절 사유 입력 모달 (F2-3)
- [💬 답변하기] : 메모 추가 (F2-13)

**상태 전이:**
- `SUBMITTED` → `APPROVED` (승인)
- `SUBMITTED` → `REJECTED` (거절)

**부모 둘 동시 검토:**
- 2단계는 단순 "선착순" 처리 (락 없이)
- 한 명이 승인/거절하면 다른 부모는 결과만 조회
- 충돌 해결 정교화는 4단계 (F4-5)

#### F2-3. 거절 사유 + 자녀 재청구

**설명:** 부모가 청구를 거절할 때 사유를 입력하고, 자녀가 사유 확인 후 수정·재청구.

**거절 입력 모달:**
```
┌─ 거절 사유 입력 ────────────────────┐
│                                      │
│ 사유 (300자 이내)                    │
│ ┌──────────────────────────────────┐│
│ │이번 달 추가 용돈 항목이 너무 많아.││
│ │옷 구매는 다음 달에 같이 가서 사자.││
│ └──────────────────────────────────┘│
│                                      │
│ 거절 형태:                           │
│  ○ 전체 거절 (다시 작성)              │
│  ● 협의 거절 (수정 후 재청구)          │
│                                      │
│            [취소]    [거절]           │
└──────────────────────────────────────┘
```

**거절 후:**
- 청구 상태: `SUBMITTED` → `REJECTED`
- 자녀에게 알림 + 사유 표시
- 자녀 화면에 "거절됨" 배지

**자녀 재청구:**
- 거절된 청구 [수정하기] 클릭
- 기존 임시 항목·메모가 유지된 채 편집 화면 진입
- 수정 후 [재청구]
- 상태: `REJECTED` → `RESUBMITTED` → 부모 검토 (F2-2 재진입)

**거절 횟수:**
- 무제한 (가족 간 협상이라 제한 없음)
- 단, 통계상 월별 거절율 추적 (4단계 F4-12)

#### F2-4. 부모 지급 표시

**설명:** 부모가 청구를 승인 후 실제 송금하고 시스템에 [지급 완료] 표시.

**입력 항목 (지급 표시 모달):**
| 항목 | 타입 | 필수 | 비고 |
|---|---|---|---|
| 실제 송금액 | 숫자 | 필수 | 청구액과 다를 수 있음 (부분 입금) |
| 송금 방법 | 라디오 | 선택 | 카톡/계좌이체/현금/기타 |
| 송금 일시 | 자동 | - | 부모가 표시한 시점 |
| 비고 | 텍스트 | 선택 | "토스로 보냄" 등 |

**부분 입금:**
- 송금액 < 청구액인 경우 미수금 자동 계산 (F2-7)
- "5,000원 부족 → 다음달 자동 합산" 안내 표시

**상태 전이:**
- `APPROVED` → `PAID_PENDING` (자녀 수령 확인 대기)

**자녀에게 알림:**
- "5월 용돈 130,000원이 입금되었습니다. 받으셨으면 [수령 확인]을 눌러주세요."

#### F2-5. 청구 이력 보관 (간단 리스트)

**설명:** 과거 청구 내역을 시간 순으로 조회 가능.

**이력 화면:**
```
┌─ 청구 이력 (자녀A) ──────────────────┐
│                                       │
│ 2026-05  142,640원  ✅ 완료            │
│         송신: 4-30, 지급: 5-1          │
│                                       │
│ 2026-04   98,560원  ✅ 완료            │
│         부분입금 -3,000원, 미수 자동합산│
│                                       │
│ 2026-03  108,200원  ❌ 거절(2회) ✅완료│
│         거절: "추가 용돈 과다"          │
│                                       │
│ ⋯                                     │
└───────────────────────────────────────┘
```

**조회 기능:**
- 월별 정렬 (최신 → 과거)
- 상태별 필터 (완료/거절/진행중)
- 클릭 시 상세 보기 (당시 캘린더, 정산표, 메시지 이력)

**보관 기간:**
- 무제한 (DB 비용 발생 시 정책 재검토)

**삭제 정책:**
- 사용자가 명시적으로 삭제하지 않는 한 영구 보관
- 명시적 삭제는 4단계 F4-2

#### F2-6. 추가 용돈 요청·검토·지급

**설명:** 정기 청구와 별도로 자녀가 비정기 용돈을 요청 (체험학습, 수련회, 친구 선물 등).

**자녀 입력 항목:**
| 항목 | 타입 | 필수 | 비고 |
|---|---|---|---|
| 카테고리 | 드롭다운 | 필수 | F1-5와 동일 |
| 이름 | 텍스트 | 필수 | 50자 |
| 금액 | 숫자 | 필수 | 원 |
| 사용 예정일 | 날짜 | 필수 | |
| 사유/메모 | 텍스트 | 선택 | 300자 |

**처리 흐름:**
- 자녀: [추가 용돈 요청] → 입력 → 송신
- 부모: 알림 → 검토 → 승인 / 거절
- 승인 시: 다음 정기 청구에 자동 포함 OR 즉시 지급 (선택)

**즉시 지급 vs 다음 청구 합산:**
- 자녀가 요청 시 둘 중 선택
- 즉시 지급: 별도 청구로 처리
- 다음 청구 합산: 5월 청구 시 자동 추가

**상태 전이:**
- `EXTRA_REQUESTED` → `EXTRA_APPROVED` / `EXTRA_REJECTED`
- 승인 시 → 정기 청구의 항목으로 통합 또는 별도 지급

#### F2-7. 부분 입금 + 미수금 자동 다음달 합산

**설명:** 부모가 청구액 일부만 입금한 경우 미수금을 자동 추적하고 다음 달 청구에 자동 합산.

**미수금 발생 조건:**
- F2-4에서 송금액 < 청구액인 경우
- 차액 = 청구액 - 송금액 = 미수금

**미수금 처리:**
- 청구 상태에 미수금 정보 저장
- 다음 달 청구 작성 시 자동 표시:
  ```
  [지난달 미수] +12,640원 (5월 분)
  ```
- 자녀가 청구 시 자동 합산
- 합산 후 부모가 일부만 입금하면 미수금 누적

**미수금 누적 한도:**
- 시스템 한도 없음 (가족 합의)
- 단, 통계 화면에 "누적 미수금: 50,000원" 경고 표시 (4단계 F4-12)

**미수금 정산 처리:**
- 부모가 [미수금 정리] 메뉴에서 직접 취소 가능 ("이번 달 미수금은 없던 걸로")
- 정산 시 이력에 "미수금 정산 -12,640원" 기록

**UI 표시:**
- 자녀 화면 상단: "💛 미수 12,640원" 인디케이터
- 부모 화면: 자녀별 누적 미수금 표시

#### F2-8. 부모 차감 입력·자동 반영

**설명:** 부모가 자녀에게 차감해야 할 금액을 직접 입력하면, 자녀의 다음 청구에 자동 반영.

**차감 입력 항목:**
| 항목 | 타입 | 필수 | 비고 |
|---|---|---|---|
| 차감 대상 자녀 | 드롭다운 | 필수 | |
| 차감 사유 | 텍스트 | 필수 | 100자 |
| 차감 금액 | 숫자 | 필수 | 원 |
| 적용 월 | 드롭다운 | 필수 | 다음 달 default |

**예시:**
- "4월 카드 잘못 사용 -5,000원, 5월 청구에 반영"

**자동 반영:**
- 5월 청구 작성 시 자녀 화면에 표시:
  ```
  [지난달 차감] -5,000원 (4월 카드 잘못 사용)
  ```
- 자녀가 청구 시 자동 합산 (음수)

**음수 잔액 처리:**
- 차감 > 청구액인 경우
- 시스템: 청구 합계가 음수면 "자녀가 부모에게 갚아야 할 금액"으로 표시
- UI: "이번 달은 -5,000원 (자녀A → 부모) 정산"
- 실제 정산은 외부 송금

**차감 취소:**
- 부모가 [차감 관리] 메뉴에서 미적용 차감 취소 가능
- 적용 후에는 신규 "보정 차감"으로만 정정

#### F2-9. 클라우드 저장

**설명:** 모든 데이터를 백엔드 클라우드 DB에 저장.

**저장 대상:**
- 가족 정보 (가족 코드, 구성원 목록)
- 자녀별 기본 설정
- 월별 캘린더 데이터 (임시 항목, 메모)
- 청구 이력 (모든 청구의 모든 상태 변경)
- 미수금 / 차감 이력
- 추가 용돈 요청 이력

**동기화 정책:**
- 사용자 액션 즉시 서버 반영 (낙관적 업데이트)
- 충돌 시 서버 우선
- 오프라인 작성 → 재연결 시 자동 동기화 (4단계 F4-15)

**데이터 보안:**
- 가족 코드 기반 접근 (가족 코드를 아는 사람만 접근 가능)
- HTTPS 통신 필수
- 가족 간 데이터 격리 (가족 ID로 분리)

**1단계 → 2단계 마이그레이션:**
- 1단계 사용자가 2단계로 업그레이드 시 로컬스토리지 데이터 자동 임포트
- 가족 만들기 직후 "기존 데이터 가져오기" 옵션

#### F2-10. 가족 공유 코드

**설명:** 회원가입 없이 가족 코드로 가족 그룹에 접근.

**가족 코드 생성:**
- 첫 사용자가 [가족 만들기] 클릭 시 자동 생성
- 형식: `XXXXX-YYYYYY` (예: `MYFAM-A3F9K2`)
- 길이: 영문대문자+숫자 12자 (앞 5 + 뒤 6, 하이픈 포함 12자)
- 충돌 방지: 신규 생성 시 중복 검사
- 추측 방지: 충분한 엔트로피 (영문26+숫자10, 11자 = 약 36^11 = 1.3e17 조합)

**가족 합류:**
- 다른 구성원이 [가족 합류] 클릭
- 가족 코드 + 본인 이름 + 역할(부모/자녀) 입력
- 가족 인원 한도 검증 (부모 2 + 자녀 5 = 최대 7)
- 합류 완료 시 즉시 데이터 접근

**가족 코드 관리:**
- 부모만 가족 코드 재발급 가능
- 재발급 시 기존 코드는 무효화
- 자녀 코드 누설 위험 시 부모가 즉시 재발급

**역할 변경:**
- 가족 만들고 나서 역할 변경 불가 (보안)
- 변경 필요 시 가족 다시 만들고 데이터 마이그레이션

#### F2-11. 알림 시스템 (인앱 + 이메일)

**설명:** 청구·승인·거절·지급 등 주요 이벤트 발생 시 관계자에게 알림.

**알림 채널:**
- 인앱 (배지 + 알림함)
- 이메일 (기본 ON, 사용자 끔/켬 가능)
- 푸시는 4단계 (F4-11)

**알림 시점:**

| 이벤트 | 받는 사람 | 인앱 | 이메일 |
|---|---|---|---|
| 자녀 청구 송신 | 부모 모두 | ✅ | ✅ |
| 부모 승인 | 자녀 + 다른 부모 | ✅ | ✅ |
| 부모 거절 | 자녀 + 다른 부모 | ✅ | ✅ |
| 부모 지급 표시 | 자녀 | ✅ | ✅ |
| 자녀 수령 확인 | 부모 모두 | ✅ | ❌ |
| 추가 용돈 요청 | 부모 모두 | ✅ | ✅ |
| 부모 차감 입력 | 자녀 | ✅ | ❌ |
| 매월 말일 (다음달 알림) | 자녀 | ✅ | ✅ |

**이메일은 가족 코드 단계에서 어떻게?**
- 2단계: 합류 시 본인 이메일 입력 (선택, 알림 받기용)
- 이메일 미입력자는 인앱 알림만
- 3단계 정식 계정 시 이메일 필수화

**알림 함:**
- 화면 우상단 종 아이콘 + 빨간 점
- 클릭 시 최근 알림 20개 표시
- [모두 읽음] 버튼

**알림 끔/켬:**
- [설정] → [알림 관리]
- 채널별, 이벤트별 ON/OFF

#### F2-12. 자녀 수령 확인

**설명:** 부모가 [지급 완료] 표시한 청구에 대해 자녀가 실제 수령 후 [수령 확인].

**자녀 화면:**
```
┌─ 5월 청구 (지급 대기) ────────────┐
│                                    │
│ 부모: 2026-05-01 09:23 지급 완료   │
│ 송금액: 130,000원                  │
│ 송금 방법: 토스                    │
│ 비고: "토스 송금 완료"              │
│                                    │
│ 받으셨나요?                        │
│  [✅ 받았어요]  [❌ 못 받았어요]    │
└────────────────────────────────────┘
```

**[받았어요] 클릭:**
- 청구 상태: `PAID_PENDING` → `COMPLETED`
- 부모에게 알림 ("자녀A 수령 확인")
- 청구 종료

**[못 받았어요] 클릭:**
- 청구 상태: `PAID_PENDING` → `PAYMENT_DISPUTED`
- 부모에게 알림 ("자녀A 수령 안 됨, 확인 필요")
- 부모-자녀 협의 후 재처리

**자동 확인 정책:**
- 부모 [지급 완료] 후 7일 경과 시 자동 [수령 확인] (자녀 응답 없을 때)
- 자동 확인 시 시스템 메모: "7일 경과 자동 수령 확인"

**중요성:**
- 송금 실수, 입금 지연, 부모 착각 등 분쟁 방지
- 시스템 신뢰도 핵심 기능

#### F2-13. 자녀 청구 메모 + 부모 답변

**설명:** 청구 송신 시 자녀가 부모에게 코멘트를 남기고, 부모가 답변할 수 있다.

**자녀 청구 메모:**
- F2-1 청구 작성 시 입력 (선택)
- 500자 이내
- 예: "이번 달 좀 많아요. 학원 특강이 있어서요."

**부모 답변:**
- F2-2 검토 시 답변 입력 가능 (선택)
- 500자 이내
- 승인/거절 시 함께 송신
- 예: "이해했어. 다음 달부터 특강은 미리 알려줘."

**메모 표시:**
- 청구 상세 화면에 시간순 표시:
  ```
  자녀A: 4-30 14:23
   "이번 달 좀 많아요..."
  부모1: 5-1 09:23 ✅ 승인
   "이해했어..."
  ```

**제한:**
- 1:1 단방향 메모 (자녀 → 부모, 부모 → 자녀)
- 채팅 형식은 4단계 이후 검토 (보류)

**보관:**
- 청구 이력에 영구 보관

#### F2-14. 청구 미리보기

**설명:** 자녀가 청구 송신 전에 [미리보기]로 부모가 받을 화면을 미리 확인.

**미리보기 내용:**
- 청구할 캘린더 (그대로)
- 정산표 (그대로)
- 청구 메모 (그대로)
- 임시 항목 / 추가 용돈 / 미수금 / 차감 모두 표시
- 합계 강조

**미리보기 화면:**
```
┌─ 청구 미리보기 ─────────────────────┐
│ 부모님이 보실 화면입니다.            │
│                                      │
│ [캘린더 표시]                        │
│                                      │
│ 정산표:                              │
│  💰 기본 용돈: 80,000원              │
│  🏫 학교 버스: 41,760원 (×18)        │
│  📚 학원 버스: 20,880원 (×9)         │
│  🎒 체험학습: +8,000원                │
│  💛 미수: +12,640원                  │
│  🔻 차감: -5,000원                   │
│  ───────────────                     │
│  합계: 158,280원                     │
│                                      │
│ 메모: "이번 달..."                    │
│                                      │
│      [⬅ 수정]    [✅ 청구하기 ➡]     │
└──────────────────────────────────────┘
```

**버튼:**
- [수정]: 청구 작성으로 돌아감
- [청구하기]: 송신 + 부모 알림

#### F2-15. 청구 상태 머신

**설명:** 청구의 모든 상태와 전이를 시스템 차원에서 관리. (이는 기능이라기보다 시스템 설계 사항)

**청구 상태:**

| 상태 | 의미 |
|---|---|
| `DRAFT` | 자녀 작성 중 (미송신) |
| `SUBMITTED` | 송신 완료, 부모 검토 대기 |
| `APPROVED` | 부모 승인, 지급 대기 |
| `REJECTED` | 부모 거절 |
| `RESUBMITTED` | 자녀 재청구 |
| `PAID_PENDING` | 부모 지급 표시, 자녀 확인 대기 |
| `COMPLETED` | 자녀 수령 확인, 종료 |
| `PAYMENT_DISPUTED` | 자녀 "못 받음" 표시, 분쟁 |
| `CANCELLED` | 청구 취소 (4단계 추가) |

**상태 전이도:**
```
       DRAFT
         │ 자녀 송신
         ▼
     SUBMITTED ───────── 부모 거절 ──────► REJECTED
         │                                    │
         │ 부모 승인                          │ 자녀 재청구
         ▼                                    ▼
     APPROVED                            RESUBMITTED
         │ 부모 지급 표시                      │
         ▼                                    │
     PAID_PENDING                              │
         │ 자녀 수령 확인                       │
         │ or 7일 경과 자동                    │
         ▼                                    │
     COMPLETED ◄─────────────────────────────┘

   (자녀 "못 받음" 분기)
   PAID_PENDING ──► PAYMENT_DISPUTED
                        │ 협의 후 재처리
                        ▼
                    PAID_PENDING (재시도)
```

**상태 변경 권한:**
- `DRAFT` → `SUBMITTED`: 자녀
- `SUBMITTED` → `APPROVED/REJECTED`: 부모
- `REJECTED` → `RESUBMITTED`: 자녀
- `APPROVED` → `PAID_PENDING`: 부모
- `PAID_PENDING` → `COMPLETED/PAYMENT_DISPUTED`: 자녀
- `PAYMENT_DISPUTED` → `PAID_PENDING`: 부모

**시스템 보장:**
- 모든 상태 변경 시 변경 이력 기록 (P-02)
- 동시성 처리: 트랜잭션 단위로 처리
- 무효 전이 차단 (예: `SUBMITTED` → `COMPLETED` 직접 불가)

---

### 9.3 2단계 화면 설계

#### 9.3.1 첫 진입 (가족 코드 입력)

```
┌─────────────────────────────────────┐
│  📅 가족 용돈 관리                  │
│                                     │
│  ○ 가족 만들기 (첫 사용)             │
│  ○ 가족 합류 (가족 코드 받음)         │
│                                     │
│        [시작하기]                    │
└─────────────────────────────────────┘
```

#### 9.3.2 가족 만들기

```
┌─ 가족 만들기 ────────────────────────┐
│                                      │
│ 가족 이름: [홍길동네]                │
│                                      │
│ 본인 이름: [홍부모]                   │
│ 본인 역할: ●부모 ○자녀                │
│ 본인 이메일 (선택): [hong@example.com]│
│                                      │
│ 가족 코드가 자동 생성됩니다.          │
│                                      │
│        [취소]    [가족 만들기]        │
└──────────────────────────────────────┘
```

#### 9.3.3 가족 합류

```
┌─ 가족 합류 ──────────────────────────┐
│                                      │
│ 가족 코드: [MYFAM-______]             │
│                                      │
│ 본인 이름: [홍자녀A]                  │
│ 본인 역할: ○부모 ●자녀                 │
│ 본인 이메일 (선택): [______]          │
│                                      │
│        [취소]    [가족 합류]          │
└──────────────────────────────────────┘
```

#### 9.3.4 자녀 메인 (청구 작성)

```
┌─────────────────────────────────────────────┐
│ 안녕하세요, 자녀A님 [🔔3] [⚙]                │
│ 💛 미수 12,640  🔻 차감 -5,000원             │
├─────────────────────────────────────────────┤
│ [◀] 2026년 5월 [▶]   [📌비고]              │
│                                             │
│ [캘린더 표시 - F1-2와 동일]                  │
│                                             │
├─────────────────────────────────────────────┤
│ 5월 정산                                    │
│  💰 기본:   80,000   🏫 학교:  41,760(×18)  │
│  📚 학원:   20,880(×9)                      │
│  🎒 체험학습 +8,000   💛 미수 +12,640        │
│  🔻 차감 -5,000                              │
│  ────────────                                │
│  합계: 158,280원                             │
│                                             │
│ 청구 메모:                                  │
│ ┌────────────────────────────────┐          │
│ │이번 달 좀 많아요. 체험학습 1회 │          │
│ └────────────────────────────────┘          │
│                                             │
│  [💾 임시저장] [👁 미리보기] [📤 청구하기]   │
└─────────────────────────────────────────────┘
```

#### 9.3.5 부모 메인 (청구함)

```
┌─────────────────────────────────────┐
│ 안녕하세요, 홍부모님 [🔔1]            │
│ 가족: 홍길동네                       │
├─────────────────────────────────────┤
│                                     │
│ 📥 청구함                           │
│                                     │
│ 🆕 자녀A의 5월 청구  158,280원      │
│    송신: 2026-04-30 14:23           │
│    "이번 달 좀 많아요..."           │
│    [열어 보기 ▶]                    │
│                                     │
│ ✅ 자녀B의 4월 청구 (완료)          │
│    98,560원                         │
│    [이력 보기]                      │
│                                     │
├─────────────────────────────────────┤
│ 📊 자녀별 누적                      │
│  자녀A: 미수 12,640원               │
│  자녀B: 미수 0원                    │
│                                     │
│  [+ 추가 용돈 요청 검토]             │
│  [+ 차감 입력]                       │
└─────────────────────────────────────┘
```

#### 9.3.6 부모 검토 화면

```
┌─ 자녀A의 5월 청구 ────────────────────┐
│                                       │
│ [캘린더 미리보기 - 읽기 전용]          │
│                                       │
│ 정산표:                                │
│  💰 기본 용돈     80,000원             │
│  🏫 학교 버스    +41,760원 (1,160×2×18)│
│  📚 학원 버스    +20,880원 (1,160×2×9) │
│  🎒 체험학습      +8,000원 (5/14)      │
│  💛 지난달 미수  +12,640원             │
│  🔻 차감          -5,000원 (4월 카드)   │
│  ────────────                          │
│  합계           158,280원              │
│                                       │
│ 자녀 메모:                             │
│  "이번 달 좀 많아요. 체험학습 1회와    │
│   지난달 미수 합쳐져서요."             │
│                                       │
│ 답변 (선택):                            │
│ ┌──────────────────────────────────┐  │
│ │                                  │  │
│ └──────────────────────────────────┘  │
│                                       │
│      [❌ 거절]   [✅ 승인]             │
└───────────────────────────────────────┘
```

#### 9.3.7 자녀 청구 결과 (승인 후)

```
┌─ 5월 청구 (지급 대기) ─────────────────┐
│                                        │
│ 상태: ✅ 부모님 승인                    │
│ 승인 시각: 2026-05-01 09:23            │
│ 부모 답변: "이해했어..."                │
│                                        │
│ 부모님이 송금 후 [지급 완료] 표시하면   │
│ 알림이 옵니다.                          │
│                                        │
│              [닫기]                     │
└────────────────────────────────────────┘
```

---

### 9.4 2단계 예외 처리

| 상황 | 처리 |
|---|---|
| 가족 코드 잘못 입력 | "가족을 찾을 수 없습니다" 안내 |
| 가족 인원 초과 | 가입 차단, 부모 안내 |
| 부모 둘이 동시 승인/거절 | 선착순 처리, 두 번째는 결과만 표시 |
| 자녀가 [청구하기] 시 미해결 청구 존재 | 경고 모달 "이미 5월 청구가 진행 중. 새로 만들면 기존은 취소됩니다." |
| 청구 송신 후 7일 경과 | 부모에게 리마인더 알림 |
| 부모 [지급 완료] 후 7일 자녀 무응답 | 자동 [수령 확인] 처리 |
| 네트워크 끊김 | 로컬 임시 저장, 재연결 시 자동 동기화 |
| 동기화 충돌 | 서버 데이터 우선 |

---

### 9.5 2단계 검증 기준

#### 출시 가능 조건
- [ ] Hex님 가족 4명이 1개월간 청구·승인·지급 흐름 완결
- [ ] 부분 입금, 차감, 추가 용돈 정상 처리
- [ ] 부모 둘 모두 알림 수신 정상
- [ ] 자녀 수령 확인 정상
- [ ] 1단계 데이터 마이그레이션 정상 작동

#### 측정 지표
- 평균 청구 처리 시간 (송신 → 완료): 24시간 이내
- 거절율: 30% 이하 (높으면 청구 작성 UX 문제)
- 미수금 누적: 월말 기준 평균 청구액의 10% 이하

---

### 9.6 2단계 사용 후 검증 사항

다음을 2~3개월 사용 후 평가:
- 양방향 흐름이 카톡 대비 정말 편한가
- 알림 시점이 적절한가 (너무 많거나 적은가)
- 부모 둘 동시 처리 충돌이 실제 발생하는가
- 거절·재청구 흐름이 자연스러운가
- 3단계 정식 계정으로 갈 동기가 충분한가

---
## 10. 3단계 상세 명세 (Account System)

### 10.1 3단계 개요

#### 컨셉
**"다른 가족도 가입해서 안전하게 사용할 수 있는 정식 서비스"**

#### 사용자
- 여러 가족 — 각 가족이 격리된 계정 보유
- 가족 간 데이터는 완전 분리

#### 핵심 가치
**"우리 가족 외에 다른 가족도 안전하게 가입해서 사용 가능"**

#### 시스템 특성
- 정식 회원가입 시스템 (이메일·비밀번호)
- 데이터 보안 강화 (가족 간 격리, 권한 검증)
- 법적 대응 (약관, 개인정보처리방침)
- 마이그레이션 지원 (2단계 사용자 무중단 업그레이드)

#### 배포
- 정식 웹 서비스 (도메인 보유)
- 회원가입 가능한 공개 사이트

---

### 10.2 3단계 추가 기능 명세

> 1·2단계 23개 기능은 모두 유지됨. 다음은 **추가되는 11개 기능**.

#### F3-1. 이메일 + 비밀번호 회원가입

**설명:** 정식 계정 시스템 도입. 이메일·비밀번호로 회원가입.

**가입 입력 항목:**
| 항목 | 타입 | 필수 | 검증 규칙 |
|---|---|---|---|
| 이메일 | 텍스트 | 필수 | RFC 5322 형식 + 중복 검사 |
| 비밀번호 | 비밀 | 필수 | F3-10 정책 |
| 비밀번호 확인 | 비밀 | 필수 | 비밀번호와 일치 |
| 이름 | 텍스트 | 필수 | 2~20자 |
| 역할 | 라디오 | 필수 | 부모 / 자녀 |
| 약관 동의 | 체크 | 필수 | F3-8 |
| 개인정보 동의 | 체크 | 필수 | F3-8 |
| 마케팅 수신 | 체크 | 선택 | |

**가입 흐름:**
1. 입력 → [가입]
2. 이메일 인증 메일 발송 (F3-11)
3. 사용자가 메일 링크 클릭 → 인증 완료
4. 자동 로그인 → 가족 만들기/합류 안내

**가입 후 자동 처리:**
- 사용자 ID 발급 (UUID)
- 비밀번호 해싱 저장 (bcrypt 12 rounds 권장)
- 마지막 로그인 시각 기록
- 환영 메일 발송

#### F3-2. 로그인 / 로그아웃

**설명:** 이메일·비밀번호로 로그인.

**로그인 화면:**
- 이메일
- 비밀번호
- "로그인 유지" 체크 (선택)
- [로그인]
- [비밀번호 찾기]
- [회원가입]

**로그인 후:**
- 세션 토큰 발급 (JWT 권장)
- 세션 만료: F3-10 참조
- 가족이 있으면 메인, 없으면 가족 만들기/합류 안내

**로그아웃:**
- 세션 토큰 폐기
- 인증 정보 삭제
- 로그인 화면으로 이동

**다중 기기 로그인:**
- 동시 로그인 허용 (PC + 폰)
- 단, 한 번에 최대 5개 세션

#### F3-3. 비밀번호 재설정

**설명:** 비밀번호 분실 시 이메일 인증으로 재설정.

**재설정 흐름:**
1. 로그인 화면 [비밀번호 찾기]
2. 이메일 입력 → [재설정 메일 보내기]
3. 시스템: 이메일로 재설정 링크 발송 (1시간 유효)
4. 사용자: 링크 클릭 → 새 비밀번호 입력 화면
5. 새 비밀번호 입력 → [재설정]
6. 시스템: 비밀번호 업데이트 + 모든 세션 로그아웃 + 알림 메일

**보안:**
- 재설정 링크: 1회용 토큰, 1시간 유효
- 동일 이메일 재설정 요청: 5분에 1회 제한
- 비밀번호 변경 시 모든 기존 세션 강제 로그아웃

**미가입 이메일 입력 시:**
- "재설정 메일을 보냈습니다" (실제로는 안 보냄)
- 이메일 존재 여부 노출 방지

#### F3-4. 계정 정보 수정

**설명:** 가입한 사용자가 본인 정보 수정.

**수정 가능 항목:**
| 항목 | 가능 여부 | 비고 |
|---|---|---|
| 이메일 | ✅ 가능 | 이메일 인증 재실시 |
| 비밀번호 | ✅ 가능 | 기존 비밀번호 확인 필수 |
| 이름 | ✅ 가능 | |
| 역할 | ❌ 불가 | 가족 재구성 필요 |
| 마케팅 수신 | ✅ 가능 | |
| 알림 설정 | ✅ 가능 | F2-11 |
| 자녀 기본 설정 | ✅ 가능 | F1-9에서 통합 |

**비밀번호 변경 흐름:**
1. [현재 비밀번호] 확인
2. [새 비밀번호] 입력
3. [새 비밀번호 확인] 일치
4. 변경 완료 → 모든 다른 세션 로그아웃 (보안)

**이메일 변경 흐름:**
1. 새 이메일 입력
2. 새 이메일로 인증 메일 발송
3. 인증 완료 시 변경 적용
4. 기존 이메일에도 변경 알림 메일 발송

#### F3-5. (제거됨 - F1-9로 통합)

> 자녀 기본 설정 변경은 1단계 F1-9에 이미 포함됨. 3단계에서는 F3-4 계정 정보 수정 안에 자녀 기본 설정 변경을 포함.

#### F3-6. 가족 그룹 + 초대 (코드 + 이메일 링크)

**설명:** 정식 가족 그룹 생성 + 다양한 초대 방식.

**가족 그룹 생성:**
- [가족 만들기] → 가족 이름 입력 → 생성
- 생성 시 가족 코드 자동 발급 (12자, F2-10과 호환)
- 생성한 사용자가 첫 부모로 등록

**초대 방식:**

##### 방식 1. 가족 코드 (F2-10 유지)
- 가족 코드를 카톡·문자로 전달
- 받는 사람이 회원가입 후 [가족 합류] → 코드 입력
- 7일 후 자동 만료 (F3-7)

##### 방식 2. 이메일 링크 초대
- 부모: [구성원 초대] → 받을 사람 이메일 입력 + 역할 선택
- 시스템: 받는 사람에게 초대 메일 발송 + 가입 링크
- 받는 사람: 링크 클릭 → 회원가입 → 자동 가족 합류
- 7일 후 자동 만료

**초대 관리 화면:**
```
┌─ 가족 구성원 ──────────────────────┐
│                                     │
│ 👤 홍부모 (부모) ★대표              │
│    가입: 2026-04-15                 │
│                                     │
│ 👤 홍자녀A (자녀)                   │
│    가입: 2026-04-15                 │
│                                     │
│ 📨 미가입: park@example.com (자녀)  │
│    초대일: 2026-04-28 (5일 후 만료) │
│    [재발송] [취소]                  │
│                                     │
│         [+ 구성원 초대]              │
└─────────────────────────────────────┘
```

**가족 인원 한도:**
- 부모 최대 2명, 자녀 최대 5명 (F3-12)
- 한도 초과 시 초대 차단

#### F3-7. 초대 7일 자동 만료

**설명:** 가족 코드와 이메일 초대 모두 7일 후 자동 만료.

**만료 정책:**
- 발송일로부터 7일 후 자정 기준
- 만료 시 코드/링크 무효화
- 초대받은 사람이 그 후에 시도하면 "만료된 초대" 안내
- 부모가 [재발송] 클릭으로 새 초대 발송 가능

**알림:**
- 만료 1일 전: 부모에게 알림 ("자녀A 초대가 내일 만료됩니다")
- 만료 시: 부모에게 알림

**가족 코드 자체 만료:**
- 가족 만들 때 발급된 가족 코드는 영구 유효
- 단, 부모가 재발급 시 기존 코드 즉시 무효 (F2-10)

#### F3-8. 약관 / 개인정보처리방침 + 동의 절차

**설명:** 한국 서비스 운영에 필요한 약관·개인정보 동의.

**필수 약관:**
1. **이용약관** (서비스 이용 전반)
2. **개인정보 처리방침** (수집 항목, 보관 기간 등)

**선택 약관:**
3. **마케팅 수신 동의** (이메일 / 푸시)

**동의 시점:**
- 회원가입 시 (필수)
- 이미 가입한 사용자는 약관 변경 시 재동의 (변경 사항만)

**약관 내용 요건 (개인정보 처리방침 예시):**
- 수집 항목: 이메일, 이름, 비밀번호(해싱), 가족 정보, 청구 내역
- 수집 목적: 서비스 제공
- 보관 기간: 회원 탈퇴 시까지 + 5년 (법적 의무)
- 제3자 제공: 없음
- 처리 위탁: 클라우드 호스팅 업체
- 사용자 권리: 조회·수정·삭제 (F4-2)

**보관 위치:**
- 약관 페이지 별도 (가입 화면, 메인 화면 푸터에 링크)

**버전 관리:**
- 각 약관마다 버전·시행일 명시
- 사용자별 동의 버전 기록 (감사 로그)

#### F3-9. 2단계 → 3단계 마이그레이션

**설명:** 2단계 가족 코드 사용자가 3단계 정식 계정으로 이전.

**마이그레이션 흐름:**

##### 시나리오 A. 2단계 사용자가 3단계 첫 접속
1. 기존 화면 접속 시 안내 모달:
   ```
   "정식 계정 시스템이 도입되었습니다.
    회원가입 후 기존 가족 데이터를 그대로 사용할 수 있습니다."
   ```
2. [회원가입하고 가족 연결] 클릭
3. 회원가입 (F3-1)
4. 가족 코드 입력 (기존 2단계 가족 코드)
5. 시스템: 기존 가족 데이터에 본인 계정 연결
6. 본인 역할 자동 매핑 (2단계에서 부모로 활동했다면 부모로)
7. 마이그레이션 완료

##### 시나리오 B. 가족 일부만 마이그레이션
- 부모1만 정식 계정 만들고 다른 구성원 안 만든 경우
- 부모1: 정식 계정으로 정상 사용
- 다른 구성원: 가족 코드로 계속 사용 (병행 운영)
- 단, 마이그레이션 미완료 가족은 4단계 출시 시 강제 마이그레이션 (F4-2 데이터 삭제 정책 영향)

##### 마이그레이션 기간 정책
- 2단계 → 3단계 병행 운영: 6개월
- 6개월 후 2단계 단종 (이전 못한 가족은 데이터 보호 후 안내)

**데이터 호환:**
- 1·2단계의 모든 데이터 그대로 보존
- 청구 이력, 미수금, 차감, 추가 용돈 모두 유지
- 가족 구성원 목록 유지

**ID 매핑:**
- 2단계의 가족 코드 = 3단계 가족 ID로 변환
- 2단계의 사용자 식별자(이름) = 3단계의 사용자 ID와 매핑

#### F3-10. 로그인 보안 정책

**설명:** 정식 계정 시스템에 필수적인 보안 정책.

**비밀번호 정책:**
- 최소 길이: 8자
- 권장 길이: 12자 이상
- 필수 포함: 영문 대소문자 + 숫자 (특수문자는 권장)
- 흔한 비밀번호 차단 (사전 기반 검사: password123 등)
- 이메일과 동일 비밀번호 차단

**로그인 시도 제한:**
- 5회 실패 시 15분 잠금
- 잠금 중 추가 시도는 카운트만, 잠금 시간 연장 안 함
- 잠금 안내 + 비밀번호 재설정 링크 안내

**세션 정책:**
- 세션 만료: 30일 미사용 시 자동 로그아웃
- "로그인 유지" 체크 시: 90일
- 비밀번호 변경 시: 모든 세션 강제 로그아웃
- 동시 세션: 최대 5개

**HTTPS 강제:**
- 모든 통신 HTTPS 필수
- HTTP 접속 시 HTTPS로 자동 리다이렉트

**기타 보안:**
- 비밀번호 해싱: bcrypt 12 rounds 이상
- 토큰: JWT, RS256 권장
- CSRF 토큰: 모든 변경 요청에 포함
- XSS 방어: 입력값 sanitize, output escape

**로그인 알림:**
- 새로운 기기/IP에서 로그인 시 이메일 알림
- "본인이 아니면 즉시 비밀번호를 변경하세요" 안내

#### F3-11. 이메일 인증 (가입 시)

**설명:** 회원가입 시 이메일 소유 확인.

**인증 흐름:**
1. 회원가입 정보 입력 → [가입]
2. 시스템: 인증 메일 발송
3. 사용자: 메일 수신 → [인증하기] 링크 클릭
4. 시스템: 토큰 검증 → 인증 완료
5. 자동 로그인

**미인증 상태:**
- 가입 직후: 인증 대기 상태
- 미인증 시 일부 기능 제한 (가족 만들기 불가)
- 인증 메일 24시간 유효
- [인증 메일 재발송] 가능 (5분에 1회)

**미인증 계정 정리:**
- 7일 미인증 시 자동 삭제
- 사용자에게 사전 안내 ("3일 후 미인증 계정이 삭제됩니다")

**이메일 내용:**
- 발신자: 시스템 이메일 (예: noreply@allowance.app)
- 제목: "[가족용돈] 이메일 인증을 완료해주세요"
- 내용: 인증 링크 + 만료 시각 + 본인 아닐 시 안내

#### F3-12. 가족 인원 제한 강제

**설명:** 가족당 인원 한도를 시스템에서 강제.

**한도:**
- 부모: 최대 2명
- 자녀: 최대 5명
- 합계: 최대 7명/가족

**검증 시점:**
- 가족 합류 시 (코드 입력 후, 합류 처리 전)
- 이메일 초대 발송 시 (한도 초과 시 발송 차단)
- 역할 변경 시 (변경 후 인원 검증)

**한도 초과 처리:**
- "이미 부모 인원이 가득 찼습니다 (최대 2명)" 안내
- 자녀를 부모로 변경 등은 차단

**예외:**
- 한 명이 부모도 자녀도 아닌 케이스 없음 (역할 필수)
- 친척·조부모 등은 향후 4단계 이후 검토 (보류)

---

### 10.3 3단계 화면 설계

#### 10.3.1 회원가입 화면

```
┌─ 회원가입 ─────────────────────────────┐
│                                         │
│ 이메일       [hong@example.com         ]│
│ 비밀번호     [••••••••                 ]│
│              ▶ 8자 이상, 영문 대소문자+숫자│
│ 비밀번호 확인 [••••••••                ]│
│ 이름         [홍부모                   ]│
│ 역할         ●부모  ○자녀                │
│                                         │
│ ☑ 이용약관 동의 (필수) [보기]           │
│ ☑ 개인정보처리방침 동의 (필수) [보기]    │
│ ☐ 마케팅 정보 수신 (선택)                │
│                                         │
│           [가입하기]                     │
│                                         │
│       이미 회원이신가요? [로그인]         │
└────────────────────────────────────────┘
```

#### 10.3.2 로그인 화면

```
┌─ 로그인 ───────────────────────────────┐
│                                         │
│ 이메일       [____________________]     │
│ 비밀번호     [____________________]     │
│ ☐ 로그인 유지                            │
│                                         │
│              [로그인]                    │
│                                         │
│   [비밀번호 찾기]   [회원가입]            │
└────────────────────────────────────────┘
```

#### 10.3.3 이메일 인증 안내

```
┌─ 이메일 인증 ──────────────────────────┐
│                                         │
│ 📧 hong@example.com 으로                │
│ 인증 메일을 보냈습니다.                  │
│                                         │
│ 메일함을 확인해주세요.                   │
│ 24시간 내에 인증해주세요.                │
│                                         │
│ 메일을 못 받으셨나요?                    │
│   [메일 재발송]                          │
│   [다른 이메일로 변경]                   │
└────────────────────────────────────────┘
```

#### 10.3.4 비밀번호 재설정

```
┌─ 비밀번호 재설정 ──────────────────────┐
│                                         │
│ 가입한 이메일을 입력해주세요.            │
│                                         │
│ 이메일 [____________________]            │
│                                         │
│         [재설정 메일 보내기]              │
│                                         │
│         [로그인 화면으로]                 │
└────────────────────────────────────────┘
```

#### 10.3.5 가족 만들기 (3단계)

```
┌─ 가족 만들기 ──────────────────────────┐
│                                         │
│ 가족 이름:  [홍길동네          ]         │
│                                         │
│ 가족 코드가 자동으로 생성됩니다.         │
│ 다른 구성원에게 코드를 공유하거나        │
│ 이메일로 초대할 수 있습니다.             │
│                                         │
│         [가족 만들기]                    │
└────────────────────────────────────────┘
```

#### 10.3.6 구성원 초대 (3단계 신규)

```
┌─ 구성원 초대 ──────────────────────────┐
│                                         │
│ 초대 방법                                │
│  ○ 가족 코드 공유 (URL/문자)              │
│  ● 이메일로 초대                          │
│                                         │
│ ── 이메일 초대 ──                         │
│ 받을 사람 이메일                         │
│   [child@example.com           ]         │
│ 역할                                     │
│   ○부모  ●자녀                            │
│ 초대 메시지 (선택)                       │
│   ┌────────────────────────────────┐    │
│   │우리 가족 용돈 관리에 합류해줘. │    │
│   └────────────────────────────────┘    │
│                                         │
│         [초대 메일 보내기]                │
└────────────────────────────────────────┘
```

#### 10.3.7 마이그레이션 안내

```
┌─ 정식 계정 안내 ──────────────────────┐
│                                        │
│ 🎉 정식 계정 시스템이 도입되었습니다!  │
│                                        │
│ 회원가입 후 가족 코드 'MYFAM-A3F9K2'   │
│ 를 입력하시면 기존 데이터를            │
│ 그대로 사용할 수 있습니다.             │
│                                        │
│ ⚠️ 6개월 내 정식 계정 전환 권장        │
│                                        │
│      [회원가입하고 가족 연결]           │
│      [나중에 하기]                      │
└────────────────────────────────────────┘
```

---

### 10.4 3단계 예외 처리

| 상황 | 처리 |
|---|---|
| 이메일 중복 가입 시도 | "이미 가입된 이메일입니다" + [로그인 가기] |
| 비밀번호 정책 위반 | 입력 차단 + 정책 안내 |
| 5회 로그인 실패 | 15분 잠금, 안내 메시지 |
| 인증 메일 만료 | "만료되었습니다, 재발송하시겠습니까?" |
| 미인증 상태에서 가족 만들기 시도 | "먼저 이메일 인증을 완료해주세요" |
| 가족 인원 초과 | 초대 발송 차단, 안내 |
| 가족 코드 만료된 초대 | "만료된 초대입니다" |
| 마이그레이션 시 가족 코드 오입력 | "가족을 찾을 수 없습니다" |
| 마이그레이션 시 역할 충돌 | 시스템 자동 매핑, 충돌 시 부모에게 확인 요청 |

---

### 10.5 3단계 검증 기준

#### 출시 가능 조건
- [ ] 회원가입·로그인·로그아웃 정상
- [ ] 비밀번호 재설정 정상 (1시간 토큰)
- [ ] 이메일 인증 정상 (24시간 토큰)
- [ ] 가족 만들기·합류 정상
- [ ] 이메일 초대 정상
- [ ] 약관 동의 절차 정상
- [ ] 2단계 → 3단계 마이그레이션 정상 (테스트 가족)
- [ ] 보안 검증 (HTTPS, CSRF, XSS, 비밀번호 해싱)

#### 측정 지표
- 가입 → 가족 만들기 완료율: 80% 이상
- 이메일 인증 완료율: 90% 이상
- 비밀번호 재설정 성공률: 95% 이상

---

### 10.6 3단계 사용 후 검증 사항

다음을 베타 가족 2~3팀과 1~2개월 사용 후 평가:
- 회원가입·인증 흐름의 매끄러움
- 가족 초대 흐름의 직관성
- 마이그레이션 후 데이터 정합성
- 보안 사고 / 의심 사례
- 4단계로 갈 우선순위 기능 (관리·법적 대응 중)

---
## 11. 4단계 상세 명세 (Production)

### 11.1 4단계 개요

#### 컨셉
**"장기 사용자를 위한 관리 도구 + 양방향 협상 고도화 + 자동화"**

#### 사용자
- 일반 공개 — 누구나 가입해서 사용

#### 핵심 가치
**"오래 써도 데이터 관리 편하고, 협상이 더 자연스러우며, 자동화로 부담 감소"**

#### 시스템 특성
- 운영 안정성 강화 (감사 로그, 충돌 해결)
- 법적 완전 대응 (만 14세 미만, 탈퇴 권리)
- 장기 사용자 케어 (학기 변경, 자녀 졸업)
- 자동화 (PDF 인식, 통계)

#### 배포
- 정식 출시 서비스
- 일반 공개 + 마케팅

---

### 11.2 4단계 추가 기능 명세

> 1·2·3단계 34개 기능은 모두 유지됨. 다음은 **추가되는 16개 기능**.

#### F4-1. 가족 구성원 관리 (탈퇴, 제거, 18세 졸업)

**설명:** 가족 구성원의 추가/제거/역할 변경 등 종합 관리.

**관리 가능 액션:**

##### 1. 자녀 졸업 처리 (18세 도달)
- 자녀 만 18세 도달 시 시스템 자동 안내
- 부모에게 알림 ("자녀A가 곧 만 18세입니다")
- 옵션:
  - **유지**: 자녀 그대로 (가족 합의 시)
  - **분리**: 자녀를 가족에서 제거 + 별도 계정으로 독립
  - **부모로 승급**: 자녀가 본인 가족 만들 준비

##### 2. 구성원 제거
- 부모가 다른 구성원을 가족에서 제거
- 단, 본인을 본인이 제거 불가 (탈퇴는 F4-2)
- 부모1이 부모2를 제거할 때: 양쪽 동의 필요 (둘 다 부모인 경우)
- 자녀 제거: 부모 1명 동의로 가능

**제거 후 데이터:**
- 제거된 사용자의 청구 이력은 가족에 남김
- 제거된 사용자 계정은 별도 (가족 연결만 해제)
- 제거 사실 알림 (제거당한 사람에게)

##### 3. 본인 탈퇴 (가족만)
- 본인이 가족에서 탈퇴 (계정은 유지)
- 부모 1명만 남는 가족 → 탈퇴 가능
- 부모 0명 가족 → 탈퇴 차단 (자녀만 남으면 운영 불가)

##### 4. 가족 해체
- 부모 전원 동의로 가족 해체
- 해체 시 데이터 처리:
  - 옵션 A: 모든 구성원에게 데이터 export (CSV)
  - 옵션 B: 데이터 삭제
- 해체 후 30일간 복구 가능 (실수 방지)

**관리 화면:**
```
┌─ 가족 구성원 관리 ─────────────────────┐
│                                         │
│ 가족: 홍길동네 (생성 2026-04-15)        │
│                                         │
│ 👤 홍부모 (부모) ★대표              [⋯] │
│ 👤 김부모 (부모)                    [⋯] │
│ 👤 홍자녀A (자녀, 만 16세)          [⋯] │
│ 👤 홍자녀B (자녀, 만 12세)          [⋯] │
│                                         │
│         [+ 구성원 초대]                  │
│                                         │
│ ── 위험 영역 ──                          │
│ [본인 탈퇴]                              │
│ [가족 해체]                              │
└─────────────────────────────────────────┘
```

#### F4-2. 데이터 삭제 / 계정 탈퇴

**설명:** 사용자가 본인 데이터를 삭제하거나 계정을 탈퇴할 권리 보장 (개인정보보호법).

**탈퇴 종류:**

##### 1. 가족만 탈퇴 (계정 유지)
- F4-1에 포함
- 다른 가족 합류 가능

##### 2. 계정 탈퇴
- 모든 데이터 삭제
- 가족이 있으면 먼저 가족 탈퇴 후 진행
- 비밀번호 재확인 필수
- 30일 유예 기간 (그 사이 복구 가능)
- 30일 후 영구 삭제

**탈퇴 흐름:**
1. [설정] → [계정 탈퇴]
2. 안내 모달:
   - 삭제될 데이터 항목 명시
   - 30일 유예 안내
   - 가족 영향 안내 (혼자 부모면 가족 해체 필요)
3. [계속] → 비밀번호 재확인
4. 탈퇴 사유 선택 (선택)
5. 최종 확인 → 탈퇴 처리

**삭제되는 데이터:**
- 사용자 본인 정보 (이메일, 이름, 비밀번호)
- 본인이 작성한 청구 이력
- 본인이 작성한 메모, 영수증
- 본인 알림 설정

**남는 데이터 (가족 공유):**
- 가족 그룹 자체 (다른 구성원이 있으면)
- 다른 구성원이 작성한 청구 이력 (본인이 받은 입장이라도)
- 단, 본인 식별 정보는 익명화 처리

**법적 보관:**
- 일부 데이터는 법적 의무로 5년 보관 (전자상거래법 등)
- 보관 항목: 거래 기록 (청구·지급 이력), 본인 인증 정보
- 사용자에게 명시 (개인정보처리방침)

#### F4-3. 만 14세 미만 법정대리인 동의 강화

**설명:** 한국 개인정보보호법 준수, 14세 미만 가입 시 법정대리인 동의 절차.

**대상:** 만 14세 미만 자녀

**동의 절차:**
1. 자녀가 회원가입 진행 → 생년월일 입력
2. 시스템: 만 14세 미만 감지 → 안내
   ```
   "만 14세 미만은 법정대리인(부모)의 동의가 필요합니다.
    부모님 이메일을 입력해주세요."
   ```
3. 부모 이메일 입력 → 부모에게 동의 요청 메일 발송
4. 부모: 메일 [동의하기] 링크 클릭 → 본인 인증 + 동의 절차
5. 동의 완료 시 자녀 가입 활성화

**부모 인증 방식:**
- 이메일 + 본인이 가입한 계정 (있으면) 또는 별도 가입
- 신분증 인증 등 강한 인증은 보류 (서비스 컨셉 vs 법적 요구 균형)

**14세 미만 사용 제한:**
- 가족 만들기 불가 (부모만 가능)
- 결제·구매 기능 없음 (해당 사항 없음, 본 시스템은 청구만)
- 마케팅 정보 수신 거부 default

**14세 도달 시:**
- 시스템 자동 안내 ("14세가 되었습니다, 약관 재동의 필요")
- 본인 동의로 전환 (부모 동의 해제)

#### F4-4. 변경 이력 / 감사 로그

**설명:** 시스템 전체의 모든 변경 이력을 시간순 보관.

**기록 대상:**

| 카테고리 | 기록 항목 |
|---|---|
| 청구 | 작성, 송신, 승인, 거절, 지급, 수령확인, 취소 |
| 임시 항목 | 추가, 수정, 삭제 |
| 추가 용돈 | 요청, 승인, 거절 |
| 미수금 | 발생, 정산 |
| 차감 | 입력, 적용, 취소 |
| 자녀 기본 설정 | 변경 (요일, 단가, 기본 용돈) |
| 가족 구성원 | 추가, 제거, 역할 변경 |
| 약관 동의 | 동의, 철회 |
| 보안 | 로그인, 로그아웃, 비밀번호 변경 |

**기록 항목:**
- 누가 (사용자 ID, 이름)
- 언제 (timestamp)
- 무엇을 (액션 종류)
- 어디서 (IP, User-Agent)
- 이전 값 / 이후 값 (변경된 데이터)

**조회 권한:**
- 부모: 가족의 모든 감사 로그
- 자녀: 본인 관련 로그만

**조회 화면:**
```
┌─ 감사 로그 ─────────────────────────┐
│ [기간 ▼] [사용자 ▼] [카테고리 ▼]     │
│                                     │
│ 2026-05-01 09:23                    │
│ 홍부모 (192.168.1.1)                 │
│ 5월 청구 승인 (자녀A 158,280원)      │
│                                     │
│ 2026-05-01 08:45                    │
│ 홍자녀A (203.x.x.x)                  │
│ 5월 청구 송신 (158,280원)            │
│                                     │
│ ⋯                                   │
└─────────────────────────────────────┘
```

**보관 기간:**
- 최소 1년 (운영 모니터링)
- 권장 5년 (법적 의무 일부)
- 영구 보관 후보 (탈퇴 사용자 익명화 후)

#### F4-5. 부모 두 명 동시 처리 충돌 해결

**설명:** 부모1과 부모2가 동시에 같은 청구를 처리할 때 충돌 방지.

**충돌 시나리오:**
- 부모1이 [승인] 누르는 동시에 부모2가 [거절] 누름
- 부모1이 [지급 완료] 표시 후 부모2가 [승인 취소] 시도
- 부모1이 차감 입력 중인데 부모2가 같은 자녀에 차감 입력

**해결 정책: 낙관적 락 (Optimistic Locking)**

```
모든 청구·차감 등 데이터에 version 필드 추가.
변경 시 version 검증:
  - 클라이언트가 보낸 version == 서버 version → 처리, version+1
  - 클라이언트가 보낸 version < 서버 version → 충돌, 재요청 안내
```

**충돌 발생 시 UX:**
1. 부모2가 [거절] 시도 → 서버: "이미 부모1이 승인했습니다"
2. 부모2 화면 새로고침 → 최신 상태 표시
3. 부모2: "그럼 거절 어떻게 하지?" → [승인 취소 + 거절] (별도 액션)

**액션 우선순위:**
- 같은 시각 도착 시 먼저 도착한 것이 적용
- 후순위 액션은 차단 + 알림

**[승인 취소] 액션 (4단계 신규):**
- 승인 후 지급 전이면 부모가 취소 가능
- 취소 시 자녀에게 알림
- 지급 완료 후에는 취소 불가 (Refund는 별도)

#### F4-6. 항목별 부분 승인/거절

**설명:** 청구서 통째 승인/거절이 아니라 항목별로 처리.

**대상 항목:**
- 임시 항목 (체험학습, 옷 구매 등)
- 추가 용돈 항목

**처리 방식:**
1. 부모 검토 화면에서 각 항목별 [✅] / [❌] 체크
2. 기본 용돈, 학교 버스, 학원 버스는 항상 승인 (자동)
3. 임시 항목·추가 용돈만 부분 거절 가능
4. 거절된 항목별로 사유 입력
5. 일부 거절 시 청구 상태: `PARTIALLY_APPROVED`

**예시:**
```
┌─ 청구 검토 ──────────────────────────┐
│                                       │
│ 💰 기본 용돈      80,000원   ✅자동   │
│ 🏫 학교 버스      41,760원   ✅자동   │
│ 📚 학원 버스      20,880원   ✅자동   │
│ 🎒 체험학습        8,000원   [✅][❌] │
│ 👕 옷 구매        50,000원   [✅][❌]│
│   ↑ 거절 사유: ┌──────────────┐      │
│                │옷은 다음달에 │      │
│                └──────────────┘      │
│                                       │
│ 일부 승인 합계  150,640원              │
│ 거절 항목 합계   50,000원              │
│                                       │
│      [전체 거절] [일부 승인하고 송신]  │
└───────────────────────────────────────┘
```

**자녀에게 전달:**
- 거절된 항목 명시
- 재청구 시 거절 항목 자동 제외 또는 수정 가능

#### F4-7. 청구 임시저장 (Draft)

**설명:** 자녀가 청구 작성 중 [임시저장] 가능.

**기능:**
- 청구 작성 화면에 [💾 임시저장] 버튼
- 임시저장 시 상태: `DRAFT`
- 메모, 임시 항목, 청구 메모 모두 저장
- 다음 접속 시 [작성 중인 청구] 알림

**자동 임시저장:**
- 30초마다 자동 저장 (변경 사항 있을 때만)
- "자동 저장됨 (10:23)" 표시

**임시저장 한도:**
- 같은 월에 동시에 여러 Draft 가능 (단, 저장만)
- 송신 시 1개만 활성

**Draft 정리:**
- 30일 이상 미수정 Draft는 자동 삭제 (사전 안내)
- 사용자가 수동 삭제 가능

#### F4-8. 거절 자동 만료 (24h)

**설명:** 부모가 거절한 청구는 24시간 후 자동 정리 (Apple iOS 16.1+ 패턴).

**작동:**
- 청구 상태 `REJECTED` 진입 시 24시간 타이머 시작
- 24시간 내 자녀가 재청구 안 하면 자동 정리:
  - 상태: `REJECTED` → `EXPIRED`
  - 자녀에게 알림 ("거절된 청구가 정리되었습니다, 다시 청구하세요")
  - 청구함에서 사라짐 (이력에는 유지)

**자녀 응답 정책:**
- 24시간 이내 [재청구]: 정상 흐름 진행
- 24시간 이내 [폐기]: 즉시 EXPIRED
- 24시간 후 자동: EXPIRED

**예외:**
- 자녀가 임시저장된 재청구가 있으면 24시간 카운트 일시정지

**알림:**
- 거절 후 12시간 시점: "12시간 후 자동 정리" 안내
- 24시간 후: "정리됨" 알림

#### F4-9. 영수증 사진 첨부 (자녀 등록 → 부모 조회)

**설명:** 자녀가 임시 항목·추가 용돈에 영수증 사진을 첨부.

**첨부 방식:**
- 임시 항목 입력 시 [📷 사진 추가] 버튼
- 모바일: 카메라 직접 촬영 또는 갤러리
- PC: 파일 선택

**파일 정책:**
- 형식: JPG, PNG, WebP, HEIC
- 최대 크기: 10MB / 사진 1장
- 사진당 자동 압축: 1MB 이하로 변환
- 임시 항목당 최대 사진: 5장

**저장:**
- 클라우드 스토리지 (S3 호환)
- 가족별 격리 폴더
- HTTPS로만 접근

**용량 정책:**
- 가족당 무료 용량: 1GB
- 초과 시 안내, 오래된 영수증 자동 삭제 옵션
- 향후 유료 플랜 검토 (5GB, 10GB)

**부모 조회:**
- 검토 화면에서 영수증 클릭 시 확대
- 좌우 슬라이드로 다른 영수증
- 영수증 다운로드 가능

**영수증 보관:**
- 청구 종료 후 1년간 자동 보관
- 1년 후 자동 삭제 (사전 안내)
- 사용자 [영구 보관] 체크 시 무기한 (단, 1GB 한도 적용)

#### F4-10. 추가 용돈 한도 + 초과 경고

**설명:** 부모가 자녀별로 월 추가 용돈 한도를 설정하면, 초과 청구 시 경고.

**한도 설정:**
- 부모만 설정 가능
- 자녀별 별도 설정
- 월 단위 (예: 매월 50,000원)
- 0원 / 무제한 옵션 가능

**초과 경고 트리거:**
- 자녀가 추가 용돈 요청 시 누적 초과 검사
- 청구 작성 시 임시 항목 합계 초과 검사
- 송신 직전 최종 검사

**경고 표시:**
```
┌─ ⚠️ 한도 초과 경고 ──────────────────┐
│                                       │
│ 5월 추가 용돈 한도: 50,000원          │
│ 이번 청구 추가: 60,000원              │
│ 초과: 10,000원                        │
│                                       │
│ 부모님께 사전 협의를 권장합니다.       │
│                                       │
│      [수정하기] [그래도 청구하기]      │
└───────────────────────────────────────┘
```

**[그래도 청구]** 시:
- 청구는 정상 진행
- 부모 검토 화면에 "한도 초과" 배지 표시
- 부모는 사정 보고 승인/거절 결정

**한도 종류 (확장):**
- 월 한도 (기본)
- 카테고리별 한도 (옷, 게임 등) — 향후

#### F4-11. 알림 채널·시점 확장

**설명:** 2단계의 기본 알림(F2-11)을 다각화.

**채널 추가:**
- 인앱 (기존)
- 이메일 (기존)
- 모바일 푸시 (PWA) ★신규
- SMS (보류, 비용 이슈)

**알림 시점 추가:**
| 이벤트 | 추가/변경 |
|---|---|
| 청구 송신 후 48시간 미응답 | 부모에게 리마인더 |
| 거절 후 12시간 (만료 임박) | 자녀에게 알림 |
| 매월 25일 (월말 임박) | 자녀에게 청구 준비 알림 |
| 월말 미청구 | 자녀에게 알림 |
| 매월 1일 (정산일) | 부모에게 자녀별 정산 안내 |
| 누적 미수금 50,000원 초과 | 부모·자녀 모두 |
| 14세 도달 | 자녀 본인 + 부모 |
| 18세 도달 | 자녀 본인 + 부모 |

**알림 설정 화면:**
```
┌─ 알림 설정 ──────────────────────────┐
│                                       │
│ 채널 ────                              │
│  ☑ 인앱       ☑ 이메일                │
│  ☑ 모바일 푸시 ☐ SMS                  │
│                                       │
│ 시점 ────                              │
│  청구 도착                             │
│   ☑ 인앱 ☑ 이메일 ☑ 푸시               │
│  승인/거절                             │
│   ☑ 인앱 ☑ 이메일 ☑ 푸시               │
│  지급 완료                             │
│   ☑ 인앱 ☑ 이메일 ☑ 푸시               │
│  ⋯                                   │
│                                       │
│ 조용한 시간                            │
│  [22:00] ~ [07:00]                    │
│                                       │
│            [저장]                     │
└───────────────────────────────────────┘
```

**조용한 시간:**
- 사용자 지정 시간대에는 알림 미발송 (이메일 제외)
- 긴급 알림 (보안 등)은 예외

#### F4-12. 연간 누적 통계 + 그래프

**설명:** 연간 청구 데이터를 통계·그래프로 표시.

**자녀 화면:**
```
┌─ 2026년 통계 (자녀A) ──────────────────┐
│                                         │
│ 누적 청구액      702,840원              │
│ 월 평균          140,568원              │
│ 받은 총액        680,200원              │
│ 미수금 (누적)     22,640원              │
│                                         │
│ ── 월별 추이 ──                          │
│  [막대 그래프 1~5월]                     │
│  1월 ████████ 132,000                  │
│  2월 ███████ 128,400                   │
│  3월 ████████████ 165,200              │
│  4월 ████████ 138,560                  │
│  5월 ██████████ 158,280                │
│                                         │
│ ── 카테고리별 ──                         │
│  💰 기본 용돈     400,000 (57%)         │
│  🏫 학교 버스    180,840 (26%)          │
│  📚 학원 버스    100,000 (14%)          │
│  🎒 임시 항목     22,000 (3%)           │
└─────────────────────────────────────────┘
```

**부모 화면 (다중 자녀 비교):**
```
┌─ 2026년 통계 (가족) ──────────────────┐
│                                        │
│ 자녀A    자녀B                          │
│ 702,840  450,200                        │
│                                        │
│ ── 비교 그래프 ──                       │
│  [월별 자녀A vs 자녀B 라인 차트]        │
│                                        │
│ ── 인사이트 ──                          │
│ ⚠️ 자녀A의 5월 청구가 평균 12% 증가     │
│ ✅ 자녀B의 추가 용돈은 한도 내           │
│ 💛 자녀A 누적 미수 22,640원              │
└────────────────────────────────────────┘
```

**기간 선택:**
- 1개월, 3개월, 6개월, 1년, 전체
- 직접 날짜 범위 지정

**내보내기:**
- CSV / PDF로 통계 내보내기 (F4-14와 연계)

#### F4-13. 학사일정 PDF 자동 인식 (4단계 후반)

**설명:** 학교에서 받은 학사일정 PDF를 업로드하면 시스템이 자동으로 캘린더에 반영.

**처리 흐름:**
1. 자녀: [학사일정 등록] → PDF 파일 업로드
2. 시스템: PDF 텍스트 추출 (OCR 백업 포함)
3. LLM API 호출 (Claude API 등)로 학사일정 파싱:
   - 등교일 (수업일)
   - 휴업일 (방학, 휴교, 시험기간)
   - 행사 (체험학습, 수련회, 운동회, 체육대회)
4. 추출 결과를 사용자에게 제시 (확인 화면)
5. 사용자 [확인] → 캘린더 자동 반영

**자동 반영 내용:**
- 등교일·휴업일: 캘린더 셀에 표시 (학교 등교 자동 ON/OFF)
- 행사: 임시 항목으로 자동 추가 (금액은 부모가 입력)

**확인 화면:**
```
┌─ 학사일정 자동 인식 결과 ─────────────┐
│                                        │
│ 검출된 일정:                            │
│                                        │
│ ✅ 5월 6일 ~ 8일: 중간고사 (등교)       │
│ ✅ 5월 14일: 체험학습 (박물관)         │
│ ✅ 5월 19~20일: 수련회 (강원도)        │
│ ✅ 5월 31일: 운동회                    │
│ ⚠️ 5월 26일: 인식 실패 (수동 입력 필요)│
│                                        │
│ 수정사항:                               │
│  [□] 자동 반영                           │
│  [✅] 검토 후 수동 적용                   │
│                                        │
│      [취소] [모두 적용] [선택 적용]      │
└────────────────────────────────────────┘
```

**제한:**
- PDF만 지원 (이미지·HWP 추후)
- LLM API 비용 발생 → 가족당 월 10회 한도
- 인식 정확도 보장 X (사용자 검토 필수)

**비용:**
- Claude API 등 외부 LLM 호출 비용 (예: $0.01~0.05/건)
- 향후 유료 기능 검토

**4단계 후반 작업:**
- 4단계 첫 출시 시 미포함
- 4단계 패치 (4.1 버전)로 추가

#### F4-14. 데이터 내보내기 (CSV/JSON)

**설명:** 사용자가 본인 가족의 데이터를 CSV 또는 JSON 형식으로 내보내기.

**내보낼 수 있는 데이터:**
- 청구 이력 (전체 또는 기간 지정)
- 임시 항목·메모
- 추가 용돈 요청 이력
- 미수금·차감 이력
- 영수증 (ZIP으로 묶음)

**내보내기 형식:**

##### CSV
- 청구 이력 1건 = 1행
- 컬럼: 일자, 자녀, 청구액, 상태, 지급액, 미수금, 비고
- 한글 인코딩 UTF-8 (Excel용 BOM 포함)

##### JSON
- 전체 데이터 트리 구조
- 가족 / 자녀 / 청구 / 항목 계층

**내보내기 화면:**
```
┌─ 데이터 내보내기 ────────────────────┐
│                                        │
│ 형식                                   │
│  ●CSV (Excel)  ○JSON  ○PDF           │
│                                        │
│ 기간                                   │
│  [2026-01-01] ~ [2026-12-31]          │
│                                        │
│ 포함 항목                               │
│  ☑ 청구 이력                           │
│  ☑ 임시 항목                           │
│  ☑ 추가 용돈                           │
│  ☑ 미수금/차감                         │
│  ☐ 영수증 (ZIP, 추가 시간 소요)         │
│                                        │
│           [내보내기]                    │
└────────────────────────────────────────┘
```

**보안:**
- 다운로드 링크는 1회용, 1시간 유효
- 비밀번호 재확인 후 진행
- 내보내기 이력은 감사 로그에 기록

**용도 예시:**
- 세무 자료 (자녀 소득 공제 등)
- 데이터 백업
- 이전 (다른 시스템으로)

#### F4-15. 에러 처리 정책 + 사용자 안내

**설명:** 일반 공개 시 다양한 에러 상황에 대한 일관된 안내.

**에러 카테고리:**

| 카테고리 | 예시 | 처리 |
|---|---|---|
| 네트워크 | 인터넷 끊김, 서버 다운 | 로컬 캐시 활용 + 재시도 안내 |
| 인증 | 토큰 만료, 권한 없음 | 재로그인 안내 |
| 검증 | 입력값 오류 | 인라인 에러 + 수정 안내 |
| 충돌 | 동시 편집 | 새로고침 안내 (F4-5) |
| 시스템 | DB 오류, 내부 오류 | 죄송 메시지 + 문의 안내 |
| 한도 | 인원/용량 초과 | 명시적 안내 |

**에러 화면 표준:**
```
┌─ 일시적 오류 ─────────────────────────┐
│                                        │
│  😣                                    │
│  앗, 일시적인 오류가 발생했습니다.     │
│                                        │
│  잠시 후 다시 시도해주세요.            │
│                                        │
│  오류 코드: NET-503-2026050100923       │
│                                        │
│      [다시 시도] [문의하기]            │
└────────────────────────────────────────┘
```

**오프라인 처리:**
- 작성 중인 청구는 로컬 임시 저장
- 네트워크 복구 시 자동 동기화
- 오프라인 알림 띠 (상단 "오프라인 모드" 안내)

**자동 재시도:**
- API 호출 실패 시 자동 재시도 (최대 3회, 지수 백오프)
- 재시도 실패 시 사용자에게 안내

**에러 로깅:**
- 사용자 측: 마지막 100개 에러 로컬 저장
- 서버 측: 모든 에러 중앙 로깅 (Sentry 등)
- 사용자가 [문의하기] 시 자동 첨부 (옵션)

#### F4-16. 사용자 문의 채널

**설명:** 사용자가 버그 신고·문의를 남길 수 있는 채널.

**문의 채널:**
1. **앱 내 문의 폼**
   - 카테고리: 버그 / 기능 요청 / 사용법 / 기타
   - 제목 + 내용
   - 첨부파일 (선택)
   - 자동 첨부: 사용자 정보, 가족 ID, 마지막 에러 로그
2. **이메일 직접 발송**
   - support@allowance.app 등
3. **FAQ 페이지**
   - 자주 묻는 질문
   - 사용법 안내

**문의 화면:**
```
┌─ 문의하기 ───────────────────────────┐
│                                        │
│ 카테고리                                │
│  ●버그 신고                              │
│  ○기능 요청                              │
│  ○사용법 문의                            │
│  ○기타                                   │
│                                        │
│ 제목                                   │
│  [_________________________________]   │
│                                        │
│ 내용 (1000자 이내)                      │
│  ┌────────────────────────────┐        │
│  │                            │        │
│  └────────────────────────────┘        │
│                                        │
│ 첨부 (선택, 최대 5MB)                   │
│  [+ 파일 추가]                          │
│                                        │
│ ☑ 시스템 정보 자동 첨부 (권장)           │
│                                        │
│           [문의 보내기]                  │
└────────────────────────────────────────┘
```

**처리 흐름:**
- 문의 송신 시 사용자에게 접수 번호 발급
- 운영팀 이메일로 자동 전달
- 답변은 사용자 이메일로 발송
- 답변 SLA: 영업일 기준 3일 이내

**FAQ 페이지:**
- 회원가입·로그인
- 가족 만들기·합류
- 청구·승인 흐름
- 결제 (해당 사항 없음)
- 데이터 보안

---

### 11.3 4단계 화면 설계

#### 11.3.1 가족 구성원 관리

(위 F4-1 참조)

#### 11.3.2 부분 승인 검토

(위 F4-6 참조)

#### 11.3.3 통계 대시보드

(위 F4-12 참조)

#### 11.3.4 데이터 내보내기

(위 F4-14 참조)

#### 11.3.5 알림 설정

(위 F4-11 참조)

#### 11.3.6 문의 폼

(위 F4-16 참조)

---

### 11.4 4단계 예외 처리

| 상황 | 처리 |
|---|---|
| 만 14세 미만 가입 시도 | 부모 동의 절차로 안내 |
| 만 18세 도달 자녀 | 졸업 절차 안내 |
| 부모 동시 처리 충돌 | 낙관적 락 + 새로고침 안내 |
| 항목별 거절 시 모든 항목 거절 | 전체 거절로 자동 전환 |
| 영수증 용량 초과 | 사전 경고 + 자동 압축 또는 차단 |
| PDF 학사일정 인식 실패 | 부분 인식 결과 + 수동 입력 안내 |
| 데이터 내보내기 실패 | 재시도 + 문의 안내 |
| 탈퇴 후 30일 내 복구 시도 | 비밀번호 인증 후 복구 처리 |
| 가족 해체 시 부모 1명만 동의 | 다른 부모 동의 대기 표시 |

---

### 11.5 4단계 검증 기준

#### 출시 가능 조건
- [ ] 가족 구성원 관리 (탈퇴, 18세 졸업) 정상
- [ ] 14세 미만 가입 절차 정상 (테스트)
- [ ] 데이터 삭제·탈퇴 정상 (30일 유예 포함)
- [ ] 부분 승인·거절 정상
- [ ] 영수증 첨부·조회 정상
- [ ] 통계 그래프 정상
- [ ] 데이터 내보내기 정상
- [ ] 알림 다각화 정상 (인앱·이메일·푸시)
- [ ] 에러 처리 일관성
- [ ] 문의 채널 정상
- [ ] 보안·법적 검증 통과

#### 측정 지표
- 가입 → 첫 청구 완료율: 70% 이상
- 월 활성 사용자 (MAU) 유지율: 70% 이상
- 문의 답변 SLA 준수율: 95% 이상
- 보안 사고: 0건

---

### 11.6 4단계 사용 후 검증 사항

- 일반 사용자가 자력으로 가입·사용 가능한가
- 만 14세 미만 가족이 실제로 사용 가능한가
- 데이터 탈퇴 절차가 명확한가
- 운영팀이 부담 없이 문의 처리 가능한가
- 추가 기능 우선순위 (5단계 검토)

---
## 12. 데이터 모델

### 12.1 설계 원칙

#### 원칙 1. 단계 간 호환성 (P-03)
- 1단계 데이터는 2단계로 손실 없이 마이그레이션
- 2단계 데이터는 3단계로 손실 없이 마이그레이션
- 3단계 → 4단계는 신규 필드 추가만, 기존 변경 없음

#### 원칙 2. 확장성 우선
- 1단계부터 4단계까지 모든 기능을 수용 가능한 스키마
- 단계별 NULL 허용으로 점진적 활성화
- 모든 테이블에 `version` 필드 (낙관적 락 대비)

#### 원칙 3. 감사 가능성
- 모든 핵심 엔티티에 `created_at`, `updated_at`
- 변경 이력은 별도 테이블로 분리

### 12.2 핵심 엔티티

#### Entity. User (사용자)

```yaml
User:
  id: UUID (PK)
  email: string (3단계+, NULL 가능)
  password_hash: string (3단계+, NULL 가능)
  email_verified: boolean (3단계+)
  name: string (필수)
  role: enum [PARENT, CHILD]
  birth_date: date (4단계, NULL 가능, 만 14세 미만 처리용)
  family_id: UUID (FK → Family)

  # 알림 설정
  notification_settings: JSON

  # 메타
  last_login_at: timestamp
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (NULL = 활성, 4단계 탈퇴용)
  version: integer
```

**단계별 활성 필드:**
- 1단계: 사용 안 함 (단일 사용자라 User 개념 없음)
- 2단계: id, name, role, family_id, notification_settings
- 3단계: + email, password_hash, email_verified
- 4단계: + birth_date, deleted_at

#### Entity. Family (가족 그룹)

```yaml
Family:
  id: UUID (PK)
  name: string (가족 이름)
  family_code: string (가족 코드, 12자, 2단계+)

  # 한도
  max_parents: integer (default 2)
  max_children: integer (default 5)

  # 메타
  created_by: UUID (FK → User, 3단계+)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (NULL = 활성)
  version: integer
```

#### Entity. ChildSettings (자녀 기본 설정)

```yaml
ChildSettings:
  id: UUID (PK)
  child_id: UUID (FK → User)

  # 학교
  school_days: array<weekday>     # ["mon","tue","wed","thu","fri"]
  school_fare: integer            # 1160 (원)
  school_round_trip: boolean      # true (왕복)
  school_holiday_attend: boolean  # false (공휴일 등교)

  # 학원
  academy_days: array<weekday>
  academy_fare: integer
  academy_round_trip: boolean
  academy_holiday_attend: boolean

  # 기본 용돈
  base_allowance: integer

  # 메타
  effective_from: date            # 적용 시작일 (학기 변경 시 새 row)
  created_at: timestamp
  updated_at: timestamp
  version: integer
```

**중요 설계 사항:**
- 설정 변경 시 새 row 추가 (기존 row 유지)
- `effective_from` 필드로 어느 시점부터 적용할지 결정
- 과거 청구는 그 시점의 설정값 그대로 보존

#### Entity. CalendarMonth (월별 캘린더 데이터)

```yaml
CalendarMonth:
  id: UUID (PK)
  child_id: UUID (FK → User)
  year: integer
  month: integer (1~12)
  settings_id: UUID (FK → ChildSettings, 적용된 설정 스냅샷)

  # 자동 계산된 데이터 (캐시)
  school_fee_total: integer
  academy_fee_total: integer
  school_attendance_days: integer
  academy_attendance_days: integer

  # 메타
  created_at: timestamp
  updated_at: timestamp
  version: integer
```

**Index:** (child_id, year, month) UNIQUE

#### Entity. ExtraItem (임시 항목)

```yaml
ExtraItem:
  id: UUID (PK)
  calendar_month_id: UUID (FK → CalendarMonth)
  date: date

  category: string                # "체험학습", "교재비" 등
  name: string
  amount: integer
  note: string (NULL 가능)        # 메모 (1셀당 별도 메모는 별도 처리 가능)

  # 4단계 영수증
  receipts: array<Receipt> (4단계+)

  # 메타
  created_by: UUID (FK → User)
  created_at: timestamp
  updated_at: timestamp
  version: integer
```

#### Entity. Memo (셀별 메모)

```yaml
Memo:
  id: UUID (PK)
  calendar_month_id: UUID (FK → CalendarMonth)
  date: date
  content: string (200자)

  created_by: UUID (FK → User)
  created_at: timestamp
  updated_at: timestamp
  version: integer
```

#### Entity. CustomCategory (사용자 정의 카테고리)

```yaml
CustomCategory:
  id: UUID (PK)
  family_id: UUID (FK → Family)
  name: string
  icon: string (이모지)
  created_by: UUID (FK → User)
  created_at: timestamp
```

#### Entity. Allowance (청구) ★핵심

```yaml
Allowance:
  id: UUID (PK)
  child_id: UUID (FK → User)
  year: integer
  month: integer

  # 상태 머신
  status: enum [DRAFT, SUBMITTED, APPROVED, REJECTED,
                RESUBMITTED, PAID_PENDING, COMPLETED,
                PAYMENT_DISPUTED, CANCELLED, EXPIRED,
                PARTIALLY_APPROVED]

  # 청구 내역 (스냅샷)
  base_amount: integer            # 기본 용돈
  school_fee: integer
  school_days: integer
  academy_fee: integer
  academy_days: integer
  extra_items_total: integer      # 임시 항목 합계
  extra_allowance_total: integer  # 추가 용돈 합계
  carryover_amount: integer       # 미수금
  deduction_amount: integer       # 차감
  total_amount: integer           # 최종 합계

  # 송신/검토 메타
  submitted_at: timestamp
  submission_memo: string (500자)

  reviewed_at: timestamp
  reviewed_by: UUID (FK → User)
  rejection_reason: string (NULL 가능)
  parent_response: string (500자, NULL 가능)

  # 지급 메타
  paid_at: timestamp
  paid_by: UUID (FK → User)
  paid_amount: integer            # 실제 송금액
  payment_method: enum [KAKAO, BANK, CASH, OTHER, NULL]
  payment_note: string

  # 수령 확인 메타
  received_at: timestamp
  received_by_child: boolean

  # 4단계 추가
  partial_approval_data: JSON     # 항목별 승인/거절 정보
  rejection_expires_at: timestamp # F4-8 거절 만료

  # 메타
  created_at: timestamp
  updated_at: timestamp
  version: integer
```

#### Entity. AllowanceItem (청구 내역 항목)

```yaml
AllowanceItem:
  id: UUID (PK)
  allowance_id: UUID (FK → Allowance)

  type: enum [BASE, SCHOOL_FARE, ACADEMY_FARE, EXTRA, EXTRA_ALLOWANCE,
              CARRYOVER, DEDUCTION]
  description: string
  amount: integer
  metadata: JSON                  # 항목별 부가 정보

  # 4단계 부분 승인
  approval_status: enum [APPROVED, REJECTED, PENDING] (4단계+)
  rejection_reason: string (4단계+)
```

#### Entity. ExtraAllowanceRequest (추가 용돈 요청)

```yaml
ExtraAllowanceRequest:
  id: UUID (PK)
  child_id: UUID (FK → User)
  category: string
  name: string
  amount: integer
  expected_date: date
  reason: string (300자)

  # 처리 옵션
  process_type: enum [IMMEDIATE, NEXT_MONTH]

  # 상태
  status: enum [REQUESTED, APPROVED, REJECTED, USED]

  # 검토 메타
  reviewed_at: timestamp
  reviewed_by: UUID
  rejection_reason: string

  # 4단계 영수증
  receipts: array<Receipt> (4단계+)

  created_at: timestamp
  updated_at: timestamp
  version: integer
```

#### Entity. Carryover (미수금)

```yaml
Carryover:
  id: UUID (PK)
  child_id: UUID (FK → User)
  source_allowance_id: UUID (FK → Allowance)  # 미수금 발생 청구
  amount: integer                             # 미수 금액
  status: enum [PENDING, APPLIED, CANCELLED]
  applied_to_allowance_id: UUID (NULL 가능)   # 적용된 청구

  created_at: timestamp
  updated_at: timestamp
  version: integer
```

#### Entity. Deduction (차감)

```yaml
Deduction:
  id: UUID (PK)
  child_id: UUID (FK → User)
  reason: string (100자)
  amount: integer
  applied_month: date             # 적용 월 (yyyy-mm-01)

  status: enum [PENDING, APPLIED, CANCELLED]
  applied_to_allowance_id: UUID (NULL 가능)

  created_by: UUID (FK → User)
  created_at: timestamp
  updated_at: timestamp
  version: integer
```

#### Entity. Receipt (영수증, 4단계)

```yaml
Receipt:
  id: UUID (PK)
  parent_type: enum [EXTRA_ITEM, EXTRA_ALLOWANCE]
  parent_id: UUID

  file_url: string                # S3 URL
  file_name: string
  file_size: integer
  mime_type: string
  uploaded_by: UUID (FK → User)
  uploaded_at: timestamp

  # 보관 정책
  expires_at: timestamp           # 1년 후 자동 삭제 default
  is_permanent: boolean           # 영구 보관 여부
```

#### Entity. Notification (알림)

```yaml
Notification:
  id: UUID (PK)
  user_id: UUID (FK → User)
  family_id: UUID (FK → Family)

  type: enum [ALLOWANCE_SUBMITTED, ALLOWANCE_APPROVED, ALLOWANCE_REJECTED,
              PAYMENT_COMPLETED, PAYMENT_RECEIVED, EXTRA_REQUESTED,
              DEDUCTION_ADDED, MONTH_END_REMINDER, etc.]
  title: string
  message: string
  related_entity_type: string
  related_entity_id: UUID

  # 채널별 발송 상태
  in_app_read: boolean
  email_sent: boolean
  push_sent: boolean (4단계+)

  created_at: timestamp
```

#### Entity. Invitation (초대)

```yaml
Invitation:
  id: UUID (PK)
  family_id: UUID (FK → Family)
  invited_by: UUID (FK → User)

  invitation_type: enum [CODE, EMAIL]
  invitee_email: string (NULL 가능)
  intended_role: enum [PARENT, CHILD]
  custom_message: string (NULL 가능)

  status: enum [PENDING, ACCEPTED, REJECTED, EXPIRED]
  token: string (UUID)            # 1회용 토큰
  expires_at: timestamp           # 7일 후 default

  accepted_at: timestamp (NULL 가능)
  accepted_by: UUID (NULL 가능)

  created_at: timestamp
```

#### Entity. AuditLog (감사 로그, 4단계)

```yaml
AuditLog:
  id: UUID (PK)
  family_id: UUID (FK → Family)
  user_id: UUID (FK → User)

  action: string                  # "ALLOWANCE_SUBMITTED" 등
  entity_type: string
  entity_id: UUID

  # 변경 데이터
  before_data: JSON
  after_data: JSON

  # 컨텍스트
  ip_address: string
  user_agent: string

  created_at: timestamp           # 영구 보관 후 익명화
```

#### Entity. UserConsent (약관 동의 이력)

```yaml
UserConsent:
  id: UUID (PK)
  user_id: UUID (FK → User)

  consent_type: enum [TOS, PRIVACY, MARKETING, MINOR_GUARDIAN]
  version: string                 # 약관 버전
  consented_at: timestamp
  withdrawn_at: timestamp (NULL 가능)

  # 14세 미만 부모 동의
  guardian_user_id: UUID (NULL 가능)
```

#### Entity. Inquiry (사용자 문의, 4단계)

```yaml
Inquiry:
  id: UUID (PK)
  user_id: UUID (FK → User, NULL 가능 - 비회원)
  ticket_number: string

  category: enum [BUG, FEATURE_REQUEST, USAGE, OTHER]
  title: string
  content: string (1000자)
  attachments: array<URL>
  system_info: JSON (자동 첨부)

  status: enum [SUBMITTED, IN_PROGRESS, RESOLVED, CLOSED]

  resolved_at: timestamp
  resolution_note: string

  created_at: timestamp
  updated_at: timestamp
```

### 12.3 ER 관계도 (요약)

```
User ─── 1:1 ── ChildSettings (자녀만)
User ─── M:1 ── Family
Family ── 1:M ── User
Family ── 1:M ── Invitation
Family ── 1:M ── AuditLog (4단계)

User(child) ─ 1:M ─ CalendarMonth
CalendarMonth ─ 1:M ─ ExtraItem
CalendarMonth ─ 1:M ─ Memo

User(child) ─ 1:M ─ Allowance
Allowance ─── 1:M ── AllowanceItem

User(child) ─ 1:M ─ ExtraAllowanceRequest
User(child) ─ 1:M ─ Carryover
User(child) ─ 1:M ─ Deduction

ExtraItem ── 1:M ── Receipt (4단계)
ExtraAllowanceRequest ── 1:M ── Receipt (4단계)

User ── 1:M ── Notification
User ── 1:M ── UserConsent
User ── 1:M ── Inquiry (4단계)
```

### 12.4 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|---|---|---|
| User | email (UNIQUE, 3단계) | 로그인 |
| User | family_id | 가족 구성원 조회 |
| Family | family_code (UNIQUE, 2단계) | 가족 합류 |
| Allowance | (child_id, year, month) | 월별 청구 조회 |
| Allowance | status | 청구함 조회 |
| Allowance | (family_id, status) | 부모 청구함 |
| CalendarMonth | (child_id, year, month) UNIQUE | 캘린더 조회 |
| Notification | (user_id, in_app_read) | 알림함 |
| AuditLog | (family_id, created_at DESC) | 감사 로그 조회 |

---

## 13. 시스템 설계 (아키텍처)

### 13.1 단계별 아키텍처

#### 1단계: 단일 페이지 앱 (SPA)

```
┌─────────────────────────────────┐
│  사용자 브라우저                  │
│                                 │
│  HTML + JS + CSS (단일 파일)    │
│  ↕                              │
│  로컬스토리지                    │
│                                 │
│  외부 통신: 없음                 │
└─────────────────────────────────┘
```

**기술 스택:**
- HTML5 / Vanilla JS 또는 경량 React
- CSS (Tailwind 또는 Vanilla)
- 로컬스토리지 API
- 한국 공휴일 데이터 (정적 JSON 임베드)

**배포:** GitHub Pages 또는 단일 HTML 파일

#### 2단계: SPA + 백엔드

```
┌─────────────────┐
│  사용자 브라우저 │
│  (자녀/부모)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Frontend SPA   │
│  (React + Vite) │
└────────┬────────┘
         │ REST/GraphQL
         ▼
┌─────────────────┐
│  Backend API    │
│  (Express)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────┐  ┌──────┐
│ DB   │  │이메일│
│MySQL │  │서비스│
└──────┘  └──────┘
```

**기술 스택:**
- Frontend: React 18 + Vite + TypeScript
- Backend: Node.js (Express + Prisma)
- DB: MySQL
- 이메일: SendGrid / AWS SES
- 호스팅: Vercel (Frontend) + AWS / GCP (Backend)

#### 3단계: 보안·인증 강화

2단계 구조 + 다음 추가:
- **인증 서비스**: JWT 발급/검증
- **이메일 인증 워커**: 백그라운드 잡
- **비밀번호 해싱**: bcrypt (server side)
- **HTTPS 강제 + Helmet 미들웨어**
- **레이트 리미터**: 로그인 시도 제한

#### 4단계: 풀스택 운영

3단계 구조 + 다음 추가:
- **파일 스토리지**: S3 호환 (영수증)
- **푸시 서비스**: Web Push (PWA)
- **LLM API**: Claude API (PDF 인식)
- **모니터링**: Sentry + 로깅
- **CI/CD**: GitHub Actions + 자동 배포

### 13.2 API 설계 원칙

#### RESTful 엔드포인트

```
GET    /api/family/:id              # 가족 조회
POST   /api/family                   # 가족 생성
PATCH  /api/family/:id               # 가족 수정

GET    /api/users/:id                # 사용자 조회
PATCH  /api/users/:id                # 사용자 수정

GET    /api/children/:id/settings    # 자녀 설정
PATCH  /api/children/:id/settings    # 자녀 설정 변경

GET    /api/calendar/:childId/:year/:month   # 월별 캘린더
PATCH  /api/calendar/:childId/:year/:month   # 임시 항목 수정

GET    /api/allowances              # 청구 목록 (필터링)
POST   /api/allowances              # 청구 작성
GET    /api/allowances/:id          # 청구 상세
PATCH  /api/allowances/:id          # 청구 수정 (작성중만)
POST   /api/allowances/:id/submit   # 청구 송신
POST   /api/allowances/:id/approve  # 부모 승인
POST   /api/allowances/:id/reject   # 부모 거절
POST   /api/allowances/:id/pay      # 부모 지급 표시
POST   /api/allowances/:id/receive  # 자녀 수령 확인

GET    /api/extra-requests          # 추가 용돈 요청 목록
POST   /api/extra-requests          # 추가 용돈 요청
POST   /api/extra-requests/:id/approve  # 승인

GET    /api/carryovers              # 미수금 조회
POST   /api/deductions              # 차감 입력
PATCH  /api/deductions/:id          # 차감 수정/취소

GET    /api/notifications           # 알림함
POST   /api/notifications/read      # 읽음 표시

POST   /api/auth/register           # 회원가입 (3단계+)
POST   /api/auth/login              # 로그인 (3단계+)
POST   /api/auth/logout             # 로그아웃 (3단계+)
POST   /api/auth/forgot-password    # 비밀번호 재설정 (3단계+)
POST   /api/auth/verify-email       # 이메일 인증 (3단계+)

POST   /api/invitations             # 초대 생성 (3단계+)
POST   /api/invitations/:id/accept  # 초대 수락 (3단계+)

GET    /api/audit-logs              # 감사 로그 (4단계+)
GET    /api/statistics              # 통계 (4단계+)
POST   /api/exports                 # 데이터 내보내기 (4단계+)
POST   /api/inquiries               # 문의 (4단계+)
```

#### 응답 형식

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "version": 5,
    "timestamp": "2026-05-01T09:23:00Z"
  }
}
```

#### 에러 형식

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ALLOWANCE_NOT_FOUND",
    "message": "청구를 찾을 수 없습니다",
    "details": { ... }
  },
  "meta": { ... }
}
```

### 13.3 권한 모델

#### RBAC (Role-Based Access Control)

| 역할 | 권한 |
|---|---|
| **부모** (PARENT) | - 가족 모든 자녀 데이터 조회<br>- 청구 승인/거절/지급 표시<br>- 차감 입력<br>- 가족 구성원 관리 (4단계)<br>- 통계 조회 |
| **자녀** (CHILD) | - 본인 데이터만 조회/수정<br>- 청구 작성/송신<br>- 수령 확인<br>- 추가 용돈 요청<br>- 본인 통계만 조회 |

#### 행 단위 권한 (Row-Level Security)

```sql
-- 자녀는 본인 청구만 조회
SELECT * FROM allowances
WHERE child_id = :current_user_id;

-- 부모는 가족 모든 청구 조회
SELECT * FROM allowances
WHERE child_id IN (
  SELECT id FROM users WHERE family_id = :current_family_id
);
```

### 13.4 동시성 처리

#### 낙관적 락 (Optimistic Locking)

모든 핵심 엔티티에 `version` 필드. 변경 시:
```sql
UPDATE allowances
SET status = 'APPROVED', version = version + 1
WHERE id = :id AND version = :client_version;
```

업데이트된 행이 0이면 충돌 → 클라이언트에 재시도 안내.

#### 트랜잭션 단위

- 청구 송신: Allowance + AllowanceItem 한 트랜잭션
- 부모 승인 + 부모 알림 + 자녀 알림: 한 트랜잭션
- 마이그레이션: 배치 트랜잭션

---
## 14. 비기능 요구사항 (NFR)

### 14.1 성능

| 항목 | 목표 | 단계 |
|---|---|---|
| 페이지 로딩 (First Contentful Paint) | 2초 이내 | 1단계+ |
| 캘린더 렌더링 | 0.5초 이내 | 1단계+ |
| API 응답 (P95) | 500ms 이내 | 2단계+ |
| 청구 송신 처리 | 2초 이내 | 2단계+ |
| 동시 사용자 수용 | 100명 | 3단계 |
| 동시 사용자 수용 | 10,000명 | 4단계 |
| DB 쿼리 (P95) | 100ms 이내 | 2단계+ |

### 14.2 가용성

| 항목 | 목표 | 단계 |
|---|---|---|
| 가동시간 (Uptime) | 99% | 2~3단계 |
| 가동시간 (Uptime) | 99.5% | 4단계 |
| 계획 유지보수 알림 | 24시간 전 | 4단계 |
| 백업 주기 | 일 1회 | 2단계+ |
| 백업 보관 기간 | 30일 | 2단계+ |
| 복구 시간 (RTO) | 4시간 | 4단계 |
| 복구 시점 (RPO) | 24시간 | 4단계 |

### 14.3 보안

| 항목 | 요구사항 | 단계 |
|---|---|---|
| HTTPS | 모든 통신 강제 | 2단계+ |
| 비밀번호 해싱 | bcrypt 12 rounds | 3단계+ |
| 세션 관리 | JWT + 만료 정책 | 3단계+ |
| CSRF 방어 | 모든 변경 요청 토큰 검증 | 3단계+ |
| XSS 방어 | 입력 sanitize, output escape | 3단계+ |
| SQL Injection | Prepared Statement 강제 | 2단계+ |
| 감사 로그 | 핵심 이벤트 영구 기록 | 4단계 |
| 침해사고 대응 | 24시간 내 사용자 알림 | 4단계 |
| 정기 보안 검토 | 분기 1회 | 4단계 |

### 14.4 확장성

| 항목 | 요구사항 |
|---|---|
| 수평 확장 | Backend 서버 N+1 가능 (Stateless) |
| DB 확장 | Read Replica 추가 가능 |
| 파일 스토리지 | S3 호환 외부 서비스 사용 (4단계) |
| API 버저닝 | URL 기반 (/api/v1, /api/v2) 4단계+ |

### 14.5 사용성

| 항목 | 요구사항 | 단계 |
|---|---|---|
| 반응형 디자인 | 768px 분기 (모바일/PC) | 1단계+ |
| 접근성 | WCAG 2.1 Level AA | 4단계 |
| 한국어 지원 | 필수 | 1단계+ |
| 다국어 지원 | 보류 (확장성만 확보) | - |
| 다크 모드 | 보류 | - |
| 키보드 네비게이션 | 4단계 |
| 화면 리더 호환 | 4단계 |

### 14.6 호환성

| 환경 | 지원 | 단계 |
|---|---|---|
| Chrome | 최신 2개 버전 | 1단계+ |
| Safari | 최신 2개 버전 | 1단계+ |
| Edge | 최신 2개 버전 | 1단계+ |
| Firefox | 최신 2개 버전 | 1단계+ |
| iOS Safari | iOS 15+ | 1단계+ |
| Android Chrome | Android 10+ | 1단계+ |

### 14.7 법적 / 규제 준수

| 항목 | 요구사항 | 단계 |
|---|---|---|
| 개인정보보호법 (한국) | 약관 동의, 처리 동의, 탈퇴 권리 | 3단계+ |
| 만 14세 미만 보호 | 법정대리인 동의 | 4단계 |
| 정보통신망법 | 마케팅 수신 별도 동의 | 3단계+ |
| GDPR (해외 진출 시) | 보류 | - |
| 데이터 보관 의무 | 거래 기록 5년 | 3단계+ |

---

## 15. 일정 및 마일스톤

### 15.1 전체 로드맵

```
2026-05 ──┬── 1단계 개발 시작
2026-06 ──┴── 1단계 출시 (1~2주)
              본인 검증 1~2개월
2026-07 ──┬── 2단계 개발 시작
2026-08 ──┤
2026-09 ──┴── 2단계 출시 (4~5주)
              가족 검증 2~3개월
2026-10 ──┬── 3단계 개발 시작
2026-11 ──┴── 3단계 출시 (3~4주)
              베타 검증 1~2개월
2027-01 ──┬── 4단계 개발 시작
2027-02 ──┤
2027-03 ──┴── 4단계 출시 (5~7주)
              정식 출시
```

**총 개발 기간:** 약 4~5개월 (검증 기간 별도)

### 15.2 단계별 마일스톤

#### 1단계 마일스톤 (1~2주)

| 주차 | 작업 |
|---|---|
| Week 1 | 자녀 기본 설정 + 캘린더 자동 표시 + 정산표 |
| Week 1 (후반) | 임시 항목 + 비고 + 메시지 복사 |
| Week 2 | 미래 달 + 로컬 저장 + 설정 변경 + 테스트 |
| Week 2 (후반) | 출시 |

#### 2단계 마일스톤 (4~5주)

| 주차 | 작업 |
|---|---|
| Week 1 | 백엔드 인프라 + DB 모델 + 가족 코드 인증 |
| Week 2 | 자녀 청구 작성 + 송신 + 부모 검토 |
| Week 3 | 거절·재청구 + 지급·수령 확인 + 청구 이력 |
| Week 4 | 추가 용돈 + 부분 입금 + 차감 |
| Week 5 | 알림 시스템 + 메모 + 미리보기 + 1단계 마이그레이션 + 테스트 |
| Week 5 (후반) | 출시 |

#### 3단계 마일스톤 (3~4주)

| 주차 | 작업 |
|---|---|
| Week 1 | 회원가입 + 로그인 + 비밀번호 정책 |
| Week 2 | 이메일 인증 + 비밀번호 재설정 + 계정 정보 수정 |
| Week 3 | 가족 그룹 정식화 + 이메일 초대 + 약관 |
| Week 4 | 2→3단계 마이그레이션 + 보안 강화 + 테스트 |
| Week 4 (후반) | 출시 |

#### 4단계 마일스톤 (5~7주)

| 주차 | 작업 |
|---|---|
| Week 1 | 가족 구성원 관리 + 14세 미만 동의 + 데이터 탈퇴 |
| Week 2 | 부분 승인/거절 + 청구 임시저장 + 거절 자동 만료 |
| Week 3 | 영수증 첨부 + 한도 경고 + 알림 다각화 (푸시) |
| Week 4 | 통계 + 그래프 + 데이터 내보내기 |
| Week 5 | 감사 로그 + 부모 동시 처리 충돌 + 에러 처리 |
| Week 6 | 문의 채널 + 운영 도구 + 부하 테스트 |
| Week 7 (선택) | PDF 학사일정 자동 인식 (4.1 패치) |
| Week 7 | 출시 |

### 15.3 검증 지점 (Go/No-Go)

각 단계 출시 전 다음을 충족해야 다음 단계로 진행:

#### 1단계 → 2단계 진입 조건
- [ ] 1~2개월 본인 사용 후 본인이 "있어야 한다"고 판단
- [ ] 빠진 기능 / 불편한 기능 목록화
- [ ] 1단계 데이터 마이그레이션 설계 완료

#### 2단계 → 3단계 진입 조건
- [ ] 가족 4명 2~3개월 안정 사용
- [ ] 거절율 30% 이하
- [ ] 자녀 수령 확인율 95% 이상
- [ ] 다른 가족이 사용해보고 싶어한다는 시그널

#### 3단계 → 4단계 진입 조건
- [ ] 베타 가족 2~3팀 1~2개월 안정 사용
- [ ] 보안 검토 통과
- [ ] 마이그레이션 후 데이터 정합성 100%
- [ ] 정식 출시에 필요한 4단계 기능 우선순위 명확

#### 4단계 정식 출시 조건
- [ ] 부하 테스트 (동시 100명) 통과
- [ ] 보안 점검 통과 (취약점 외부 진단 권고)
- [ ] 법적 검토 (약관, 개인정보처리방침)
- [ ] 운영팀 준비 (문의 응대 SLA)
- [ ] 백업·복구 절차 검증

---

## 16. 리스크 관리

### 16.1 기술 리스크

| 리스크 | 가능성 | 영향 | 완화 방안 |
|---|---|---|---|
| 1단계 데이터 마이그레이션 실패 | 중 | 중 | 마이그레이션 전 백업, dry-run 테스트 |
| 부모 동시 처리 충돌 빈발 | 중 | 중 | 낙관적 락 + UX 안내 (4단계 F4-5) |
| 영수증 스토리지 비용 증가 | 중 | 저 | 1년 자동 삭제, 가족당 1GB 한도 |
| LLM API 비용 (PDF 인식) | 중 | 중 | 가족당 월 10회 한도, 향후 유료 검토 |
| DB 성능 (동시 사용자 증가) | 저 | 중 | Read Replica, 인덱스 최적화 |
| 푸시 알림 지원 (PWA) | 중 | 저 | iOS 호환성 검증 (16.4+) |

### 16.2 사용자 리스크

| 리스크 | 가능성 | 영향 | 완화 방안 |
|---|---|---|---|
| 자녀가 청구 부풀리기 | 저 | 저 | P-01 원칙 (평균 일괄), 변경 이력 (P-02) |
| 부모가 청구 거절 남발 | 저 | 중 | 거절율 통계 모니터링 (4단계) |
| 가족 분쟁 (이혼, 별거) 시 데이터 처리 | 저 | 고 | 4단계 가족 해체 절차 |
| 자녀가 가족 코드 외부 노출 | 중 | 중 | 부모가 재발급 가능 (F2-10) |
| 부모님 IT 친숙도 낮음 | 중 | 중 | 단계별 가이드 + 직관적 UI |

### 16.3 사업 리스크

| 리스크 | 가능성 | 영향 | 완화 방안 |
|---|---|---|---|
| 사용자 미확보 (다른 가족 안 씀) | 중 | 중 | 1·2단계는 본인 사용 우선, 3·4단계로 확장 시 베타 검증 |
| 핀테크 앱 (아이쿠카 등)이 유사 기능 추가 | 중 | 중 | 차별점 (캘린더 자동 산정, 컴팩트) 유지 |
| 운영 비용 (서버, 이메일, LLM) | 중 | 중 | 무료 사용자 한도 정책, 향후 유료 플랜 |
| 법적 분쟁 (개인정보) | 저 | 고 | 약관·처리방침 외부 검토, 14세 미만 강화 |

### 16.4 일정 리스크

| 리스크 | 가능성 | 영향 | 완화 방안 |
|---|---|---|---|
| 1단계 길어짐 | 저 | 저 | 가벼운 범위 유지, 2주 내 출시 강제 |
| 2단계 양방향 흐름 복잡 | 중 | 중 | 핵심 흐름 우선, 부가 기능 4단계로 |
| 3단계 마이그레이션 지연 | 중 | 중 | 6개월 병행 운영 정책 |
| 4단계 PDF 인식 미완성 | 중 | 저 | 4.1 패치로 별도 출시 |

### 16.5 리스크 모니터링

- 각 단계 출시 후 매주 회고
- 주요 KPI 모니터링: 사용자 수, 청구 처리 시간, 거절율, 미수금
- 분기별 리스크 평가 갱신

---

## 17. 미결정 사항

### 17.1 기술 결정

| 항목 | 옵션 | 결정 시점 |
|---|---|---|
| Frontend 프레임워크 | Vanilla JS / React | 1단계 시작 시 |
| Backend 프레임워크 | Express / Fastify / NestJS | 2단계 시작 시 |
| DB | MySQL / PostgreSQL | 2단계 시작 시 |
| ORM | Prisma / TypeORM / Raw | 2단계 시작 시 |
| 호스팅 | Vercel / AWS / GCP | 2단계 시작 시 |
| 이메일 서비스 | SendGrid / AWS SES / Mailgun | 2단계 후반 |
| 파일 스토리지 | AWS S3 / Cloudflare R2 | 4단계 시작 시 |
| LLM API | Claude / OpenAI | 4단계 후반 |
| 모니터링 | Sentry / Datadog | 4단계 시작 시 |

### 17.2 정책 결정

| 항목 | 결정 시점 | 비고 |
|---|---|---|
| 부모 동시 처리 충돌 정책 디테일 | 4단계 시작 시 | F4-5 |
| 자녀 18세 이상 시 데이터 처리 | 4단계 | F4-1 |
| 가족 그룹 해체 시 데이터 보관 기간 | 4단계 | F4-2 (기본 30일 유예) |
| 추가 용돈 한도 정책 디테일 | 4단계 시작 시 | F4-10 |
| 영수증 보관 기간 | 4단계 시작 시 | 기본 1년 |
| 푸시 알림 적용 여부 (iOS 호환성) | 4단계 시작 시 | F4-11 |
| 알림 채널 추가 (카카오 알림톡 등) | 4단계 후 | TMS2 활용 가능 |

### 17.3 워크플로우 결정

| 항목 | 결정 시점 |
|---|---|
| 1단계 청구 메시지 템플릿 디자인 변형 | 1단계 시작 시 |
| 거절 자동 만료 시간 (24h 외 옵션) | 4단계 시작 시 |
| 부모 둘 동시 처리 시 자녀 권한 | 2단계 시작 시 |

### 17.4 사업 결정

| 항목 | 결정 시점 |
|---|---|
| 무료 vs 유료 플랜 | 4단계 후반 (출시 후 6개월) |
| 도메인 + 브랜딩 | 3단계 시작 전 |
| 마케팅 전략 | 4단계 출시 전 |
| 운영 인력 | 4단계 출시 전 |

### 17.5 향후 확장 검토 (5단계 이후)

다음은 4단계 출시 후 사용자 피드백 기반 검토:

#### 사용자 요구가 있을 시 추가 검토
- 미션·게이미피케이션
- 집안일 트래킹
- 협의 채팅 (양방향 메시지)
- 검색·필터 강화
- 다크 모드
- 다국어
- 위젯 / 단축
- 오프라인 처리 강화
- 자녀 화면 잠금 PIN
- 자동 청구 (월말 자동 송신)
- 청구 회수 (송신 후 회수)
- 사용 내역 가계부 (자녀 본인 지출 기록)
- 친척·조부모 가족 합류 (확장 가족)
- 부분 지급 % 슬라이더 강화
- 자녀 본인 자금 분배 (Save/Spend/Give 버킷)

---

## 부록 A. 용어 사전

| 용어 | 정의 |
|---|---|
| 청구 (Allowance) | 자녀가 부모에게 보내는 월별 용돈 요청 |
| 청구함 | 부모가 받은 청구 목록 |
| 임시 항목 | 정기 외 비정기 지출 (체험학습 등) |
| 추가 용돈 | 정기 청구와 별도 비정기 요청 (수련회 등) |
| 미수금 | 부분 입금 후 남은 금액 |
| 차감 | 부모가 자녀에게 차감해야 할 금액 |
| 가족 코드 | 가족 그룹 식별 코드 (12자) |
| 정산표 | 청구 내역 합계 표시 |
| 비고 | 캘린더 옆 안내 (요금표, 아이콘 의미) |
| 수령 확인 | 자녀가 송금 받았다는 표시 |

## 부록 B. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-05-01 | 초안 작성, 1~4단계 통합 PRD |
| v2.0 | 2026-05-01 | 1단계를 개발 착수 가능한 상세 수준으로 재작성. 2~4단계는 현 수준 유지. |

---

**문서 끝**
