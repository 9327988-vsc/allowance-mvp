// src/hooks/useUserPrefs.js — 맞춤 설정 React 훅

import { useState, useCallback, useEffect, useRef } from "react";
import { getActiveUser } from "../utils/authStore";
import { loadUserPrefs, saveUserPrefs, applyPrefs, PREF_DEFAULTS } from "../utils/userPrefs";

export function useUserPrefs() {
  // NOTE: getActiveUser() reads sessionStorage on every render. This is cheap and acceptable.
  // The userId won't change mid-session, so non-reactivity is not a practical concern here.
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
  const prevPrefsRef = useRef(prefs);
  const updatePref = useCallback((key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  }, []);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (JSON.stringify(prevPrefsRef.current) === JSON.stringify(prefs)) return;
    prevPrefsRef.current = prefs;
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;
    saveUserPrefs(currentUserId, prefs);
    applyPrefs(prefs);
  }, [prefs]);

  const resetPrefs = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    const defaults = { ...PREF_DEFAULTS };
    saveUserPrefs(uid, defaults);
    setPrefs(defaults);
  }, []);

  return { prefs, updatePref, resetPrefs };
}
