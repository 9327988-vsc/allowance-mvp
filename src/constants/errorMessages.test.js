// src/constants/errorMessages.test.js
import { describe, it, expect } from "vitest";
import { ERROR_MESSAGES, getErrorMessage, getMessageForError } from "./errorMessages";

describe("ERROR_MESSAGES", () => {
  it("모든 주요 에러 코드가 정의되어 있다", () => {
    const requiredCodes = [
      "NETWORK_ERROR", "TIMEOUT", "FAMILY_NOT_FOUND", "FAMILY_FULL",
      "CHILD_ALREADY_EXISTS", "DUPLICATE_CLAIM", "CONFLICT",
      "PARENT_ONLY", "CHILD_ONLY", "ALREADY_RECEIVED",
    ];
    for (const code of requiredCodes) {
      expect(ERROR_MESSAGES[code]).toBeDefined();
      expect(typeof ERROR_MESSAGES[code]).toBe("string");
    }
  });
});

describe("getErrorMessage", () => {
  it("알려진 코드는 한국어 메시지를 반환한다", () => {
    expect(getErrorMessage("NETWORK_ERROR")).toBe(ERROR_MESSAGES.NETWORK_ERROR);
    expect(getErrorMessage("FAMILY_NOT_FOUND")).toBe(ERROR_MESSAGES.FAMILY_NOT_FOUND);
  });

  it("알 수 없는 코드는 fallback을 반환한다", () => {
    expect(getErrorMessage("UNKNOWN_CODE", "폴백 메시지")).toBe("폴백 메시지");
  });

  it("fallback도 없으면 코드 포함 메시지를 반환한다", () => {
    expect(getErrorMessage("UNKNOWN")).toBe("오류 (UNKNOWN)");
  });
});

describe("getMessageForError", () => {
  it("code가 있는 에러는 해당 메시지를 반환한다", () => {
    const err = { code: "FAMILY_FULL", message: "raw" };
    expect(getMessageForError(err)).toBe(ERROR_MESSAGES.FAMILY_FULL);
  });

  it("code가 없는 에러는 INTERNAL_ERROR 메시지를 반환한다", () => {
    expect(getMessageForError(new Error("something"))).toBe(ERROR_MESSAGES.INTERNAL_ERROR);
    expect(getMessageForError(null)).toBe(ERROR_MESSAGES.INTERNAL_ERROR);
  });
});
