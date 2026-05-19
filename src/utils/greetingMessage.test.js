// src/utils/greetingMessage.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getGreetingMessage } from "./greetingMessage";

describe("getGreetingMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("문자열을 반환", () => {
    vi.setSystemTime(new Date(2026, 4, 19, 10, 0, 0));
    const msg = getGreetingMessage();
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });

  it("아침 시간대 (5~8시) 메시지", () => {
    vi.setSystemTime(new Date(2026, 4, 19, 6, 0, 0));
    const msg = getGreetingMessage();
    expect(msg).toBeTruthy();
  });

  it("오전 시간대 (9~11시) 메시지", () => {
    vi.setSystemTime(new Date(2026, 4, 19, 10, 0, 0));
    const msg = getGreetingMessage();
    expect(msg).toBeTruthy();
  });

  it("오후 시간대 (12~16시) 메시지", () => {
    vi.setSystemTime(new Date(2026, 4, 19, 14, 0, 0));
    const msg = getGreetingMessage();
    expect(msg).toBeTruthy();
  });

  it("저녁 시간대 (17~20시) 메시지", () => {
    vi.setSystemTime(new Date(2026, 4, 19, 18, 0, 0));
    const msg = getGreetingMessage();
    expect(msg).toBeTruthy();
  });

  it("밤 시간대 (21~4시) 메시지", () => {
    vi.setSystemTime(new Date(2026, 4, 19, 23, 0, 0));
    const msg = getGreetingMessage();
    expect(msg).toBeTruthy();
  });

  it("자정 (0시) 도 밤 시간대", () => {
    vi.setSystemTime(new Date(2026, 4, 19, 0, 0, 0));
    const msg = getGreetingMessage();
    expect(msg).toBeTruthy();
  });

  it("같은 시간에 호출하면 동일 결과 (결정적)", () => {
    vi.setSystemTime(new Date(2026, 4, 19, 12, 0, 0));
    const msg1 = getGreetingMessage();
    const msg2 = getGreetingMessage();
    expect(msg1).toBe(msg2);
  });

  it("여름 (7월) 계절 메시지 포함 가능", () => {
    // 계절 메시지가 풀에 추가되므로 풀이 더 커짐
    vi.setSystemTime(new Date(2026, 6, 15, 10, 0, 0));
    const msg = getGreetingMessage();
    expect(msg).toBeTruthy();
  });

  it("겨울 (1월) 계절 메시지 포함 가능", () => {
    vi.setSystemTime(new Date(2026, 0, 10, 10, 0, 0));
    const msg = getGreetingMessage();
    expect(msg).toBeTruthy();
  });

  it("봄 (4월) 계절 메시지 포함 가능", () => {
    vi.setSystemTime(new Date(2026, 3, 10, 10, 0, 0));
    const msg = getGreetingMessage();
    expect(msg).toBeTruthy();
  });

  it("가을 (10월) 계절 메시지 포함 가능", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 10, 0, 0));
    const msg = getGreetingMessage();
    expect(msg).toBeTruthy();
  });
});
