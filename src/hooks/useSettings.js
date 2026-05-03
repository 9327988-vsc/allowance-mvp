// src/hooks/useSettings.js
import { useState, useCallback } from "react";
import { loadSettings, saveSettings } from "../utils/storage";

const DEFAULT_FORM = {
  child_name: "",
  base_allowance: 80000,
  school: {
    days: ["mon", "tue", "wed", "thu", "fri"],
    fare: 1160,
    round_trip: true,
    holiday_attend: false
  },
  academy: {
    days: [],
    fare: 1160,
    round_trip: true,
    holiday_attend: true
  }
};

/**
 * 설정 폼 상태 관리 훅
 * @param {"first"|"edit"} mode
 * @param {Function} onSaved - 저장 완료 콜백
 */
export function useSettings(mode, onSaved) {
  const existing = mode === "edit" ? loadSettings() : null;
  const initial = existing
    ? {
        child_name: existing.child_name,
        base_allowance: existing.base_allowance,
        school: { ...existing.school },
        academy: { ...existing.academy }
      }
    : { ...DEFAULT_FORM, school: { ...DEFAULT_FORM.school }, academy: { ...DEFAULT_FORM.academy } };

  const [form, setForm] = useState(initial);
  const [original] = useState(JSON.stringify(initial));

  const isDirty = JSON.stringify(form) !== original;

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

  const save = useCallback(() => {
    const now = new Date().toISOString();
    const settings = {
      ...form,
      version: 1,
      created_at: existing?.created_at ?? now,
      updated_at: now
    };
    const result = saveSettings(settings);
    if (result) {
      onSaved?.(settings);
      return { success: true };
    }
    return { success: false, error: "STORAGE_FULL" };
  }, [form, existing, onSaved]);

  return { form, updateField, isDirty, save };
}
