// src/utils/clipboard.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { copyToClipboard } from "./clipboard";

describe("clipboard.js", () => {
  let originalClipboard;

  beforeEach(() => {
    originalClipboard = navigator.clipboard;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // clipboard 복원
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  describe("빈 텍스트 처리", () => {
    it("null 전달 시 EMPTY_TEXT 오류 반환", async () => {
      const result = await copyToClipboard(null);
      expect(result).toEqual({ success: false, error: "EMPTY_TEXT" });
    });

    it("undefined 전달 시 EMPTY_TEXT 오류 반환", async () => {
      const result = await copyToClipboard(undefined);
      expect(result).toEqual({ success: false, error: "EMPTY_TEXT" });
    });

    it("빈 문자열 전달 시 EMPTY_TEXT 오류 반환", async () => {
      const result = await copyToClipboard("");
      expect(result).toEqual({ success: false, error: "EMPTY_TEXT" });
    });

    it("공백만 있는 문자열 전달 시 EMPTY_TEXT 오류 반환", async () => {
      const result = await copyToClipboard("   ");
      expect(result).toEqual({ success: false, error: "EMPTY_TEXT" });
    });
  });

  describe("모던 Clipboard API 사용", () => {
    it("writeText 성공 시 success: true 반환", async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      const result = await copyToClipboard("테스트 텍스트");
      expect(result).toEqual({ success: true });
      expect(mockWriteText).toHaveBeenCalledWith("테스트 텍스트");
    });

    it("writeText 실패 시 CLIPBOARD_DENIED + fallbackText 반환", async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error("denied"));
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      const result = await copyToClipboard("복사할 텍스트");
      expect(result).toEqual({
        success: false,
        error: "CLIPBOARD_DENIED",
        fallbackText: "복사할 텍스트",
      });
    });
  });

  describe("레거시 execCommand 폴백", () => {
    beforeEach(() => {
      // clipboard API 제거하여 폴백 경로 진입
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it("execCommand 성공 시 success: true 반환", async () => {
      document.execCommand = vi.fn().mockReturnValue(true);

      const result = await copyToClipboard("폴백 테스트");
      expect(result).toEqual({ success: true });
      expect(document.execCommand).toHaveBeenCalledWith("copy");
    });

    it("execCommand 실패(false) 시 CLIPBOARD_UNSUPPORTED 반환", async () => {
      document.execCommand = vi.fn().mockReturnValue(false);

      const result = await copyToClipboard("폴백 실패");
      expect(result).toEqual({
        success: false,
        error: "CLIPBOARD_UNSUPPORTED",
        fallbackText: "폴백 실패",
      });
    });

    it("execCommand 예외 발생 시 CLIPBOARD_UNSUPPORTED 반환", async () => {
      document.execCommand = vi.fn().mockImplementation(() => {
        throw new Error("not supported");
      });

      const result = await copyToClipboard("예외 테스트");
      expect(result).toEqual({
        success: false,
        error: "CLIPBOARD_UNSUPPORTED",
        fallbackText: "예외 테스트",
      });
    });
  });
});
