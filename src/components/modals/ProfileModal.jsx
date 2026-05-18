// src/components/modals/ProfileModal.jsx — 프로필 + 오늘의 기분
import { useState, useEffect, useMemo, useCallback } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { getActiveUser } from "../../utils/authStore";
import { loadUserPrefs, saveUserPrefs, ACCENT_PRESETS } from "../../utils/userPrefs";
import { loadFamilyContext } from "../../utils/familyContext";
import { loadCalendarMonth, saveCalendarMonth } from "../../utils/storage";
import { showToast } from "../../utils/toastManager";
import { getMoodEmoji } from "../../constants/moods";
import MoodPicker from "../widgets/MoodPicker";
import MoodSummary from "../widgets/MoodSummary";

const PROFILE_EMOJIS = [
  "😊", "😎", "🤗", "🥳", "🦊", "🐱", "🐶", "🐰",
  "🌟", "🎨", "🎵", "🌈", "🍀", "🦋", "🐸", "🦄",
  "🧸", "🎯", "🏆", "💎",
];

const BIRTHDAY_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ProfileModal({ year, month, onClose }) {
  const contentRef = useModalBase(onClose);
  const userId = getActiveUser();
  const ctx = useMemo(() => loadFamilyContext(), []);
  const prefs = useMemo(() => loadUserPrefs(userId), [userId]);

  // 프로필 필드
  const [displayName, setDisplayName] = useState(prefs.display_name || ctx?.member_display_name || "");
  const [profileEmoji, setProfileEmoji] = useState(prefs.profile_emoji || "😊");
  const [statusMessage, setStatusMessage] = useState(prefs.status_message || "");
  const [birthdayMonth, setBirthdayMonth] = useState(() => {
    if (!prefs.birthday) return "";
    return prefs.birthday.split("-")[0] || "";
  });
  const [birthdayDay, setBirthdayDay] = useState(() => {
    if (!prefs.birthday) return "";
    return prefs.birthday.split("-")[1] || "";
  });
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);

  // 오늘의 기분 + 캘린더 (실시간 반영을 위해 state로 관리)
  const todayKey = `${year}-${String(month).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
  const [calendar, setCalendar] = useState(() => loadCalendarMonth(year, month));
  const [todayMood, setTodayMood] = useState(() => calendar?.cells?.[todayKey]?.mood || null);

  // 프로필 변경 감지
  const [saved, setSaved] = useState(true);
  const [initialValues] = useState(() => JSON.stringify([displayName, profileEmoji, statusMessage, birthdayMonth, birthdayDay]));

  useEffect(() => {
    const current = JSON.stringify([displayName, profileEmoji, statusMessage, birthdayMonth, birthdayDay]);
    setSaved(current === initialValues);
  }, [displayName, profileEmoji, statusMessage, birthdayMonth, birthdayDay, initialValues]);


  const handleSaveProfile = useCallback(() => {
    if (!displayName.trim()) {
      showToast({ type: "warning", message: "닉네임을 입력해주세요" });
      return;
    }
    const birthday = birthdayMonth && birthdayDay
      ? `${String(birthdayMonth).padStart(2, "0")}-${String(birthdayDay).padStart(2, "0")}`
      : "";
    const newPrefs = {
      ...prefs,
      display_name: displayName.trim(),
      profile_emoji: profileEmoji,
      status_message: statusMessage.trim(),
      birthday,
    };
    saveUserPrefs(userId, newPrefs);
    setSaved(true);
    showToast({ type: "success", message: "프로필이 저장되었습니다" });
  }, [prefs, displayName, profileEmoji, statusMessage, birthdayMonth, birthdayDay, userId]);

  function handleMoodChange(moodId) {
    setTodayMood(moodId);
    // 캘린더에 기분 저장 + state 업데이트로 MoodSummary 실시간 반영
    const cal = loadCalendarMonth(year, month);
    if (!cal.cells[todayKey]) {
      cal.cells[todayKey] = {};
    }
    cal.cells[todayKey].mood = moodId;
    const result = saveCalendarMonth(cal);
    if (result && !result.success) {
      showToast({ type: "error", message: "저장에 실패했어요" });
      return;
    }
    setCalendar({ ...cal }); // 새 참조로 MoodSummary 리렌더 트리거
    showToast({ type: "success", message: moodId ? "오늘의 기분이 기록되었어요" : "기분 기록이 삭제되었어요" });
  }

  // 가입 경과일
  const memberSince = ctx?.joined_at;
  const daysSinceJoin = useMemo(() => {
    if (!memberSince) return null;
    const diff = Date.now() - new Date(memberSince).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [memberSince]);

  // 생일 D-day
  const birthdayDday = useMemo(() => {
    if (!birthdayMonth || !birthdayDay) return null;
    const now = new Date();
    const thisYear = now.getFullYear();
    let bday = new Date(thisYear, Number(birthdayMonth) - 1, Number(birthdayDay));
    if (bday < now) bday = new Date(thisYear + 1, Number(birthdayMonth) - 1, Number(birthdayDay));
    const diff = Math.ceil((bday - now) / (1000 * 60 * 60 * 24));
    return diff === 0 ? "오늘 생일!" : `D-${diff}`;
  }, [birthdayMonth, birthdayDay]);

  // 이번 달 기분 연속 기록 계산
  const streakInfo = useMemo(() => {
    if (!calendar?.cells) return { streak: 0, totalDays: 0 };
    const today = new Date();
    let streak = 0;
    let totalDays = 0;
    let streakBroken = false;
    // 오늘부터 역순 체크
    for (let d = today.getDate(); d >= 1; d--) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (calendar.cells[key]?.mood) {
        totalDays++;
        if (!streakBroken) {
          streak++;
        }
      } else if (d <= today.getDate()) {
        if (!streakBroken) {
          streakBroken = true;
        }
      }
    }
    return { streak, totalDays };
  }, [calendar, year, month]);

  const currentAccent = prefs.accent || "indigo";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={contentRef}
        className="modal-content profile-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="프로필"
        aria-modal="true"
      >
        <div className="modal-header-row">
          <h2 className="modal-title">👤 내 프로필</h2>
          <button className="modal-close-x" onClick={onClose} aria-label="닫기">×</button>
        </div>

        {/* ── 프로필 카드 ── */}
        <div className="profile-card">
          <div className="profile-card__avatar-wrap">
            <button
              className="profile-card__avatar"
              onClick={() => setShowEmojiGrid(p => !p)}
              title="아바타 변경"
              aria-label="아바타 변경"
            >
              <span className="profile-card__avatar-emoji">{profileEmoji}</span>
              <span className="profile-card__avatar-edit">✏️</span>
            </button>
            {todayMood && (
              <span className="profile-card__mood-badge" title="오늘의 기분">
                {getMoodEmoji(todayMood)}
              </span>
            )}
          </div>
          <div className="profile-card__info">
            <span className="profile-card__name">{displayName || "이름 없음"}</span>
            {statusMessage && (
              <span className="profile-card__status">{statusMessage}</span>
            )}
            <div className="profile-card__badges">
              {ctx?.member_role && (
                <span className="profile-badge profile-badge--role">
                  {ctx.member_role === "parent" ? "👨‍👩‍👧 부모" : "🧒 자녀"}
                </span>
              )}
              {daysSinceJoin !== null && (
                <span className="profile-badge profile-badge--days">
                  함께한 지 {daysSinceJoin}일
                </span>
              )}
              {birthdayDday && (
                <span className="profile-badge profile-badge--birthday">
                  🎂 {birthdayDday}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 아바타 이모지 선택 그리드 */}
        {showEmojiGrid && (
          <div className="profile-emoji-grid">
            {PROFILE_EMOJIS.map(em => (
              <button
                key={em}
                type="button"
                className={`profile-emoji-btn${profileEmoji === em ? " profile-emoji-btn--selected" : ""}`}
                onClick={() => { setProfileEmoji(em); setShowEmojiGrid(false); }}
                aria-label={em}
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* ── 프로필 편집 ── */}
        <div className="profile-edit-section">
          <div className="profile-field">
            <label className="profile-field__label">닉네임 *</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={20}
              className="profile-field__input"
              placeholder="닉네임을 입력하세요"
            />
            <span className="profile-field__hint">{displayName.length}/20</span>
          </div>

          <div className="profile-field">
            <label className="profile-field__label">상태 메시지</label>
            <input
              type="text"
              value={statusMessage}
              onChange={e => setStatusMessage(e.target.value)}
              maxLength={40}
              className="profile-field__input"
              placeholder="오늘의 한마디를 남겨보세요"
            />
            <span className="profile-field__hint">{statusMessage.length}/40</span>
          </div>

          <div className="profile-field">
            <label className="profile-field__label">🎂 생일</label>
            <div className="profile-birthday-row">
              <select
                value={birthdayMonth}
                onChange={e => setBirthdayMonth(e.target.value)}
                className="profile-field__select"
              >
                <option value="">월</option>
                {BIRTHDAY_MONTHS.map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
              <select
                value={birthdayDay}
                onChange={e => setBirthdayDay(e.target.value)}
                className="profile-field__select"
              >
                <option value="">일</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
            </div>
          </div>

          {/* 테마 컬러 미리보기 */}
          <div className="profile-field">
            <label className="profile-field__label">🎨 테마 컬러</label>
            <div className="profile-color-row">
              {Object.entries(ACCENT_PRESETS).map(([key, preset]) => (
                <span
                  key={key}
                  className={`profile-color-dot${currentAccent === key ? " profile-color-dot--active" : ""}`}
                  style={{ background: preset.primary }}
                  title={key}
                />
              ))}
              <span className="profile-color-hint">설정에서 변경</span>
            </div>
          </div>

          <button
            className={`btn ${saved ? "btn--secondary" : "btn--primary"} profile-save-btn`}
            onClick={handleSaveProfile}
            disabled={saved}
          >
            {saved ? "✓ 저장됨" : "프로필 저장"}
          </button>
        </div>

        <hr className="profile-divider" />

        {/* ── 오늘의 기분 ── */}
        <div className="profile-mood-section">
          <div className="profile-section-header">
            <h3 className="profile-section-title">😊 오늘의 기분</h3>
            {streakInfo.streak > 0 && (
              <span className="profile-streak-badge">🔥 {streakInfo.streak}일 연속</span>
            )}
          </div>
          <MoodPicker value={todayMood} onChange={handleMoodChange} />
        </div>

        <hr className="profile-divider" />

        {/* ── 이번 달 기분 요약 ── */}
        <div className="profile-mood-section">
          <div className="profile-section-header">
            <h3 className="profile-section-title">📅 {month}월 기분 요약</h3>
            {streakInfo.totalDays > 0 && (
              <span className="profile-mood-count">{streakInfo.totalDays}일 기록</span>
            )}
          </div>
          <MoodSummary calendar={calendar} />
        </div>
      </div>
    </div>
  );
}
