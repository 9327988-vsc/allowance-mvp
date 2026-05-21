---
name: project-methodology
description: 2026-05-21 New 방법론(HexStack) 전면 적용 — .claude/ 모듈 구조 + BACKLOG/POLICIES/TASK_HISTORY
metadata:
  type: project
---

2026-05-21 New 방법론을 용돈관리 프로젝트에 전면 적용.

**Why:** 안정적 개발 및 효율성 극대화. 포괄적 방법론이 규모별 차등 적용(small/medium/large)을 내장하고 있어 프로젝트 규모와 무관하게 적용 가능.

**How to apply:**
- `.claude/CLAUDE.md` 진입점 + 5개 규칙 모듈 (@import)
- 프로젝트 루트에 `BACKLOG.md`, `TASK_HISTORY.md`, `POLICIES.md`
- 메모리는 repo 내 `memory/` 폴더에 누적 (이식성 확보)
- 프로젝트 선언: MODE=improve, TASK_SCALE=medium(기본), 테스트=vitest
