// src/components/modals/SettingsModal.jsx
// S-101 (첫 설정) / S-102 (재설정) 통합 모달
import { useState, useEffect, useCallback } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useToast } from "../../hooks/useToast";
import { validateSettings } from "../../utils/validators";
import { loadTheme, setTheme } from "../../utils/theme";
import { useUserPrefs } from "../../hooks/useUserPrefs";
import { updateUserAvatar } from "../../utils/authStore";
import { getActiveUser } from "../../utils/authStore";
import { ACCENT_PRESETS } from "../../utils/userPrefs";
import CurrencyInput from "../inputs/CurrencyInput";
import WeekdayPicker from "../inputs/WeekdayPicker";
import RadioGroup from "../inputs/RadioGroup";
import RecurringExtrasModal from "./RecurringExtrasModal";

const EMOJI_OPTIONS = ["🧒","👨‍👩‍👧","🦊","🐰","🐻","🦁","🐯","🐸","🐵","🐧","🐱","🐶","🦄","🐼","🐨","🐹"];
const ACCENT_LABELS = { indigo: "인디고", blue: "블루", green: "그린", pink: "핑크", orange: "오렌지", red: "레드" };
const BG_LABELS = { default: "기본", warm: "따뜻한", cool: "시원한" };
const FONT_LABELS = { small: "작게", normal: "보통", large: "크게" };
const BORDER_LABELS = { round: "둥글게", more_round: "더 둥글게", sharp: "각지게" };
const ANIM_LABELS = { on: "켜기", reduced: "줄이기", off: "끄기" };
const CELL_SIZE_LABELS = { small: "작게", normal: "보통", large: "크게" };
const HEADER_LABELS = { gradient: "그라디언트", solid: "단색" };

/**
 * @param {Object} props
 * @param {"first"|"edit"} props.mode
 * @param {Function} props.onSaved - 저장 완료 콜백
 * @param {Function} [props.onClose] - 닫기 콜백 (edit 모드만)
 */
