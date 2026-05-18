// src/hooks/useAsyncAction.js — 비동기 액션 (더블클릭 방지, 4.16.1)

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * 비동기 액션 래퍼: loading 상태 + 에러 + 더블클릭 방지
 *
 * @param {(...args) => Promise} asyncFn
 * @returns {{ run: Function, loading: boolean, error: any }}
 */
export function useAsyncAction(asyncFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);
  const asyncFnRef = useRef(asyncFn);
  useEffect(() => { asyncFnRef.current = asyncFn; });
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const run = useCallback(async (...args) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFnRef.current(...args);
      return result;
    } catch (err) {
      // L-5: setError로 UI 상태 추적 + throw로 caller의 .catch()에도 전달.
      // 이중 추적은 의도적: hook은 UI 표시용, caller는 커스텀 핸들링용.
      if (mountedRef.current) setError(err);
      throw err;
    } finally {
      runningRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  return { run, loading, error };
}
