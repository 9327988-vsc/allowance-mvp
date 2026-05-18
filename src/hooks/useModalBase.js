// src/hooks/useModalBase.js
import { useEffect, useRef } from "react";

// Modal stack: 가장 마지막에 등록된(최상위) 모달만 ESC로 닫힘
const _modalStack = [];

export function useModalBase(onClose, options = {}) {
  const { active = true, noScrollLock = false } = options;
  const contentRef = useRef(null);
  const prevScrollY = useRef(0);
  const prevFocus = useRef(null);
  const stackIdRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Body scroll lock (iOS Safari compatible) — 중첩 시 최초 모달만 lock/unlock
  useEffect(() => {
    if (!active || noScrollLock) return;
    const alreadyLocked = document.body.style.position === 'fixed';
    if (!alreadyLocked) {
      const scrollY = window.scrollY;
      prevScrollY.current = scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    }
    return () => {
      // 다른 활성 모달이 스택에 남아있으면 잠금 유지
      const othersActive = _modalStack.length > 0;
      if (!othersActive) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, prevScrollY.current);
      }
    };
  }, [active, noScrollLock]);

  // Focus management — auto-set tabIndex for focusability
  useEffect(() => {
    if (!active) return;
    prevFocus.current = document.activeElement;
    const el = contentRef.current;
    if (el) {
      if (!el.hasAttribute("tabindex")) {
        el.setAttribute("tabindex", "-1");
      }
      const focusable = el.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (focusable) focusable.focus();
      else el.focus();
    }
    return () => { try { prevFocus.current?.focus(); } catch {} };
  }, [active]);

  // ESC handler — modal stack 기반: 최상위 모달만 ESC 처리
  useEffect(() => {
    if (!active) return;
    const id = Symbol();
    stackIdRef.current = id;
    _modalStack.push(id);

    function handleKey(e) {
      if (e.key === "Escape") {
        const top = _modalStack[_modalStack.length - 1];
        if (top === id) {
          e.stopImmediatePropagation();
          e.preventDefault();
          onCloseRef.current();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      const idx = _modalStack.indexOf(id);
      if (idx >= 0) _modalStack.splice(idx, 1);
    };
  }, [active]);

  // Focus trap
  useEffect(() => {
    if (!active) return;
    const el = contentRef.current;
    if (!el) return;
    function handleTab(e) {
      if (e.key !== "Tab") return;
      const focusables = el.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1']):not([disabled])");
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    el.addEventListener("keydown", handleTab);
    return () => el.removeEventListener("keydown", handleTab);
  }, [active]);

  return contentRef;
}
