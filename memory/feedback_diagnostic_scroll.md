---
name: feedback-diagnostic-scroll
description: DiagnosticScreen 스크롤 문제 — inline style 대신 CSS 클래스 토글 방식 사용
metadata:
  type: feedback
---

body의 overflow/height를 JS inline style로 덮어쓰는 방식은 CSS 우선순위 문제로 불안정하다 (3회 재발).
body.diagnostic-open 클래스 + !important 조합으로 영구 수정함.

**Why:** base.css에서 body에 `height: 100dvh; overflow: hidden`이 적용됨. inline style은 CSS specificity나 다른 스타일 조작과 충돌할 수 있음.

**How to apply:** body의 레이아웃 제약을 해제해야 하는 전체 화면 컴포넌트는 전용 CSS 클래스 + `!important`를 사용하고 JS `classList.add/remove`로 토글할 것. inline style 방식 사용하지 말 것.
