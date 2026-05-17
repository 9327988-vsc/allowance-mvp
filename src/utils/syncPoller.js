// src/utils/syncPoller.js — 30초 폴링 유틸리티

const DEFAULT_INTERVAL = 30000;

/**
 * 주기적 폴링 생성기
 * @param {() => Promise} fetchFn - 호출할 비동기 함수
 * @param {{ interval?: number, onError?: (err: Error) => void }} options
 * @returns {{ start: () => void, stop: () => void, isRunning: () => boolean }}
 */
export function createPoller(fetchFn, options = {}) {
  const interval = options.interval ?? DEFAULT_INTERVAL;
  const onError = options.onError || (() => {});
  let timerId = null;
  let running = false;

  async function tick() {
    if (!running) return;
    try {
      await fetchFn();
    } catch (err) {
      onError(err);
    }
    if (running) {
      timerId = setTimeout(tick, interval);
    }
  }

  function start() {
    if (running) return;
    running = true;
    // 즉시 첫 호출 후 interval 간격으로 반복
    tick();
  }

  function stop() {
    running = false;
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function isRunning() {
    return running;
  }

  return { start, stop, isRunning };
}
