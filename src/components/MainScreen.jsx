// src/components/MainScreen.jsx — S-001 메인 캘린더
import { useState, useCallback, useRef } from "react";
import { useCalendar } from "../hooks/useCalendar";
import { generateMessage } from "../utils/messageTemplate";
import { copyToClipboard } from "../utils/clipboard";
import { loadCustomCategories } from "../utils/storage";
import { showToast } from "../utils/toastManager";
import MonthNavigator from "./MonthNavigator";
import CalendarGrid from "./CalendarGrid";
import SummaryTable from "./SummaryTable";
import CellEditModal from "./modals/CellEditModal";
import SettingsModal from "./modals/SettingsModal";
import ClipboardFallbackModal from "./modals/ClipboardFallbackModal";
import StorageFullModal from "./modals/StorageFullModal";
import NotesDrawer from "./drawers/NotesDrawer";
import MonthSelector from "./drawers/MonthSelector";

export default function MainScreen({ settings: initialSettings, onSettingsChange }) {
  const [settings, setSettings] = useState(initialSettings);
  const {
    viewYear, viewMonth, calendar, calc, holidays,
    todayY, todayM, nextDisabled,
    goToPrevMonth, goToNextMonth, goToMonth, saveCell, refresh,
  } = useCalendar(settings);

  // 모달/드로어 상태
  const [editingCell, setEditingCell] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [clipboardFallbackText, setClipboardFallbackText] = useState(null);
  const [copying, setCopying] = useState(false);
  const [storageFull, setStorageFull] = useState(null); // S-108 pendingSave

  // 9.1 시크릿: 자녀 이름 5회 빠른 탭 → 관리자 모드
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  function handleSecretTap() {
    tapCountRef.current++;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      window.location.search = "?admin=1";
      return;
    }
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 1500);
  }

  const isEmpty = !calc || (calc.base_allowance === 0 && calc.school_total === 0 &&
    calc.academy_total === 0 && calc.extra_items_total === 0);

  // 셀 클릭 → S-103
  const handleCellClick = useCallback((cell) => {
    setEditingCell(cell);
  }, []);

  // 셀 저장
  const handleCellSave = useCallback((date, cellData) => {
    const result = saveCell(date, cellData);
    if (result.error === "QUOTA_EXCEEDED" && result.pendingSave) {
      setStorageFull(result.pendingSave);
    }
  }, [saveCell]);

  // 메시지 복사
  async function handleCopy() {
    if (!calc || isEmpty) return;
    setCopying(true);
    try {
      const customCategories = loadCustomCategories();
      const message = generateMessage(viewYear, viewMonth, calc, settings, holidays, customCategories);
      const result = await copyToClipboard(message);
      if (result.success) {
        showToast({ type: "success", message: "📋 복사 완료. 카톡에 붙여넣기 하세요" });
      } else if (result.fallbackText) {
        // S-111 클립보드 폴백
        setClipboardFallbackText(result.fallbackText);
      } else {
        showToast({ type: "error", message: "복사 실패. 수동으로 복사해주세요", duration: 5000 });
      }
    } catch {
      showToast({ type: "error", message: "복사 실패" });
    } finally {
      setCopying(false);
    }
  }

  // 설정 저장 후
  function handleSettingsSaved(newSettings) {
    setSettings(newSettings);
    setShowSettings(false);
    refresh();
    if (onSettingsChange) onSettingsChange(newSettings);
  }

  // 월 선택
  function handleMonthSelect(year, month) {
    goToMonth(year, month);
  }

  return (
    <div className="app-container main-screen">
      {/* 헤더 */}
      <header className="main-header">
        {settings.child_name ? (
          <span
            className="main-header__child-name"
            onClick={handleSecretTap}
          >
            {settings.child_name}
          </span>
        ) : (
          <span className="main-header__child-name" onClick={handleSecretTap}>
            용돈관리
          </span>
        )}
        <div className="main-header__nav">
          <MonthNavigator
            year={viewYear}
            month={viewMonth}
            nextDisabled={nextDisabled}
            onPrev={goToPrevMonth}
            onNext={goToNextMonth}
            onMonthClick={() => setShowMonthSelector(true)}
          />
        </div>
        <div className="main-header__actions">
          <button
            onClick={() => setShowSettings(true)}
            aria-label="설정"
            className="header-btn"
            title="설정"
          >
            ⚙️
          </button>
          <button
            onClick={() => setShowNotes(true)}
            aria-label="비고"
            className="header-btn"
            title="비고"
          >
            📌
          </button>
          <button
            onClick={handleCopy}
            disabled={isEmpty || copying}
            aria-label="메시지 복사"
            className={`header-btn header-btn--copy${isEmpty ? " header-btn--disabled" : ""}`}
            title="메시지 복사"
          >
            {copying ? "⏳" : "📋"}
          </button>
        </div>
      </header>

      {/* 캘린더 그리드 */}
      <CalendarGrid
        year={viewYear}
        month={viewMonth}
        calc={calc}
        todayY={todayY}
        todayM={todayM}
        onCellClick={handleCellClick}
        settings={settings}
      />

      {/* 정산표 */}
      <SummaryTable
        month={viewMonth}
        calc={calc}
        settings={settings}
      />

      {/* 하단 액션바 (모바일) */}
      <div className="action-bar-bottom mobile-only">
        <button
          onClick={handleCopy}
          disabled={isEmpty || copying}
          className={`copy-btn${isEmpty ? " copy-btn--disabled" : ""}`}
        >
          {copying ? "복사 중..." : "📋 메시지 복사"}
        </button>
      </div>

      {/* S-103 셀 편집 모달 */}
      {editingCell && (
        <CellEditModal
          cell={editingCell}
          calendar={calendar}
          onSave={handleCellSave}
          onClose={() => setEditingCell(null)}
        />
      )}

      {/* S-102 설정 모달 */}
      {showSettings && (
        <SettingsModal
          mode="edit"
          onSaved={handleSettingsSaved}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* S-201 비고 드로어 */}
      {showNotes && (
        <NotesDrawer onClose={() => setShowNotes(false)} />
      )}

      {/* S-202 월 선택기 */}
      {showMonthSelector && (
        <MonthSelector
          currentYear={viewYear}
          currentMonth={viewMonth}
          todayY={todayY}
          todayM={todayM}
          onSelect={handleMonthSelect}
          onClose={() => setShowMonthSelector(false)}
        />
      )}

      {/* S-111 클립보드 폴백 */}
      {clipboardFallbackText && (
        <ClipboardFallbackModal
          text={clipboardFallbackText}
          onClose={() => setClipboardFallbackText(null)}
        />
      )}

      {/* S-108 스토리지 부족 */}
      {storageFull && (
        <StorageFullModal
          pendingSave={storageFull}
          onClose={() => setStorageFull(null)}
          onRetrySuccess={() => refresh()}
        />
      )}
    </div>
  );
}
