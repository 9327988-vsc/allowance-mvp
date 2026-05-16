// src/components/MainScreen.jsx — S-001 메인 캘린더
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useCalendar } from "../hooks/useCalendar";
import { generateMessage } from "../utils/messageTemplate";
import { copyToClipboard } from "../utils/clipboard";
import { loadCustomCategories } from "../utils/storage";
import { showToast } from "../utils/toastManager";
import { isInFamily, loadFamilyContext } from "../utils/familyContext";
import { logout, saveCurrentAccount } from "../utils/accountSwitcher";
import { isOnline } from "../utils/onlineStatus";
import { getKVAdapter } from "../utils/kvAdapter";
import { useSyncPoller } from "../hooks/useSyncPoller";
import { createClaimSnapshot } from "../utils/createClaimSnapshot";
import { getSubmittedClaimForMonth, syncSubmittedClaims } from "../utils/submittedClaims";
import { getErrorMessage } from "../constants/errorMessages";
import { loadUserPrefs } from "../utils/userPrefs";
import { getActiveUser } from "../utils/authStore";
import { formatAmountShort } from "../utils/formatAmount";
import { generateCalendarText } from "../utils/calendarText";
import MonthNavigator from "./MonthNavigator";
import CalendarGrid from "./CalendarGrid";
import SummaryTable from "./SummaryTable";

import CellEditModal from "./modals/CellEditModal";
import SettingsModal from "./modals/SettingsModal";
import SubmitClaimModal from "./modals/SubmitClaimModal";
import FamilyOnboardingModal from "./modals/FamilyOnboardingModal";
import ClipboardFallbackModal from "./modals/ClipboardFallbackModal";
import CopyOptionsModal from "./modals/CopyOptionsModal";
import YearlyStatsModal from "./modals/YearlyStatsModal";
import StorageFullModal from "./modals/StorageFullModal";
import ProfileModal from "./modals/ProfileModal";
import MonthSelector from "./drawers/MonthSelector";
import { useClaims } from "../hooks/useClaims";
import ChoresChildModal from "./modals/ChoresChildModal";
import NotificationCenterModal from "./modals/NotificationCenterModal";
import BadgesModal from "./modals/BadgesModal";
import MoreMenu from "./widgets/MoreMenu";
import { getUnreadCount } from "../utils/notifications";

