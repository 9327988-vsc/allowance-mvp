// src/hooks/useClaims.js — 청구 목록 조회 훅
import { useState, useCallback, useEffect, useRef } from "react";
import { getKVAdapter } from "../utils/kvAdapter";

/**
 * 가족의 청구 목록 조회
 * @param {string} familyId
 * @returns {{ claims, loading, error, fetchClaims }}
 */
export function useClaims(familyId) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const fetchClaims = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    setError(null);
    try {
      const adapter = getKVAdapter();
      const result = await adapter.listClaims(familyId);
      if (mountedRef.current) setClaims(result.claims || []);
    } catch (err) {
      if (mountedRef.current) setError(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [familyId]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (familyId) fetchClaims();
  }, [familyId, fetchClaims]);

  return { claims, loading, error, fetchClaims, clearError };
}
