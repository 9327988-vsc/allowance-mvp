# CLAUDE.md — 용돈관리 프로젝트 개발 방법론

이 파일은 통합 진입점이다. Claude Code는 프로젝트를 열 때 `.claude/CLAUDE.md`를 자동으로 읽는다. 아래 `@import`로 같은 `.claude/` 폴더의 규칙 모듈을 함께 불러온다.

> **폴더 배치**
> - `.claude/` 안: 이 파일 + 규칙 모듈 5개 (`@import` 대상). 평소 건드리지 않는다.
> - 프로젝트 루트: 작업 파일(`BACKLOG.md`·`TASK_HISTORY.md`·`POLICIES.md`)과 `memory/` 폴더.

---

## 항상 활성화되는 규칙 (import)

@PRINCIPLES_KARPATHY.md
@CODING_RULES.md
@OPERATING_PRINCIPLES.md
@HEXSTACK.md
@MEMORY_SYSTEM.md

---

## 우선순위
규칙이 충돌하거나 애매하면 다음 순서로 판단한다.
1. **Karpathy 4원칙** (`PRINCIPLES_KARPATHY.md`) — 최상위
2. **근본 철학 — 안정성·지속성·효율성·최적화** (`CODING_RULES.md`)
3. **3대 규칙 — 800줄·지속개발·보안** (`CODING_RULES.md`)
4. **운영 원칙** (`OPERATING_PRINCIPLES.md`)
5. **HexStack 워크플로우** (`HEXSTACK.md`)

---

## 프로젝트 선언

```
MODE=improve
TASK_SCALE=medium (기본값 — 과업별 재선언)
EDIT_MODE=manual
```

### 테스트 환경
```
- 서버 실행: 불가능 (Claude Code 세션에서 직접 띄우지 않음)
- DB 직접 접근: 불가능 (localStorage 기반 PWA)
- 브라우저 자동화: 불가능
- 테스트 방법: vitest 단위/통합 테스트 + 코드 리뷰 + 정적 분석
```

### 기술 스택
- React 18 + Vite 5 + Tailwind CSS 3
- localStorage 기반 데이터 저장 (mock 백엔드)
- PWA (서비스워커 + manifest)
- vitest + jsdom 테스트

---

## 작업 관리 (프로젝트 루트)
- **`BACKLOG.md`** — 진행 예정·진행 중 과업. 종결 시 제거.
- **`TASK_HISTORY.md`** — 완료·폐기 과업 이력 (관리 일자 + 커밋 해시).
- **`POLICIES.md`** — 항구적 결정 + Phase 로드맵 (정책 #NNN).

반사 행동:
- 사용자가 "이것도 해야 한다"·"과업으로 잡자"라고 하면 → `BACKLOG.md`에 `T-NNN`으로 등록을 먼저 제안한다.
- 과업 완료·폐기 시 → `TASK_HISTORY.md`로 이관 + 관련 커밋 해시 기록을 제안한다.
- "나중에"·"추후 보완" 발화가 나오면 → `POLICIES.md`에 정책으로 먼저 기록을 제안한다.

## 메모리 (프로젝트 루트의 `memory/` 폴더)
- 세션 간 맥락은 루트의 `memory/` 폴더에 누적한다 (`MEMORY_SYSTEM.md` 참조).
- `memory/MEMORY.md`는 인덱스다. 본문은 유형별 개별 파일에 둔다.

## 핵심 자세
- 판단이 걸린 국면에서는 **냉정하게 분석하고 명확하게 결론**을 낸다. 형식적 칭찬·결론 회피·모호한 완충 표현을 피한다.
- 사용자의 설계·코드에 문제가 있으면 근거와 함께 반대 의견을 낸다.
- 변경 전에 영향 범위·롤백 방법·위험도를 먼저 요약한다.