function createConfetti(confettiRef) {
  // H-28 / L-11: 이전 confetti가 있으면 제거
  if (confettiRef.current) confettiRef.current.remove();
  const emojis = ["🎉", "✨", "💰", "🎊", "⭐"];
  const container = document.createElement("div");
  confettiRef.current = container;
  container.className = "confetti-container";
  document.body.appendChild(container);
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("span");
    particle.className = "confetti-particle";
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 0.5}s`;
    particle.style.animationDuration = `${1 + Math.random() * 1.5}s`;
    particle.style.textShadow = "0 0 4px rgba(255,255,255,0.5)";
    container.appendChild(particle);
  }
  setTimeout(() => {
    container.remove();
    if (confettiRef.current === container) confettiRef.current = null;
  }, 3000);
}

export default function MainScreen({ settings: initialSettings, onSettingsChange, familyContext, onLogout }) {
  const [settings, setSettings] = useState(initialSettings);
  useEffect(() => { setSettings(initialSettings); }, [initialSettings]);
  const [startDay, setStartDay] = useState(() => {
    const uid = getActiveUser();
    const p = uid ? loadUserPrefs(uid) : {};
    return p.calendar_start === "monday" ? 1 : 0;
  });
  const {
    viewYear, viewMonth, calendar, calc, holidays,
    todayY, todayM, nextDisabled,
    goToPrevMonth, goToNextMonth, goToMonth, saveCell, refresh,
  } = useCalendar(settings);

  // 모달/드로어 상태
  const [editingCell, setEditingCell] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [clipboardFallbackText, setClipboardFallbackText] = useState(null);
  const [copying, setCopying] = useState(false);
  const [storageFull, setStorageFull] = useState(null); // S-108 pendingSave
  const [submitSnapshot, setSubmitSnapshot] = useState(null); // S-2-103
  const [submittedStatus, setSubmittedStatus] = useState(null); // 제출 후 배지 표시
  const [showOnboarding, setShowOnboarding] = useState(false); // 가족 온보딩
  const [showYearlyStats, setShowYearlyStats] = useState(false); // 연간 통계
  const [showCopyOptions, setShowCopyOptions] = useState(false); // 복사 옵션
  const [grantReceiving, setGrantReceiving] = useState(null); // 수령 확인 중인 grant ID
  const [showProfile, setShowProfile] = useState(false); // 프로필 모달
  const [showChores, setShowChores] = useState(false); // 미션 보드
  const [showNotifs, setShowNotifs] = useState(false); // 알림 센터
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount());
  const [showBadges, setShowBadges] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // 월 변경 시 submittedStatus 초기화
  useEffect(() => {
    setSubmittedStatus(null);
  }, [viewYear, viewMonth]);

  // H-28: confetti DOM cleanup on unmount
  const confettiRef = useRef(null);
  useEffect(() => {
    return () => {
      if (confettiRef.current) {
        confettiRef.current.remove();
        confettiRef.current = null;
      }
    };
  }, []);

  // 2단계: 청구 제출 (훅보다 먼저 선언)
  const inFamily = isInFamily();
  const currentSubmitted = getSubmittedClaimForMonth(viewYear, viewMonth);
  const claimStatus = submittedStatus || currentSubmitted?.status || null;

  // 자녀 자동 갱신: 30초 폴링으로 청구 상태 동기화
  const claimStatusRef = useRef(claimStatus);
  claimStatusRef.current = claimStatus;
  const pollClaimStatus = useCallback(async () => {
    if (!isOnline()) return;
    try {
      const ctx = loadFamilyContext();
      if (!ctx) return;
      const adapter = getKVAdapter();
      const { claims } = await adapter.listClaims(ctx.family_id);
      // 서버 데이터로 로컬 캐시 동기화
      syncSubmittedClaims(claims);
      const updated = getSubmittedClaimForMonth(viewYear, viewMonth);
      if (updated?.status && updated.status !== claimStatusRef.current) {
        setSubmittedStatus(updated.status);
      }
    } catch {
      // 폴링 실패는 무시
    }
  }, [viewYear, viewMonth]);

  useSyncPoller(pollClaimStatus, { interval: 30000, enabled: inFamily });

  // 추가 지급(Grant) 목록 조회
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const familyCtx = useMemo(() => loadFamilyContext(), [viewYear, viewMonth]);
  const { claims: allClaims, fetchClaims: fetchAllClaims } = useClaims(familyCtx?.family_id);
  const pendingGrants = useMemo(() =>
    allClaims.filter(c => c.type === "grant" && c.status === "granted" && c.child_member_id === familyCtx?.member_id),
    [allClaims, familyCtx]
  );

  // 추가 지급 수령 확인
  async function handleReceiveGrant(grant) {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 확인할 수 없어요" });
      return;
    }
    setGrantReceiving(grant.claim_id);
    try {
      const adapter = getKVAdapter();
      await adapter.receiveGrant(grant.claim_id, { expected_updated_at: grant.updated_at });
      showToast({ type: "success", message: `💝 ${grant.name || "추가 지급"} 수령 확인!` });
      await fetchAllClaims();
    } catch (err) {
      showToast({ type: "error", message: getErrorMessage(err.code || "NETWORK_ERROR") });
    } finally {
      setGrantReceiving(null);
    }
  }

  const isEmpty = !calc || (calc.base_allowance === 0 && calc.school_total === 0 &&
    calc.academy_total === 0 && calc.extra_items_total === 0 && (calc.recurring_extras_total || 0) === 0);

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

  // 복사 옵션 선택 후 실행
  async function handleCopyWithOption(option) {
    setShowCopyOptions(false);
    if (!calc || isEmpty) return;
    setCopying(true);
    try {
      const customCategories = loadCustomCategories();
      let text = "";
      if (option === "text") {
        text = generateMessage(viewYear, viewMonth, calc, settings, holidays, customCategories);
      } else if (option === "calendar") {
        text = generateCalendarText(viewYear, viewMonth, calc, settings, holidays);
      } else {
        // both
        const calText = generateCalendarText(viewYear, viewMonth, calc, settings, holidays);
        const msgText = generateMessage(viewYear, viewMonth, calc, settings, holidays, customCategories);
        text = calText + "\n\n" + msgText;
      }
      const result = await copyToClipboard(text);
      if (result.success) {
        const labels = { text: "청구서", calendar: "캘린더", both: "캘린더+청구서" };
        showToast({ type: "success", message: `📋 ${labels[option]} 복사 완료! 카톡에 붙여넣기 하세요` });
        if (!document.documentElement.classList.contains("anim-off")) {
          createConfetti(confettiRef);
        }
      } else if (result.fallbackText) {
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
    // Update startDay from current user prefs
    const uid = getActiveUser();
    const p = uid ? loadUserPrefs(uid) : {};
    setStartDay(p.calendar_start === "monday" ? 1 : 0);
  }

  // 월 선택 — goToMonth를 직접 사용

  function handleSubmitClaim() {
    if (!inFamily) return;
    if (!isOnline()) {
      showToast({ type: "error", message: getErrorMessage("NETWORK_ERROR") });
      return;
    }
    if (isEmpty) return;

    // 로컬 캐시에서 중복 확인
    // Note: Local cache check only. Server also validates duplicates.
    const existing = getSubmittedClaimForMonth(viewYear, viewMonth);
    if (existing && (existing.status === "pending" || existing.status === "approved")) {
      showToast({ type: "info", message: `${viewMonth}월 청구가 이미 검토 대기 중입니다` });
      return;
    }

    try {
      const snapshot = createClaimSnapshot(viewYear, viewMonth);
      setSubmitSnapshot(snapshot);
    } catch (err) {
      showToast({ type: "error", message: "스냅샷 생성 실패: " + err.message });
    }
  }

  function handleSubmitSuccess(claim) {
    setSubmitSnapshot(null);
    setSubmittedStatus(claim.status);
  }

  return (
    <div className="app-container main-screen">
      {/* 헤더 (월 네비 + 총액) */}
      <header className="main-header">
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
      </header>

      {/* 추가 지급 알림 */}
      {inFamily && pendingGrants.length > 0 && (
        <div className="grant-notification" style={{
          margin: "0 var(--space-4) var(--space-3)",
          padding: "var(--space-3) var(--space-4)",
          borderRadius: "var(--radius-lg, 12px)",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-primary)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
            <span style={{ fontSize: "1.2em" }}>💝</span>
            <span className="text-sm font-medium">추가 지급 {pendingGrants.length}건</span>
          </div>
          {pendingGrants.map(g => (
            <div key={g.claim_id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "var(--space-2) 0",
              borderTop: "1px solid var(--color-border)",
            }}>
              <div>
                <div className="text-sm font-medium">{g.name || "추가 지급"}</div>
                <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {formatAmountShort(g.total || g.amount || 0)}<span className="amount-unit">원</span>
                  {g.reason && <span> · {g.reason}</span>}
                </div>
              </div>
              <button
                className="btn btn--primary"
                style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-sm)", minHeight: "auto" }}
                onClick={() => handleReceiveGrant(g)}
                disabled={grantReceiving === g.claim_id}
              >
                {grantReceiving === g.claim_id ? "확인 중..." : "받았어요"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 캘린더 그리드 */}
      <CalendarGrid
        year={viewYear}
        month={viewMonth}
        calc={calc}
        todayY={todayY}
        todayM={todayM}
        onCellClick={handleCellClick}
        settings={settings}
        startDay={startDay}
      />

      {/* 정산표 */}
      <SummaryTable
        year={viewYear}
        month={viewMonth}
        calc={calc}
        settings={settings}
        claimStatus={claimStatus}
        childMemberId={familyCtx?.member_id}
      />

      {/* 하단 액션바는 아래 parent-action-bar 참조 */}

      {/* S-103 셀 편집 모달 */}
      {editingCell && (
        <CellEditModal
          cell={editingCell}
          calendar={calendar}
          settings={settings}
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
          onRecurringSaved={(updatedSettings) => {
            setSettings(updatedSettings);
            if (onSettingsChange) onSettingsChange(updatedSettings);
            refresh();
          }}
        />
      )}

      {/* S-202 월 선택기 */}
      {showMonthSelector && (
        <MonthSelector
          currentYear={viewYear}
          currentMonth={viewMonth}
          todayY={todayY}
          todayM={todayM}
          onSelect={goToMonth}
          onClose={() => setShowMonthSelector(false)}
        />
      )}

      {/* 복사 옵션 선택 */}
      {showCopyOptions && (
        <CopyOptionsModal
          onSelect={handleCopyWithOption}
          onClose={() => setShowCopyOptions(false)}
        />
      )}

      {/* S-111 클립보드 폴백 */}
      {clipboardFallbackText && (
        <ClipboardFallbackModal
          text={clipboardFallbackText}
          onClose={() => setClipboardFallbackText(null)}
        />
      )}

      {/* S-2-103 청구 제출 확인 */}
      {submitSnapshot && (
        <SubmitClaimModal
          year={viewYear}
          month={viewMonth}
          snapshot={submitSnapshot}
          onClose={() => setSubmitSnapshot(null)}
          onSuccess={handleSubmitSuccess}
        />
      )}

      {/* 연간 통계 + 이력 (탭 통합) */}
      {showYearlyStats && (
        <YearlyStatsModal
          onClose={() => setShowYearlyStats(false)}
          year={viewYear}
          month={viewMonth}
        />
      )}

      {/* 가족 온보딩 (S-2-205 마이그레이션 포함) */}
      {showOnboarding && (
        <FamilyOnboardingModal
          onComplete={() => {
            setShowOnboarding(false);
            saveCurrentAccount();
            if (onLogout) onLogout(); // 재부팅으로 역할 분기
          }}
        />
      )}

      {/* 프로필 모달 */}
      {showProfile && (
        <ProfileModal
          year={viewYear}
          month={viewMonth}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* 성취 배지 */}
      {showBadges && (
        <BadgesModal onClose={() => setShowBadges(false)} />
      )}

      {/* 알림 센터 */}
      {showNotifs && (
        <NotificationCenterModal onClose={() => { setShowNotifs(false); setUnreadCount(getUnreadCount()); }} />
      )}

      {/* 미션 보드 (자녀용) */}
      {showChores && familyCtx && (
        <ChoresChildModal
          childMemberId={familyCtx.member_id}
          childName={familyCtx.display_name || "자녀"}
          onClose={() => setShowChores(false)}
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

      {/* 하단 액션바 */}
      <div className="parent-action-bar">
        <button
          className="parent-action-bar__btn"
          onClick={() => setShowCopyOptions(true)}
          disabled={isEmpty || copying}
          aria-label="복사"
        >
          <span className="parent-action-bar__icon">{copying ? "⏳" : "📋"}</span>
          <span className="parent-action-bar__label">{copying ? "복사중" : "복사"}</span>
        </button>
        {inFamily && (
          <button
            className="parent-action-bar__btn parent-action-bar__btn--submit"
            onClick={handleSubmitClaim}
            disabled={isEmpty}
            aria-label="청구서 제출"
          >
            <span className="parent-action-bar__icon">📨</span>
            <span className="parent-action-bar__label">청구</span>
          </button>
        )}
        <button
          className="parent-action-bar__btn"
          onClick={() => { setShowNotifs(true); setUnreadCount(0); }}
          aria-label="알림"
          style={{ position: "relative" }}
        >
          <span className="parent-action-bar__icon">🔔</span>
          <span className="parent-action-bar__label">알림</span>
          {unreadCount > 0 && <span className="notification-badge" style={{ position: "absolute", top: 2, right: 8, fontSize: "0.6rem" }}>{unreadCount}</span>}
        </button>
        <button
          className="parent-action-bar__btn"
          onClick={() => setShowSettings(true)}
          aria-label="설정"
        >
          <span className="parent-action-bar__icon">⚙️</span>
          <span className="parent-action-bar__label">설정</span>
        </button>
        <div style={{ position: "relative" }}>
          <button
            className="parent-action-bar__btn"
            onClick={() => setShowMore(prev => !prev)}
            aria-label="더보기"
          >
            <span className="parent-action-bar__icon">···</span>
            <span className="parent-action-bar__label">더보기</span>
          </button>
          {showMore && (
            <MoreMenu
              onClose={() => setShowMore(false)}
              items={[
                ...(inFamily ? [{ icon: "🎯", label: "미션 보드", onClick: () => setShowChores(true) }] : []),
                { icon: "🏅", label: "성취 배지", onClick: () => setShowBadges(true) },
                ...(inFamily ? [{ icon: "📊", label: "통계", onClick: () => setShowYearlyStats(true) }] : []),
                { icon: "😊", label: "프로필", onClick: () => setShowProfile(true) },
                ...(inFamily && onLogout ? [{ icon: "👤", label: "계정 전환", onClick: () => { logout(); onLogout(); } }] : []),
                ...(!inFamily ? [{ icon: "👨‍👩‍👧", label: "가족 시작", onClick: () => setShowOnboarding(true) }] : []),
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
