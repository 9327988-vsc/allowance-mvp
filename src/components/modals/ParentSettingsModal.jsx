// src/components/modals/ParentSettingsModal.jsx
// 부모 계정 맞춤 설정 모달 (테마 + 커스터마이징 10개 옵션)
import { useState } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { loadTheme, setTheme } from "../../utils/theme";
import { useUserPrefs } from "../../hooks/useUserPrefs";
import { updateUserAvatar } from "../../utils/authStore";
import { getActiveUser } from "../../utils/authStore";
import { ACCENT_PRESETS } from "../../utils/userPrefs";

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
 * @param {Function} props.onClose - 닫기 콜백
 */
export default function ParentSettingsModal({ onClose }) {
  const [currentTheme, setCurrentTheme] = useState(loadTheme);
  const { prefs, updatePref } = useUserPrefs();

  // useModalBase: scroll lock + focus trap + ESC
  const modalRef = useModalBase(onClose);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        tabIndex={-1}
        className="modal-content"
        style={{ maxWidth: 480, width: "90%", padding: 0 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="맞춤 설정"
      >
        {/* 헤더 */}
        <div className="modal-header">
          <h2 className="modal-title">맞춤 설정</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        {/* 본문 */}
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", overflowY: "auto", maxHeight: "calc(90dvh - 130px)" }}>
          {/* 테마 토글 */}
          <div style={{ paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--color-border)" }}>
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

          {/* 맞춤 설정 옵션들 */}
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
        </div>

        {/* 하단 닫기 버튼 */}
        <div className="modal-footer modal-footer--stretch">
          <button onClick={onClose} className="btn btn--primary">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