export default function SettingsModal({ mode, role, onSaved, onClose, onRecurringSaved }) {
  const { form, updateField, isDirty, save } = useSettings(mode, onSaved);
  const { showToast } = useToast();
  const [errors, setErrors] = useState({});
  const [currentTheme, setCurrentTheme] = useState(loadTheme);
  const { prefs, updatePref } = useUserPrefs();
  const [showRecurring, setShowRecurring] = useState(false);
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);

  const isFirst = mode === "first";
  const isGeneral = role === "general";
  const title = isFirst ? "처음 시작합니다 👋" : isGeneral ? "맞춤 설정" : "자녀 정보 변경";
  const saveLabel = isFirst ? "저장하고 시작하기" : "저장";
  const schoolDisabled = (form.school.days || []).length === 0;
  const academyDisabled = (form.academy.days || []).length === 0;

  const handleClose = useCallback(() => {
    if (!onClose) return;
    if (isDirty) {
      setShowDirtyConfirm(true);
      return;
    }
    onClose();
  }, [onClose, isDirty]);

  // ESC 키 처리 (S-101: 차단, S-102: 닫기)
  useEffect(() => {
    if (isFirst) return;
    const handler = (e) => {
      if (e.key === "Escape") {
        if (showRecurring) return; // RecurringExtrasModal이 처리
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFirst, handleClose, showRecurring]);

  const handleSave = useCallback(async () => {
    // 일반 계정은 자녀 설정 검증 건너뛰기
    if (!isGeneral) {
      const validation = validateSettings(form);
      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }
    }
    setErrors({});
    const result = await save();
    if (result.success) {
      showToast({ type: "success", message: isFirst ? "설정이 저장되었습니다! 시작해볼까요?" : "설정이 변경되었습니다." });
    } else {
      showToast({ type: "error", message: "저장 공간이 부족합니다." });
    }
  }, [form, save, showToast, isFirst, isGeneral]);

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
        className="modal-content"
        style={{ maxWidth: 480, width: "90%", padding: 0 }}
      >
        {/* 헤더 */}
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {!isFirst && (
            <button onClick={handleClose} className="modal-close" aria-label="닫기">×</button>
          )}
        </div>

        {/* 폼 */}
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", overflowY: "auto", maxHeight: "calc(90dvh - 130px)" }}>
          {/* 자녀 전용 섹션 (일반 계정에서는 숨김) */}
          {!isGeneral && <>
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

          {/* 임시 항목 한도 (선택) */}
          <CurrencyInput
            id="spending_limit"
            label="임시 항목 한도 (선택)"
            value={form.spending_limit || 0}
            onChange={(v) => updateField("spending_limit", v)}
            max={10000000}
            placeholder="0 = 한도 없음"
          />

          {/* 학교 섹션 */}
          <div className="flex flex-col gap-3 p-4 rounded-lg" style={{ background: "var(--color-bg-secondary)" }}>
            <WeekdayPicker
              label="🏫 학교 등교 요일"
              value={form.school.days}
              onChange={(v) => updateField("school.days", v)}
            />
            {schoolDisabled && (
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                학교 등교 요일을 선택하면 단가를 입력할 수 있습니다
              </p>
            )}
            <CurrencyInput
              id="school_fare"
              label="🏫 학교 단가 (편도)"
              value={form.school.fare}
              onChange={(v) => updateField("school.fare", v)}
              max={100000}
              error={errors["school.fare"]}
              disabled={schoolDisabled}
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
              disabled={schoolDisabled}
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
              disabled={schoolDisabled}
            />
            {/* 버스 노선 정보 */}
            <div className="flex flex-col gap-2" style={{ marginTop: "var(--space-2)", paddingTop: "var(--space-2)", borderTop: "1px dashed var(--color-border)" }}>
              <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>🚌 버스 노선 정보</p>
              <div className="flex flex-col gap-1">
                <label htmlFor="school_bus_routes" className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>탑승 노선 (쉼표로 구분)</label>
                <input
                  id="school_bus_routes"
                  type="text"
                  maxLength={100}
                  value={(form.school.bus_routes || []).join(", ")}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const routes = raw.split(",").map(s => s.trim());
                    updateField("school.bus_routes", routes.length === 1 && routes[0] === "" ? [] : routes);
                  }}
                  onBlur={(e) => {
                    const routes = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                    updateField("school.bus_routes", routes);
                  }}
                  placeholder="예: 720, 301"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1" style={{ flex: 1 }}>
                  <label htmlFor="school_bus_from" className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>출발 정류장</label>
                  <input
                    id="school_bus_from"
                    type="text"
                    maxLength={30}
                    value={form.school.bus_stops?.from || ""}
                    onChange={(e) => updateField("school.bus_stops", { ...form.school.bus_stops, from: e.target.value })}
                    placeholder="예: 집 앞"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
                <div className="flex flex-col gap-1" style={{ flex: 1 }}>
                  <label htmlFor="school_bus_to" className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>도착 정류장</label>
                  <input
                    id="school_bus_to"
                    type="text"
                    maxLength={30}
                    value={form.school.bus_stops?.to || ""}
                    onChange={(e) => updateField("school.bus_stops", { ...form.school.bus_stops, to: e.target.value })}
                    placeholder="예: 학교 앞"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
              </div>
              {(() => {
                const validRoutes = (form.school.bus_routes || []).filter(Boolean);
                return validRoutes.length > 0 && (
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  🔄 환승 {Math.max(0, validRoutes.length - 1)}회
                  {validRoutes.length === 1 && " (직행)"}
                </p>
              );
              })()}
            </div>
          </div>

          {/* 학원 섹션 */}
          <div className="flex flex-col gap-3 p-4 rounded-lg" style={{ background: "var(--color-bg-secondary)" }}>
            <WeekdayPicker
              label="✏️ 학원 등원 요일"
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
              label="✏️ 학원 단가 (편도)"
              value={form.academy.fare}
              onChange={(v) => updateField("academy.fare", v)}
              max={100000}
              error={errors["academy.fare"]}
              disabled={academyDisabled}
            />
            <RadioGroup
              name="academy_round_trip"
              label="✏️ 학원 왕복 여부"
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
              label="✏️ 공휴일 등원 여부"
              options={[
                { value: true, label: "등원 함" },
                { value: false, label: "등원 안 함" }
              ]}
              value={form.academy.holiday_attend}
              onChange={(v) => updateField("academy.holiday_attend", v)}
              disabled={academyDisabled}
            />
            {/* 버스 노선 정보 */}
            {!academyDisabled && (
              <div className="flex flex-col gap-2" style={{ marginTop: "var(--space-2)", paddingTop: "var(--space-2)", borderTop: "1px dashed var(--color-border)" }}>
                <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>🚌 버스 노선 정보</p>
                <div className="flex flex-col gap-1">
                  <label htmlFor="academy_bus_routes" className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>탑승 노선 (쉼표로 구분)</label>
                  <input
                    id="academy_bus_routes"
                    type="text"
                    maxLength={100}
                    value={(form.academy.bus_routes || []).join(", ")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const routes = raw.split(",").map(s => s.trim());
                      updateField("academy.bus_routes", routes.length === 1 && routes[0] === "" ? [] : routes);
                    }}
                    onBlur={(e) => {
                      const routes = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      updateField("academy.bus_routes", routes);
                    }}
                    placeholder="예: 720, 301"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1" style={{ flex: 1 }}>
                    <label htmlFor="academy_bus_from" className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>출발 정류장</label>
                    <input
                      id="academy_bus_from"
                      type="text"
                      maxLength={30}
                      value={form.academy.bus_stops?.from || ""}
                      onChange={(e) => updateField("academy.bus_stops", { ...form.academy.bus_stops, from: e.target.value })}
                      placeholder="예: 집 앞"
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1" style={{ flex: 1 }}>
                    <label htmlFor="academy_bus_to" className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>도착 정류장</label>
                    <input
                      id="academy_bus_to"
                      type="text"
                      maxLength={30}
                      value={form.academy.bus_stops?.to || ""}
                      onChange={(e) => updateField("academy.bus_stops", { ...form.academy.bus_stops, to: e.target.value })}
                      placeholder="예: 학원 앞"
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                </div>
                {(() => {
                  const validRoutes = (form.academy.bus_routes || []).filter(Boolean);
                  return validRoutes.length > 0 && (
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    🔄 환승 {Math.max(0, validRoutes.length - 1)}회
                    {validRoutes.length === 1 && " (직행)"}
                  </p>
                );
                })()}
              </div>
            )}
          </div>

          {/* 정기 추가 용돈 바로가기 */}
          <button
            type="button"
            onClick={() => setShowRecurring(true)}
            className="btn btn--ghost"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-lg, 12px)",
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)" }}>
              💵 정기 추가 용돈 관리
            </span>
            <span style={{ color: "var(--color-text-tertiary)" }}>▶</span>
          </button>
          </>}

          {/* 테마 설정 */}
          <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)" }}>
                {currentTheme === "dark" ? "🌙 다크 모드" : "☀️ 라이트 모드"}
              </span>
              <button
                type="button"
                onClick={() => { const next = currentTheme === "dark" ? "light" : "dark"; setTheme(next); setCurrentTheme(next); }}
                className="btn btn--ghost"
                style={{ padding: "var(--space-1) var(--space-3)", minHeight: "auto" }}
              >
                전환
              </button>
            </label>
          </div>

          {/* ── 맞춤 설정 ── */}
          {!isFirst && (
            <div className="custom-prefs-section">
              <h3 className="custom-prefs-title">🎨 맞춤 설정</h3>

              {/* 테마 컬러 */}
              <div className="custom-prefs-group">
                <span className="custom-prefs-label">테마 컬러</span>
                <div className="custom-prefs-colors">
                  {Object.entries(ACCENT_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      className={`custom-prefs-color-btn${prefs.accent === key ? " custom-prefs-color-btn--active" : ""}`}
                      style={{ background: preset.primary }}
                      onClick={() => updatePref("accent", key)}
                      title={ACCENT_LABELS[key]}
                      aria-label={ACCENT_LABELS[key]}
                    >
                      {prefs.accent === key && "✓"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 배경 스타일 */}
              <div className="custom-prefs-group">
                <span className="custom-prefs-label">배경 스타일</span>
                <div className="custom-prefs-toggle-row">
                  {Object.entries(BG_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`custom-prefs-toggle${prefs.bg_style === key ? " custom-prefs-toggle--active" : ""}`}
                      onClick={() => updatePref("bg_style", key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 글꼴 크기 */}
              <div className="custom-prefs-group">
                <span className="custom-prefs-label">글꼴 크기</span>
                <div className="custom-prefs-toggle-row">
                  {Object.entries(FONT_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`custom-prefs-toggle${prefs.font_size === key ? " custom-prefs-toggle--active" : ""}`}
                      onClick={() => updatePref("font_size", key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 프로필 이모지 */}
              <div className="custom-prefs-group">
                <span className="custom-prefs-label">프로필 이모지</span>
                <div className="custom-prefs-emoji-grid">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`custom-prefs-emoji${prefs.emoji === em ? " custom-prefs-emoji--active" : ""}`}
                      onClick={() => {
                        updatePref("emoji", em);
                        const uid = getActiveUser();
                        if (uid) updateUserAvatar(uid, em);
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* 캘린더 시작 요일 */}
              <div className="custom-prefs-group">
                <span className="custom-prefs-label">캘린더 시작 요일</span>
                <div className="custom-prefs-toggle-row">
                  <button
                    type="button"
                    className={`custom-prefs-toggle${prefs.calendar_start === "sunday" ? " custom-prefs-toggle--active" : ""}`}
                    onClick={() => updatePref("calendar_start", "sunday")}
                  >
                    일요일
                  </button>
                  <button
                    type="button"
                    className={`custom-prefs-toggle${prefs.calendar_start === "monday" ? " custom-prefs-toggle--active" : ""}`}
                    onClick={() => updatePref("calendar_start", "monday")}
                  >
                    월요일
                  </button>
                </div>
              </div>

              {/* 금액 표시 */}
              <div className="custom-prefs-group">
                <span className="custom-prefs-label">금액 표시</span>
                <div className="custom-prefs-toggle-row">
                  <button
                    type="button"
                    className={`custom-prefs-toggle${prefs.amount_format === "won" ? " custom-prefs-toggle--active" : ""}`}
                    onClick={() => updatePref("amount_format", "won")}
                  >
                    10,000원
                  </button>
                  <button
                    type="button"
                    className={`custom-prefs-toggle${prefs.amount_format === "man" ? " custom-prefs-toggle--active" : ""}`}
                    onClick={() => updatePref("amount_format", "man")}
                  >
                    1만원
                  </button>
                </div>
              </div>

              {/* 카드 모서리 스타일 */}
              <div className="custom-prefs-group">
                <span className="custom-prefs-label">카드 모서리</span>
                <div className="custom-prefs-toggle-row">
                  {Object.entries(BORDER_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`custom-prefs-toggle${prefs.border_style === key ? " custom-prefs-toggle--active" : ""}`}
                      onClick={() => updatePref("border_style", key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 애니메이션 효과 */}
              <div className="custom-prefs-group">
                <span className="custom-prefs-label">애니메이션 효과</span>
                <div className="custom-prefs-toggle-row">
                  {Object.entries(ANIM_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`custom-prefs-toggle${prefs.animation === key ? " custom-prefs-toggle--active" : ""}`}
                      onClick={() => updatePref("animation", key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 캘린더 셀 크기 */}
              <div className="custom-prefs-group">
                <span className="custom-prefs-label">캘린더 셀 크기</span>
                <div className="custom-prefs-toggle-row">
                  {Object.entries(CELL_SIZE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`custom-prefs-toggle${prefs.cell_size === key ? " custom-prefs-toggle--active" : ""}`}
                      onClick={() => updatePref("cell_size", key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 헤더 스타일 */}
              <div className="custom-prefs-group">
                <span className="custom-prefs-label">헤더 스타일</span>
                <div className="custom-prefs-toggle-row">
                  {Object.entries(HEADER_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`custom-prefs-toggle${prefs.header_style === key ? " custom-prefs-toggle--active" : ""}`}
                      onClick={() => updatePref("header_style", key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="modal-footer modal-footer--stretch">
          {!isFirst && (
            <button onClick={handleClose} className="btn btn--secondary">
              취소
            </button>
          )}
          <button onClick={handleSave} className="btn btn--primary">
            {saveLabel}
          </button>
        </div>
      </div>

      {showDirtyConfirm && (
        <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-3)" }} onClick={() => setShowDirtyConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: 360, width: "90%" }} onClick={e => e.stopPropagation()}>
            <p className="mb-3">저장하지 않은 변경사항이 있어요. 정말 닫을까요?</p>
            <div className="flex justify-end gap-2">
              <button className="btn btn--secondary" onClick={() => setShowDirtyConfirm(false)}>취소</button>
              <button className="btn btn--primary" onClick={() => { setShowDirtyConfirm(false); onClose(); }}>확인</button>
            </div>
          </div>
        </div>
      )}

      {showRecurring && (
        <RecurringExtrasModal
          onClose={() => setShowRecurring(false)}
          onSaved={(updatedSettings) => {
            setShowRecurring(false);
            if (onRecurringSaved) onRecurringSaved(updatedSettings);
          }}
        />
      )}
    </div>
  );
}
