// src/utils/deviceId.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDeviceId, resetDeviceId } from "./deviceId";

beforeEach(() => {
  localStorage.clear();
});

describe("getDeviceId", () => {
  it("저장된 ID가 없으면 새 ID를 생성하여 반환한다", () => {
    const id = getDeviceId();
    expect(id).toMatch(/^dev_[0-9a-z]{16}$/);
  });

  it("생성한 ID를 localStorage에 저장한다", () => {
    const id = getDeviceId();
    expect(localStorage.getItem("device_id_v1")).toBe(id);
  });

  it("이미 저장된 ID가 있으면 그대로 반환한다", () => {
    localStorage.setItem("device_id_v1", "dev_existingid12345");
    const id = getDeviceId();
    expect(id).toBe("dev_existingid12345");
  });

  it("두 번 호출해도 같은 ID를 반환한다", () => {
    const first = getDeviceId();
    const second = getDeviceId();
    expect(first).toBe(second);
  });

  it("레거시: JSON 문자열로 감싸진 ID를 언래핑한다", () => {
    localStorage.setItem("device_id_v1", '"dev_legacywrapped1"');
    const id = getDeviceId();
    expect(id).toBe("dev_legacywrapped1");
  });

  it("따옴표로 시작하지만 유효하지 않은 JSON이면 raw string 그대로 반환한다", () => {
    const raw = '"broken json {{{';
    localStorage.setItem("device_id_v1", raw);
    const id = getDeviceId();
    expect(id).toBe(raw);
  });

  it("따옴표로 시작하지 않는 일반 문자열은 그대로 반환한다", () => {
    localStorage.setItem("device_id_v1", "dev_plain123");
    const id = getDeviceId();
    expect(id).toBe("dev_plain123");
  });

  it("localStorage.setItem이 실패해도 ID를 반환한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const id = getDeviceId();
    expect(id).toMatch(/^dev_[0-9a-z]{16}$/);
  });

  it("생성된 ID는 dev_ 접두사 + 16자로 구성된다", () => {
    const id = getDeviceId();
    expect(id.startsWith("dev_")).toBe(true);
    expect(id.length).toBe(4 + 16); // "dev_" + 16 chars
  });

  it("빈 문자열이 저장된 경우 새 ID를 생성한다", () => {
    localStorage.setItem("device_id_v1", "");
    const id = getDeviceId();
    // 빈 문자열은 falsy이므로 새 ID 생성
    expect(id).toMatch(/^dev_[0-9a-z]{16}$/);
  });
});

describe("resetDeviceId", () => {
  it("저장된 디바이스 ID를 삭제한다", () => {
    localStorage.setItem("device_id_v1", "dev_toberemoved123");
    resetDeviceId();
    expect(localStorage.getItem("device_id_v1")).toBeNull();
  });

  it("저장된 ID가 없어도 에러 없이 동작한다", () => {
    expect(() => resetDeviceId()).not.toThrow();
    expect(localStorage.getItem("device_id_v1")).toBeNull();
  });

  it("리셋 후 getDeviceId를 호출하면 새 ID가 생성된다", () => {
    const original = getDeviceId();
    resetDeviceId();
    const regenerated = getDeviceId();
    expect(regenerated).toMatch(/^dev_[0-9a-z]{16}$/);
    // nanoid는 랜덤이므로 새 ID는 원래 ID와 다를 가능성이 극히 높음
    // (이론적으로 같을 수 있지만 16자 알파벳 36개 → 충돌 확률 무시 가능)
    expect(regenerated).not.toBe(original);
  });

  it("다른 localStorage 키에는 영향을 주지 않는다", () => {
    localStorage.setItem("device_id_v1", "dev_target123");
    localStorage.setItem("other_key", "keep_me");
    resetDeviceId();
    expect(localStorage.getItem("device_id_v1")).toBeNull();
    expect(localStorage.getItem("other_key")).toBe("keep_me");
  });
});
