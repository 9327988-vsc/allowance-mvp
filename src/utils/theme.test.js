// src/utils/theme.test.js — theme.js 단위 테스트
import { describe, it, expect, vi, beforeEach } from "vitest";

// reapplyCurrentPrefs 모킹
vi.mock("./userPrefs", () => ({
  reapplyCurrentPrefs: vi.fn(),
}));

import { loadTheme, setTheme, applyTheme, toggleTheme, initTheme } from "./theme";
import { reapplyCurrentPrefs } from "./userPrefs";

describe("theme.js", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  // --- loadTheme ---
  describe("loadTheme", () => {
    it("저장값 없으면 'light' 반환", () => {
      expect(loadTheme()).toBe("light");
    });

    it("저장된 'dark' 값 반환", () => {
      localStorage.setItem("theme_v1", "dark");
      expect(loadTheme()).toBe("dark");
    });

    it("저장된 'light' 값 반환", () => {
      localStorage.setItem("theme_v1", "light");
      expect(loadTheme()).toBe("light");
    });

    it("잘못된 저장값이면 시스템 설정 또는 'light' 반환", () => {
      localStorage.setItem("theme_v1", "invalid");
      expect(loadTheme()).toBe("light");
    });

    it("시스템 다크모드 선호 시 'dark' 반환", () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }));

      expect(loadTheme()).toBe("dark");

      window.matchMedia = originalMatchMedia;
    });
  });

  // --- setTheme ---
  describe("setTheme", () => {
    it("localStorage에 테마 저장", () => {
      setTheme("dark");
      expect(localStorage.getItem("theme_v1")).toBe("dark");
    });

    it("DOM에 data-theme 속성 적용", () => {
      setTheme("dark");
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    it("reapplyCurrentPrefs 호출", () => {
      setTheme("light");
      expect(reapplyCurrentPrefs).toHaveBeenCalled();
    });
  });

  // --- applyTheme ---
  describe("applyTheme", () => {
    it("data-theme 속성을 'dark'로 설정", () => {
      applyTheme("dark");
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    it("data-theme 속성을 'light'로 설정", () => {
      applyTheme("light");
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    it("reapplyCurrentPrefs 호출", () => {
      applyTheme("dark");
      expect(reapplyCurrentPrefs).toHaveBeenCalled();
    });
  });

  // --- toggleTheme ---
  describe("toggleTheme", () => {
    it("light → dark 토글", () => {
      localStorage.setItem("theme_v1", "light");
      const next = toggleTheme();
      expect(next).toBe("dark");
      expect(localStorage.getItem("theme_v1")).toBe("dark");
    });

    it("dark → light 토글", () => {
      localStorage.setItem("theme_v1", "dark");
      const next = toggleTheme();
      expect(next).toBe("light");
      expect(localStorage.getItem("theme_v1")).toBe("light");
    });

    it("토글 후 DOM에 새 테마 적용", () => {
      localStorage.setItem("theme_v1", "light");
      toggleTheme();
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });
  });

  // --- initTheme ---
  describe("initTheme", () => {
    it("저장된 테마로 DOM 적용", () => {
      localStorage.setItem("theme_v1", "dark");
      initTheme();
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    it("저장값 없으면 'light'로 DOM 적용", () => {
      initTheme();
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    it("reapplyCurrentPrefs 호출", () => {
      initTheme();
      expect(reapplyCurrentPrefs).toHaveBeenCalled();
    });
  });
});
