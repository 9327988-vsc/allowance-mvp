// src/utils/xss.test.js
import { describe, it, expect } from "vitest";
import { escapeHtml } from "./xss";

describe("escapeHtml", () => {
  it("HTML 특수문자를 이스케이프한다", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;"
    );
  });

  it("& 문자를 이스케이프한다", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("작은따옴표를 이스케이프한다", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("일반 텍스트는 그대로 반환한다", () => {
    expect(escapeHtml("안녕하세요")).toBe("안녕하세요");
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });

  it("비문자열은 빈 문자열을 반환한다", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(123)).toBe("");
  });

  it("빈 문자열은 빈 문자열을 반환한다", () => {
    expect(escapeHtml("")).toBe("");
  });
});
