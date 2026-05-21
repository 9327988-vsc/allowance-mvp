// src/utils/toastManager.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  showToast,
  dismissToast,
  _registerToastContainer,
  _unregisterToastContainer,
} from "./toastManager";

describe("toastManager", () => {
  /** setState 스파이 + 캡처 헬퍼 */
  let mockSetState;
  let capturedToasts;

  beforeEach(() => {
    vi.useFakeTimers();
    capturedToasts = [];
    // setState는 React의 함수형 업데이트 시뮬레이션
    mockSetState = vi.fn((updater) => {
      capturedToasts = updater(capturedToasts);
    });
    // 이전 테스트에서 큐에 남은 토스트를 flush하기 위해 임시 등록 후 해제
    const drain = vi.fn((updater) => updater([]));
    _registerToastContainer(drain);
    _unregisterToastContainer();
  });

  // ------------------------------------------------------------------
  // showToast 기본 동작
  // ------------------------------------------------------------------
  describe("showToast - 기본 동작", () => {
    it("컨테이너 등록 후 호출 시 즉시 setState를 통해 토스트가 추가된다", () => {
      _registerToastContainer(mockSetState);

      const id = showToast({ type: "success", message: "저장 완료" });

      expect(id).toBeTypeOf("number");
      expect(mockSetState).toHaveBeenCalledTimes(1);
      expect(capturedToasts).toHaveLength(1);
      expect(capturedToasts[0]).toMatchObject({
        id,
        type: "success",
        message: "저장 완료",
        duration: 3000,
        action: null,
      });
    });

    it("호출마다 고유한 ID를 반환한다", () => {
      _registerToastContainer(mockSetState);

      const id1 = showToast({ type: "success", message: "A" });
      const id2 = showToast({ type: "error", message: "B" });

      expect(id1).not.toBe(id2);
      expect(id2).toBeGreaterThan(id1);
    });

    it("여러 토스트를 연속 호출하면 모두 누적된다", () => {
      _registerToastContainer(mockSetState);

      showToast({ type: "success", message: "1" });
      showToast({ type: "error", message: "2" });
      showToast({ type: "warning", message: "3" });

      expect(capturedToasts).toHaveLength(3);
    });
  });

  // ------------------------------------------------------------------
  // showToast 기본 duration 매핑
  // ------------------------------------------------------------------
  describe("showToast - 기본 duration 매핑", () => {
    beforeEach(() => {
      _registerToastContainer(mockSetState);
    });

    it("success 타입은 기본 3000ms", () => {
      showToast({ type: "success", message: "ok" });
      expect(capturedToasts[0].duration).toBe(3000);
    });

    it("error 타입은 기본 5000ms", () => {
      showToast({ type: "error", message: "fail" });
      expect(capturedToasts[0].duration).toBe(5000);
    });

    it("warning 타입은 기본 4000ms", () => {
      showToast({ type: "warning", message: "주의" });
      expect(capturedToasts[0].duration).toBe(4000);
    });

    it("사용자 지정 duration이 기본값을 덮어쓴다", () => {
      showToast({ type: "success", message: "custom", duration: 10000 });
      expect(capturedToasts[0].duration).toBe(10000);
    });

    it("duration: 0 지정 시 0으로 설정된다 (수동 닫기)", () => {
      showToast({ type: "error", message: "수동", duration: 0 });
      expect(capturedToasts[0].duration).toBe(0);
    });
  });

  // ------------------------------------------------------------------
  // showToast action 옵션
  // ------------------------------------------------------------------
  describe("showToast - action 옵션", () => {
    beforeEach(() => {
      _registerToastContainer(mockSetState);
    });

    it("action 미지정 시 null", () => {
      showToast({ type: "success", message: "ok" });
      expect(capturedToasts[0].action).toBeNull();
    });

    it("action 지정 시 그대로 저장된다", () => {
      const onClick = vi.fn();
      showToast({
        type: "error",
        message: "손상",
        duration: 0,
        action: { label: "관리자 모드 열기", onClick },
      });
      expect(capturedToasts[0].action).toEqual({
        label: "관리자 모드 열기",
        onClick,
      });
    });
  });

  // ------------------------------------------------------------------
  // 자동 닫힘 (duration > 0)
  // ------------------------------------------------------------------
  describe("showToast - 자동 닫힘 (setTimeout)", () => {
    it("duration > 0이면 해당 시간 후 자동으로 dismissToast가 호출된다", () => {
      _registerToastContainer(mockSetState);

      const id = showToast({ type: "success", message: "auto", duration: 3000 });
      expect(capturedToasts).toHaveLength(1);

      vi.advanceTimersByTime(3000);
      // dismissToast가 setState를 호출하여 해당 ID 필터링
      expect(capturedToasts.find((t) => t.id === id)).toBeUndefined();
    });

    it("duration === 0이면 자동 닫힘이 발생하지 않는다", () => {
      _registerToastContainer(mockSetState);

      const id = showToast({ type: "error", message: "manual", duration: 0 });

      vi.advanceTimersByTime(60000); // 아무리 오래 기다려도
      expect(capturedToasts.find((t) => t.id === id)).toBeDefined();
    });
  });

  // ------------------------------------------------------------------
  // dismissToast
  // ------------------------------------------------------------------
  describe("dismissToast", () => {
    it("지정한 ID의 토스트만 제거한다", () => {
      _registerToastContainer(mockSetState);

      const id1 = showToast({ type: "success", message: "A", duration: 0 });
      const id2 = showToast({ type: "error", message: "B", duration: 0 });

      dismissToast(id1);

      expect(capturedToasts).toHaveLength(1);
      expect(capturedToasts[0].id).toBe(id2);
    });

    it("존재하지 않는 ID로 호출해도 에러 없이 동작한다", () => {
      _registerToastContainer(mockSetState);

      showToast({ type: "success", message: "A", duration: 0 });

      expect(() => dismissToast(999999)).not.toThrow();
      expect(capturedToasts).toHaveLength(1); // 변화 없음
    });

    it("컨테이너 미등록 상태에서 호출 시 아무 동작도 하지 않는다", () => {
      // _unregisterToastContainer()는 beforeEach에서 이미 호출됨
      expect(() => dismissToast(123)).not.toThrow();
    });
  });

  // ------------------------------------------------------------------
  // 큐잉 (컨테이너 마운트 전 호출)
  // ------------------------------------------------------------------
  describe("showToast - 큐잉 (컨테이너 마운트 전)", () => {
    it("컨테이너 미등록 상태에서 호출하면 ID를 반환하되 setState는 호출되지 않는다", () => {
      const id = showToast({ type: "success", message: "queued" });

      expect(id).toBeTypeOf("number");
      expect(mockSetState).not.toHaveBeenCalled();
    });

    it("큐에 쌓인 토스트는 _registerToastContainer 호출 시 flush된다", () => {
      const id1 = showToast({ type: "success", message: "Q1" });
      const id2 = showToast({ type: "error", message: "Q2" });

      // 아직 미등록
      expect(mockSetState).not.toHaveBeenCalled();

      // 컨테이너 등록 → flush
      _registerToastContainer(mockSetState);

      expect(capturedToasts).toHaveLength(2);
      expect(capturedToasts[0].id).toBe(id1);
      expect(capturedToasts[1].id).toBe(id2);
    });

    it("큐에 쌓인 토스트도 올바른 기본 duration이 적용된다", () => {
      showToast({ type: "warning", message: "큐 경고" });

      _registerToastContainer(mockSetState);

      expect(capturedToasts[0].duration).toBe(4000);
    });
  });

  // ------------------------------------------------------------------
  // _registerToastContainer
  // ------------------------------------------------------------------
  describe("_registerToastContainer", () => {
    it("큐가 비어있으면 setState가 호출되지 않는다", () => {
      _registerToastContainer(mockSetState);
      expect(mockSetState).not.toHaveBeenCalled();
    });

    it("flush 후 동일 ID 토스트를 다시 flush하지 않는다 (HMR 중복 방지)", () => {
      // 1차: 큐에 넣고 등록
      showToast({ type: "success", message: "first" });
      _registerToastContainer(mockSetState);
      expect(capturedToasts).toHaveLength(1);

      const firstCount = mockSetState.mock.calls.length;

      // 언마운트 후 재마운트 (HMR 시나리오)
      _unregisterToastContainer();
      capturedToasts = [];
      mockSetState.mockClear();

      // 큐에 같은 toast가 없으므로 flush할 게 없다
      _registerToastContainer(mockSetState);
      expect(mockSetState).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // _unregisterToastContainer
  // ------------------------------------------------------------------
  describe("_unregisterToastContainer", () => {
    it("언마운트 후 showToast는 큐에 쌓인다 (즉시 dispatch되지 않음)", () => {
      _registerToastContainer(mockSetState);
      _unregisterToastContainer();

      mockSetState.mockClear();

      showToast({ type: "success", message: "after unmount" });

      expect(mockSetState).not.toHaveBeenCalled();
    });

    it("언마운트 후 dismissToast는 아무 동작도 하지 않는다", () => {
      _registerToastContainer(mockSetState);
      const id = showToast({ type: "success", message: "test", duration: 0 });
      _unregisterToastContainer();

      expect(() => dismissToast(id)).not.toThrow();
    });
  });

  // ------------------------------------------------------------------
  // 엣지 케이스
  // ------------------------------------------------------------------
  describe("엣지 케이스", () => {
    it("duration 미지정 + 알 수 없는 type은 warning 기본 4000ms를 사용한다", () => {
      _registerToastContainer(mockSetState);
      // success/error가 아닌 다른 값은 삼항의 else 분기 → 4000
      showToast({ type: "info", message: "알 수 없는 타입" });
      expect(capturedToasts[0].duration).toBe(4000);
    });

    it("큐잉 후 컨테이너 등록 → 언마운트 → 재등록 시 이미 flush된 토스트는 재전송되지 않는다", () => {
      // 큐에 넣기
      showToast({ type: "success", message: "once" });

      // 1차 등록 → flush
      _registerToastContainer(mockSetState);
      expect(capturedToasts).toHaveLength(1);

      // 언마운트
      _unregisterToastContainer();
      capturedToasts = [];
      mockSetState.mockClear();

      // 2차 등록 → 이미 flushed이므로 재전송 안 됨
      _registerToastContainer(mockSetState);
      expect(mockSetState).not.toHaveBeenCalled();
      expect(capturedToasts).toHaveLength(0);
    });

    it("flush 후 즉시 등록된 상태에서 새 토스트는 정상 dispatch된다", () => {
      // 큐에 넣기
      showToast({ type: "success", message: "queued" });

      // 등록 + flush
      _registerToastContainer(mockSetState);
      expect(capturedToasts).toHaveLength(1);

      // 새 토스트 추가
      showToast({ type: "error", message: "new" });
      expect(capturedToasts).toHaveLength(2);
    });

    it("자동 닫힘 타이머가 컨테이너 언마운트 후 발동해도 에러가 발생하지 않는다", () => {
      _registerToastContainer(mockSetState);
      showToast({ type: "success", message: "auto", duration: 3000 });

      _unregisterToastContainer();

      // 타이머 발동 — dismissToast 내부에서 _setState === null 체크
      expect(() => vi.advanceTimersByTime(3000)).not.toThrow();
    });
  });
});
