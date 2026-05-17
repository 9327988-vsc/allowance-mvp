// src/hooks/useUserPrefs.js — 맞춤 설정 React 훅

import { useState, useCallback, useEffect, useRef } from "react";
import { getActiveUser } from "../utils/authStore";
import { loadUserPrefs, saveUserPrefs, applyPrefs, PREF_DEFAULTS } from "../utils/userPrefs";

export function useUserPrefs() {
  const userId = getActiveUser();
  const userIdRef = useRef(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  const [prefs, setPrefs] = useState(() => loadUserPrefs(userId));

  useEffect(() => {
    const loaded = loadUserPrefs(userId);
    setPrefs(loaded);
    applyPrefs(loaded);
  }, [userId]);

  const isFirstRender = useRef(true);
  const updatePref = useCallback((key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  }, []);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;
    saveUserPrefs(currentUserId, prefs);
    applyPrefs(prefs);
  }, [prefs]);

  const resetPrefs = useCallback(() => {
    const defaults = { ...PREF_DEFAULTS };
    saveUserPrefs(userId, defaults);
    setPrefs(defaults);
  }, [userId]);

  return { prefs, updatePref, resetPrefs };
}
