// src/utils/onlineStatus.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// onlineStatus.js는 모듈 로드 시 전역 상태를 설정하므로
// 각 테스트에서 동적 import로 격리
describe("onlineStatus.js", () => {
  let mod;

  beforeEach(async () => {
    // 모듈 캐시 초기화 후 재임포트
    vi.resetModules();
    mod = await import("./onlineStatus");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isOnline", () => {
    it("초기 상태는 navigator.onLine 값 반영", () => {
      // jsdom에서 navigator.onLine은 기본 true
      expect(mod.isOnline()).toBe(true);
    });
  });

  describe("online/offline 이벤트", () => {
    it("offline 이벤트 발생 시 isOnline() === false", () => {
      window.dispatchEvent(new Event("offline"));
      expect(mod.isOnline()).toBe(false);
    });

    it("online 이벤트 발생 시 isOnline() === true", () => {
      window.dispatchEvent(new Event("offline"));
      expect(mod.isOnline()).toBe(false);
      window.dispatchEvent(new Event("online"));
      expect(mod.isOnline()).toBe(true);
    });
  });

  describe("subscribeOnlineStatus", () => {
    it("상태 변경 시 콜백 호출", () => {
      const cb = vi.fn();
      mod.subscribeOnlineStatus(cb);

      window.dispatchEvent(new Event("offline"));
      expect(cb).toHaveBeenCalledWith(false);

      window.dispatchEvent(new Event("online"));
      expect(cb).toHaveBeenCalledWith(true);
      expect(cb).toHaveBeenCalledTimes(2);
    });

    it("구독 해제 후 콜백 미호출", () => {
      const cb = vi.fn();
      const unsub = mod.subscribeOnlineStatus(cb);

      unsub();
      window.dispatchEvent(new Event("offline"));
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("onOnlineChange (별칭)", () => {
    it("subscribeOnlineStatus와 동일하게 동작", () => {
      const cb = vi.fn();
      const unsub = mod.onOnlineChange(cb);

      window.dispatchEvent(new Event("offline"));
      expect(cb).toHaveBeenCalledWith(false);

      unsub();
      window.dispatchEvent(new Event("online"));
      expect(cb).toHaveBeenCalledTimes(1); // 구독 해제 후 미호출
    });
  });

  describe("리스너 에러 격리", () => {
    it("한 리스너가 에러 발생해도 다른 리스너는 정상 호출", () => {
      const errCb = vi.fn(() => { throw new Error("broken"); });
      const okCb = vi.fn();
      vi.spyOn(console, "error").mockImplementation(() => {});

      mod.subscribeOnlineStatus(errCb);
      mod.subscribeOnlineStatus(okCb);

      window.dispatchEvent(new Event("offline"));
      expect(errCb).toHaveBeenCalled();
      expect(okCb).toHaveBeenCalledWith(false);
    });
  });
});
