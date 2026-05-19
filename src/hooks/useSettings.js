// src/hooks/useSettings.js
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { loadSettings, saveSettings, loadSettingsForUser, saveSettingsForUser } from "../utils/storage";
import { getActiveUser, updateUserDisplayName } from "../utils/authStore";
import { updateAccountDisplayName } from "../utils/accountSwitcher";
import { loadFamilyContext, saveFamilyContext } from "../utils/familyContext";
import { getKVAdapter } from "../utils/kvAdapter";

const DEFAULT_FORM = {
  child_name: "",
  base_allowance: 80000,
  recurring_extras: [],
  school: {
    days: ["mon", "tue", "wed", "thu", "fri"],
    fare: 1160,
    round_trip: true,
    holiday_attend: false,
    bus_routes: [],
    bus_stops: { from: "", to: "" }
  },
  academy: {
    days: [],
    fare: 1160,
    round_trip: true,
    holiday_attend: true,
    bus_routes: [],
    bus_stops: { from: "", to: "" }
  }
};

/**
 * 설정 폼 상태 관리 훅
 * @param {"first"|"edit"} mode
 * @param {Function} onSaved - 저장 완료 콜백
 */
export function useSettings(mode, onSaved) {
  const userId = getActiveUser(); // computed each render (cheap)
  const userIdRef = useRef(userId);
  useEffect(() => { userIdRef.current = userId; });
  const onSavedRef = useRef(onSaved);
  useEffect(() => { onSavedRef.current = onSaved; });
  const [form, setForm] = useState(() => {
    const existing = mode === "edit" ? (userId ? loadSettingsForUser(userId) : loadSettings()) : null;
    if (!existing) {
      return { ...DEFAULT_FORM, recurring_extras: [], school: { ...DEFAULT_FORM.school }, academy: { ...DEFAULT_FORM.academy } };
    }
    const merged = {
      ...DEFAULT_FORM,
      child_name: existing.child_name,
      base_allowance: existing.base_allowance,
      recurring_extras: existing.recurring_extras ?? [],
      school: { ...DEFAULT_FORM.school, ...existing.school },
      academy: { ...DEFAULT_FORM.academy, ...existing.academy }
    };
    // After merge, validate types
    if (!Array.isArray(merged.school.bus_routes)) merged.school.bus_routes = [];
    if (!Array.isArray(merged.academy.bus_routes)) merged.academy.bus_routes = [];
    if (typeof merged.school.bus_stops !== 'object' || merged.school.bus_stops === null) merged.school.bus_stops = { from: "", to: "" };
    if (typeof merged.academy.bus_stops !== 'object' || merged.academy.bus_stops === null) merged.academy.bus_stops = { from: "", to: "" };
    return merged;
  });
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; });
  const [original] = useState(() => JSON.stringify(form));
  const [existing] = useState(() => mode === "edit" ? (userId ? loadSettingsForUser(userId) : loadSettings()) : null);

  const isDirty = useMemo(() => JSON.stringify(form) !== original, [form, original]);

  const updateField = useCallback((path, value) => {
    setForm(prev => {
      const keys = path.split(".");
      if (keys.length === 1) return { ...prev, [keys[0]]: value };
      // Deep set
      const result = { ...prev };
      let obj = result;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return result;
    });
  }, []);

  const save = useCallback(async () => {
    const currentForm = formRef.current;
    const now = new Date().toISOString();
    const settings = {
      ...currentForm,
      version: 1,
      created_at: existing?.created_at ?? now,
      updated_at: now
    };
    const currentUserId = userIdRef.current;
    const result = currentUserId ? saveSettingsForUser(currentUserId, settings) : saveSettings(settings);
    if (result.success) {
      // 자녀 이름이 변경되었으면 로그인 화면 + 가족 서버도 동기화
      if (currentUserId && currentForm.child_name?.trim()) {
        const trimmedName = currentForm.child_name.trim();
        updateUserDisplayName(currentUserId, trimmedName);

        // 가족 서버 멤버 이름도 동기화
        const ctx = loadFamilyContext();
        if (ctx?.family_id && ctx?.member_id) {
          try {
            const adapter = getKVAdapter();
            adapter.setFamilyCode(ctx.family_code);
            await adapter.patchMember(ctx.family_id, ctx.member_id, { display_name: trimmedName });
            saveFamilyContext({ ...ctx, member_display_name: trimmedName });
            updateAccountDisplayName(ctx.member_id, trimmedName);
          } catch { /* 실패해도 로컬 저장은 완료됨 */ }
        }
      }
      onSavedRef.current?.(settings);
      return { success: true };
    }
    return { success: false, error: "STORAGE_FULL" };
  }, [existing]);

  return { form, updateField, isDirty, save };
}
