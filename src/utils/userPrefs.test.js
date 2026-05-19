// src/utils/userPrefs.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./authStore", () => ({
  getActiveUser: vi.fn(() => null),
}));
vi.mock("./formatAmount", () => ({
  setAmountFormat: vi.fn(),
}));

import {
  PREF_DEFAULTS,
  ACCENT_PRESETS,
  BG_STYLE_PRESETS,
  FONT_SIZE_SCALES,
  BORDER_STYLE_PRESETS,
  CELL_SIZE_PRESETS,
  loadUserPrefs,
  saveUserPrefs,
  removeUserPrefs,
  applyPrefs,
  reapplyCurrentPrefs,
  clearPrefsOverrides,
} from "./userPrefs";
import { getActiveUser } from "./authStore";
import { setAmountFormat } from "./formatAmount";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  // CSS 변수 초기화
  const root = document.documentElement;
  root.removeAttribute("data-theme");
  root.className = "";
});

describe("PREF_DEFAULTS", () => {
  it("기본 accent는 indigo", () => {
    expect(PREF_DEFAULTS.accent).toBe("indigo");
  });

  it("기본 amount_format은 won", () => {
    expect(PREF_DEFAULTS.amount_format).toBe("won");
  });

  it("기본 animation은 on", () => {
    expect(PREF_DEFAULTS.animation).toBe("on");
  });
});

describe("loadUserPrefs", () => {
  it("userId 없으면 기본값 반환", () => {
    const prefs = loadUserPrefs(null);
    expect(prefs).toEqual(PREF_DEFAULTS);
  });

  it("userId 있지만 저장된 데이터 없으면 기본값 반환", () => {
    const prefs = loadUserPrefs("user1");
    expect(prefs).toEqual(PREF_DEFAULTS);
  });

  it("저장된 설정 병합", () => {
    localStorage.setItem(
      "user_prefs_v1",
      JSON.stringify({ user1: { accent: "blue", font_size: "large" } })
    );
    const prefs = loadUserPrefs("user1");
    expect(prefs.accent).toBe("blue");
    expect(prefs.font_size).toBe("large");
    expect(prefs.animation).toBe("on"); // 기본값 유지
  });

  it("손상된 JSON → 기본값 반환", () => {
    localStorage.setItem("user_prefs_v1", "broken-json");
    const prefs = loadUserPrefs("user1");
    expect(prefs).toEqual(PREF_DEFAULTS);
  });
});

describe("saveUserPrefs", () => {
  it("userId 없으면 저장하지 않음", () => {
    saveUserPrefs(null, { accent: "blue" });
    expect(localStorage.getItem("user_prefs_v1")).toBeNull();
  });

  it("정상 저장 후 로드 확인", () => {
    const prefs = { ...PREF_DEFAULTS, accent: "pink" };
    saveUserPrefs("user1", prefs);
    const loaded = loadUserPrefs("user1");
    expect(loaded.accent).toBe("pink");
  });

  it("저장 시 applyPrefs 호출 (setAmountFormat)", () => {
    saveUserPrefs("user1", { ...PREF_DEFAULTS, amount_format: "man" });
    expect(setAmountFormat).toHaveBeenCalledWith("man");
  });
});

describe("removeUserPrefs", () => {
  it("userId 없으면 무시", () => {
    localStorage.setItem("user_prefs_v1", JSON.stringify({ u1: {} }));
    removeUserPrefs(null);
    expect(JSON.parse(localStorage.getItem("user_prefs_v1"))).toHaveProperty("u1");
  });

  it("특정 유저 설정 삭제", () => {
    localStorage.setItem("user_prefs_v1", JSON.stringify({ u1: { accent: "blue" }, u2: {} }));
    removeUserPrefs("u1");
    const all = JSON.parse(localStorage.getItem("user_prefs_v1"));
    expect(all.u1).toBeUndefined();
    expect(all.u2).toBeDefined();
  });
});

describe("applyPrefs", () => {
  it("null prefs → 아무것도 안 함", () => {
    applyPrefs(null);
    // 에러 없이 통과
  });

  it("CSS 변수 설정 확인 (accent indigo)", () => {
    applyPrefs({ ...PREF_DEFAULTS });
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--color-primary")).toBe(ACCENT_PRESETS.indigo.primary);
  });

  it("다크 모드에서 다크 컬러 적용", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    applyPrefs({ ...PREF_DEFAULTS });
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--color-primary")).toBe(ACCENT_PRESETS.indigo.dark.primary);
  });

  it("animation off → anim-off 클래스 추가", () => {
    applyPrefs({ ...PREF_DEFAULTS, animation: "off" });
    expect(document.documentElement.classList.contains("anim-off")).toBe(true);
  });

  it("animation reduced → anim-reduced 클래스 추가", () => {
    applyPrefs({ ...PREF_DEFAULTS, animation: "reduced" });
    expect(document.documentElement.classList.contains("anim-reduced")).toBe(true);
  });

  it("animation on → anim 클래스 모두 제거", () => {
    document.documentElement.classList.add("anim-off");
    applyPrefs({ ...PREF_DEFAULTS, animation: "on" });
    expect(document.documentElement.classList.contains("anim-off")).toBe(false);
    expect(document.documentElement.classList.contains("anim-reduced")).toBe(false);
  });

  it("header_style solid → --header-bg-image none", () => {
    applyPrefs({ ...PREF_DEFAULTS, header_style: "solid" });
    expect(document.documentElement.style.getPropertyValue("--header-bg-image")).toBe("none");
  });
});

describe("clearPrefsOverrides", () => {
  it("CSS 변수 제거 + setAmountFormat(won) 호출", () => {
    applyPrefs({ ...PREF_DEFAULTS, accent: "pink" });
    clearPrefsOverrides();
    expect(document.documentElement.style.getPropertyValue("--color-primary")).toBe("");
    expect(setAmountFormat).toHaveBeenCalledWith("won");
  });

  it("anim 클래스 제거", () => {
    document.documentElement.classList.add("anim-off", "anim-reduced");
    clearPrefsOverrides();
    expect(document.documentElement.classList.contains("anim-off")).toBe(false);
    expect(document.documentElement.classList.contains("anim-reduced")).toBe(false);
  });
});

describe("reapplyCurrentPrefs", () => {
  it("활성 유저 없으면 기본값 적용", () => {
    getActiveUser.mockReturnValue(null);
    reapplyCurrentPrefs();
    expect(setAmountFormat).toHaveBeenCalledWith("won");
  });
});

describe("프리셋 상수 유효성", () => {
  it("ACCENT_PRESETS 6가지 존재", () => {
    expect(Object.keys(ACCENT_PRESETS)).toHaveLength(6);
  });

  it("모든 accent에 dark 테마 존재", () => {
    for (const key of Object.keys(ACCENT_PRESETS)) {
      expect(ACCENT_PRESETS[key].dark).toBeDefined();
    }
  });

  it("BG_STYLE_PRESETS에 light/dark 존재", () => {
    for (const key of Object.keys(BG_STYLE_PRESETS)) {
      expect(BG_STYLE_PRESETS[key].light).toBeDefined();
      expect(BG_STYLE_PRESETS[key].dark).toBeDefined();
    }
  });

  it("FONT_SIZE_SCALES 3가지", () => {
    expect(Object.keys(FONT_SIZE_SCALES)).toEqual(["small", "normal", "large"]);
  });
});
