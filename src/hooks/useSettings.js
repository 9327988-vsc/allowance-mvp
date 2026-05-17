// src/hooks/useSettings.js
import { useState, useCallback, useMemo } from "react";
import { loadSettings, saveSettings, loadSettingsForUser, saveSettingsForUser } from "../utils/storage";
import { getActiveUser, updateUserDisplayName } from "../utils/authStore";
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
  const [userId] = useState(() => getActiveUser());
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
  const [original] = useState(() => JSON.stringify(form));
  const [existing] = useState(() => mode === "edit" ? (userId ? loadSettingsForUser(userId) : loadSettings()) : null);

  const isDirty = useMemo(() => JSON.stringify(form) !== original, [form, original]);

  const updateField = useCallback((path, value) => {
    setForm(prev => {
      const next = { ...prev };
      if (path.includes(".")) {
        const [section, field] = path.split(".");
        next[section] = { ...prev[section], [field]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    const now = new Date().toISOString();
    const settings = {
      ...form,
      version: 1,
      created_at: existing?.created_at ?? now,
      updated_at: now
    };
    const result = userId ? saveSettingsForUser(userId, settings) : saveSettings(settings);
    if (result.success) {
      // 자녀 이름이 변경되었으면 로그인 화면 + 가족 서버도 동기화
      if (userId && form.child_name?.trim()) {
        const trimmedName = form.child_name.trim();
        updateUserDisplayName(userId, trimmedName);

        // 가족 서버 멤버 이름도 동기화
        const ctx = loadFamilyContext();
        if (ctx?.family_id && ctx?.member_id) {
          try {
            const adapter = getKVAdapter();
            adapter.setFamilyCode(ctx.family_code);
            await adapter.patchMember(ctx.family_id, ctx.member_id, { display_name: trimmedName });
            saveFamilyContext({ ...ctx, member_display_name: trimmedName });
          } catch { /* 실패해도 로컬 저장은 완료됨 */ }
        }
      }
      onSaved?.(settings);
      return { success: true };
    }
    return { success: false, error: "STORAGE_FULL" };
  }, [form, existing, onSaved, userId]);

  return { form, updateField, isDirty, save };
}
