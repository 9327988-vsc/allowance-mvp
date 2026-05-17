// src/hooks/useSyncPoller.js — 폴링 React 훅
import { useEffect, useRef } from "react";
import { createPoller } from "../utils/syncPoller";

/**
 * 컴포넌트 마운트 시 폴링 시작, 언마운트 시 정지
 * @param {() => Promise} fetchFn
 * @param {{ interval?: number, enabled?: boolean }} options
 */
export function useSyncPoller(fetchFn, options = {}) {
  const { interval = 30000, enabled = true } = options;
  const pollerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const poller = createPoller(fetchFn, { interval });
    pollerRef.current = poller;
    poller.start();

    // 탭 숨김 시 폴링 중지, 복귀 시 재개
    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        poller.stop();
      } else {
        poller.start();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      poller.stop();
      pollerRef.current = null;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchFn, interval, enabled]);

  return {
    restart: () => {
      if (pollerRef.current) {
        pollerRef.current.stop();
        pollerRef.current.start();
      }
    },
  };
}
