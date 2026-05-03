// src/components/modals/SettingsModal.jsx
// S-101 (첫 설정) / S-102 (재설정) 통합 모달
import { useState, useEffect, useCallback } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useToast } from "../../hooks/useToast";
import { validateSettings } from "../../utils/validators";
import CurrencyInput from "../inputs/CurrencyInput";
import WeekdayPicker from "../inputs/WeekdayPicker";
import RadioGroup from "../inputs/RadioGroup";

/**
 * @param {Object} props
 * @param {"first"|"edit"} props.mode
 * @param {Function} props.onSaved - 저장 완료 콜백
 * @param {Function} [props.onClose] - 닫기 콜백 (edit 모드만)
 */
export default function SettingsModal({ mode, onSaved, onClose }) {
  const { form, updateField, isDirty, save } = useSettings(mode, onSaved);
  const { showToast } = useToast();
  const [errors, setErrors] = useState({});

  const isFirst = mode === "first";
  const title = isFirst ? "처음 시작합니다 👋" : "자녀 정보 변경";
  const saveLabel = isFirst ? "저장하고 시작하기" : "저장";
  const academyDisabled = form.academy.days.length === 0;

  const handleClose = useCallback(() => {
    if (!onClose) return;
    // isDirty 검사는 Phase 4 S-106에서 구현
    onClose();
  }, [onClose]);

  // ESC 키 처리 (S-101: 차단, S-102: 닫기)
  useEffect(() => {
    if (isFirst) return;
    const handler = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFirst, handleClose]);

  const handleSave = useCallback(() => {
    const validation = validateSettings(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    const result = save();
    if (result.success) {
      showToast({ type: "success", message: isFirst ? "설정이 저장되었습니다! 시작해볼까요?" : "설정이 변경되었습니다." });
    } else {
      showToast({ type: "error", message: "저장 공간이 부족합니다." });
    }
  }, [form, save, showToast, isFirst]);

  // 외부 클릭 (S-101: 차단)
  const handleBackdropClick = useCallback((e) => {
    if (isFirst) return;
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [isFirst, handleClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="modal-content bg-white rounded-xl w-full max-w-lg"
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="text-lg font-bold">{title}</h2>
          {!isFirst && (
            <button onClick={handleClose} aria-label="닫기" className="text-xl px-2 py-1 rounded hover:bg-gray-100">×</button>
          )}
        </div>

        {/* 폼 */}
        <div className="px-5 py-4 flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: "calc(90dvh - 130px)" }}>
          {/* 자녀 이름 */}
          <div className="flex flex-col gap-1">
            <label htmlFor="child_name" className="text-sm font-medium">자녀 이름 (선택)</label>
            <input
              id="child_name"
              type="text"
              maxLength={20}
              value={form.child_name}
              onChange={(e) => updateField("child_name", e.target.value)}
              placeholder="예: 자녀A (비워둬도 OK)"
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: errors.child_name ? "var(--color-error)" : "var(--color-border)" }}
            />
            {errors.child_name && <p className="text-xs" style={{ color: "var(--color-error)" }}>{errors.child_name}</p>}
          </div>

          {/* 기본 용돈 */}
          <CurrencyInput
            id="base_allowance"
            label="월 기본 용돈"
            value={form.base_allowance}
            onChange={(v) => updateField("base_allowance", v)}
            max={1000000}
            error={errors.base_allowance}
          />

          {/* 학교 섹션 */}
          <div className="flex flex-col gap-3 p-4 rounded-lg" style={{ background: "var(--color-bg-secondary)" }}>
            <WeekdayPicker
              label="🏫 학교 등교 요일"
              value={form.school.days}
              onChange={(v) => updateField("school.days", v)}
            />
            <CurrencyInput
              id="school_fare"
              label="🏫 학교 단가 (편도)"
              value={form.school.fare}
              onChange={(v) => updateField("school.fare", v)}
              max={100000}
              error={errors["school.fare"]}
            />
            <RadioGroup
              name="school_round_trip"
              label="🏫 학교 왕복 여부"
              options={[
                { value: true, label: "왕복" },
                { value: false, label: "편도" }
              ]}
              value={form.school.round_trip}
              onChange={(v) => updateField("school.round_trip", v)}
            />
            <RadioGroup
              name="school_holiday"
              label="🏫 공휴일 등교 여부"
              options={[
                { value: false, label: "등교 안 함" },
                { value: true, label: "등교 함" }
              ]}
              value={form.school.holiday_attend}
              onChange={(v) => updateField("school.holiday_attend", v)}
            />
          </div>

          {/* 학원 섹션 */}
          <div className="flex flex-col gap-3 p-4 rounded-lg" style={{ background: "var(--color-bg-secondary)" }}>
            <WeekdayPicker
              label="📚 학원 등원 요일"
              value={form.academy.days}
              onChange={(v) => updateField("academy.days", v)}
              includeSatSun={true}
            />
            {academyDisabled && (
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                학원 등원 요일을 선택하면 단가를 입력할 수 있습니다
              </p>
            )}
            <CurrencyInput
              id="academy_fare"
              label="📚 학원 단가 (편도)"
              value={form.academy.fare}
              onChange={(v) => updateField("academy.fare", v)}
              max={100000}
              error={errors["academy.fare"]}
              disabled={academyDisabled}
            />
            <RadioGroup
              name="academy_round_trip"
              label="📚 학원 왕복 여부"
              options={[
                { value: true, label: "왕복" },
                { value: false, label: "편도" }
              ]}
              value={form.academy.round_trip}
              onChange={(v) => updateField("academy.round_trip", v)}
              disabled={academyDisabled}
            />
            <RadioGroup
              name="academy_holiday"
              label="📚 공휴일 등원 여부"
              options={[
                { value: true, label: "등원 함" },
                { value: false, label: "등원 안 함" }
              ]}
              value={form.academy.holiday_attend}
              onChange={(v) => updateField("academy.holiday_attend", v)}
              disabled={academyDisabled}
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          {!isFirst && (
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-primary)" }}
            >
              취소
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white"
            style={{ background: "var(--color-primary)" }}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
