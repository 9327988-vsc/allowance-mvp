// src/utils/syncPoller.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPoller } from "./syncPoller";

describe("createPoller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("start 후 즉시 fetchFn을 호출한다", async () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined);
    const poller = createPoller(fetchFn, { interval: 5000 });

    poller.start();
    await vi.advanceTimersByTimeAsync(100);

    expect(fetchFn).toHaveBeenCalled();
    poller.stop();
  });

  it("stop 후에는 더 이상 호출하지 않는다", async () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined);
    const poller = createPoller(fetchFn, { interval: 1000 });

    poller.start();
    await vi.advanceTimersByTimeAsync(100);
    poller.stop();
    const callCount = fetchFn.mock.calls.length;

    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchFn.mock.calls.length).toBe(callCount);
  });

  it("isRunning은 start/stop 상태를 반영한다", () => {
    const poller = createPoller(vi.fn().mockResolvedValue(undefined));
    expect(poller.isRunning()).toBe(false);
    poller.start();
    expect(poller.isRunning()).toBe(true);
    poller.stop();
    expect(poller.isRunning()).toBe(false);
  });

  it("fetchFn 에러 시 onError를 호출하고 계속 동작한다", async () => {
    const error = new Error("network");
    const fetchFn = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();
    const poller = createPoller(fetchFn, { interval: 1000, onError });

    poller.start();
    await vi.advanceTimersByTimeAsync(100);

    expect(onError).toHaveBeenCalledWith(error);
    expect(poller.isRunning()).toBe(true);
    poller.stop();
  });

  it("중복 start를 무시한다", () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined);
    const poller = createPoller(fetchFn, { interval: 1000 });

    poller.start();
    poller.start();
    expect(poller.isRunning()).toBe(true);
    poller.stop();
  });
});
