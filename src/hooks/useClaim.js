// src/hooks/useClaim.js — 단일 청구 상세 조회 훅
import { useState, useCallback, useRef, useEffect } from "react";
import { getKVAdapter } from "../utils/kvAdapter";

/**
 * 단일 청구 상세 조회
 * @param {string} claimId
 * @returns {{ claim, loading, error, fetchClaim }}
 */
export function useClaim(claimId) {
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const fetchClaim = useCallback(async () => {
    if (!claimId) return;
    setLoading(true);
    setError(null);
    try {
      const adapter = getKVAdapter();
      const result = await adapter.getClaim(claimId);
      if (mountedRef.current) setClaim(result);
    } catch (err) {
      if (mountedRef.current) setError(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [claimId]);

  return { claim, loading, error, fetchClaim, setClaim };
}
