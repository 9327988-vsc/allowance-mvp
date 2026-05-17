// src/components/GeneralMainScreen.jsx — 일반계정 메인 화면
import { useState } from "react";
import { logout } from "../utils/accountSwitcher";
import { findUserById, getActiveUser } from "../utils/authStore";
import { loadTheme, toggleTheme } from "../utils/theme";
import { loadSettingsForUser, saveSettingsForUser } from "../utils/storage";
import { useGeneralCalendar } from "../hooks/useGeneralCalendar";
import MonthNavigator from "./MonthNavigator";
import CalendarGrid from "./CalendarGrid";
import GeneralSummaryCards from "./GeneralSummaryCards";
import GeneralCellEditModal from "./modals/GeneralCellEditModal";
import BudgetSettingsModal from "./modals/BudgetSettingsModal";
import SpendingStatsModal from "./modals/SpendingStatsModal";
import SettingsModal from "./modals/SettingsModal";

export default function GeneralMainScreen({ onLogout }) {
  const [currentTheme, setCurrentTheme] = useState(loadTheme);
  const [showSettings, setShowSettings] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [editingCell, setEditingCell] = useState(null);

  const activeUser = findUserById(getActiveUser());
  const userId = activeUser?.user_id;

  // 유저 설정 (예산 포함)
  const [userSettings, setUserSettings] = useState(() => loadSettingsForUser(userId) || {});
  const budget = userSettings.monthly_budget || 0;

  const {
    viewYear, viewMonth, calendar, calc,
    todayY, todayM, nextDisabled,
    goToPrevMonth, goToNextMonth, goToMonth,
    saveCell, refresh,
  } = useGeneralCalendar();

  function handleCellClick(cell) {
    setEditingCell(cell);
  }

  function handleCellSave(date, cellData) {
    saveCell(date, cellData);
    setEditingCell(null);
  }

  function handleBudgetSave(newSettings) {
    setUserSettings(newSettings);
    setShowBudget(false);
  }

  return (
    <div className="app-container">
      {/* 헤더 */}
      <header className="main-header">
        <span className="main-header__display-name">
          {activeUser?.avatar_emoji || "👤"} {activeUser?.display_name || "사용자"}
        </span>
      </header>

      {/* 월별 요약 카드 */}
      <GeneralSummaryCards calc={calc} budget={budget} />

      {/* 월 네비게이터 */}
      <MonthNavigator
        year={viewYear}
        month={viewMonth}
        nextDisabled={nextDisabled}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onMonthClick={() => goToMonth(todayY, todayM)}
      />

      {/* 캘린더 */}
      <CalendarGrid
        year={viewYear}
        month={viewMonth}
        calc={calc}
        todayY={todayY}
        todayM={todayM}
        onCellClick={handleCellClick}
        mode="general"
      />

      {/* 하단 액션바 */}
      <div className="parent-action-bar">
        <button
          className="parent-action-bar__btn"
          onClick={() => setShowBudget(true)}
          aria-label="예산 관리"
        >
          <span className="parent-action-bar__icon">📊</span>
          <span className="parent-action-bar__label">예산</span>
        </button>
        <button
          className="parent-action-bar__btn"
          onClick={() => setShowStats(true)}
          aria-label="지출 통계"
        >
          <span className="parent-action-bar__icon">📈</span>
          <span className="parent-action-bar__label">통계</span>
        </button>
        <button
          className="parent-action-bar__btn"
          onClick={() => { const next = toggleTheme(); setCurrentTheme(next); }}
          aria-label={currentTheme === "dark" ? "라이트 모드" : "다크 모드"}
        >
          <span className="parent-action-bar__icon">{currentTheme === "dark" ? "☀️" : "🌙"}</span>
          <span className="parent-action-bar__label">{currentTheme === "dark" ? "라이트" : "다크"}</span>
        </button>
        <button
          className="parent-action-bar__btn"
          onClick={() => setShowSettings(true)}
          aria-label="맞춤 설정"
        >
          <span className="parent-action-bar__icon">🎨</span>
          <span className="parent-action-bar__label">설정</span>
        </button>
        {onLogout && (
          <button
            className="parent-action-bar__btn"
            onClick={() => { logout(); onLogout(); }}
            aria-label="계정 전환"
          >
            <span className="parent-action-bar__icon">👤</span>
            <span className="parent-action-bar__label">계정</span>
          </button>
        )}
      </div>

      {/* 셀 편집 모달 */}
      {editingCell && (
        <GeneralCellEditModal
          cell={editingCell}
          calendar={calendar}
          onSave={handleCellSave}
          onClose={() => setEditingCell(null)}
        />
      )}

      {/* 예산 설정 모달 */}
      {showBudget && (
        <BudgetSettingsModal
          userId={userId}
          onClose={() => setShowBudget(false)}
          onSaved={handleBudgetSave}
        />
      )}

      {/* 지출 통계 모달 */}
      {showStats && (
        <SpendingStatsModal
          role="general"
          onClose={() => setShowStats(false)}
        />
      )}

      {/* 설정 모달 */}
      {showSettings && (
        <SettingsModal mode="edit" role="general" onClose={() => setShowSettings(false)} onSaved={() => setShowSettings(false)} />
      )}
    </div>
  );
}
