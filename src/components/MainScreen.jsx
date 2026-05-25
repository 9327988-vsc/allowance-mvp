// src/components/MainScreen.jsx — S-001 메인 캘린더
import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from "react";
import { useCalendar } from "../hooks/useCalendar";
import { generateMessage } from "../utils/messageTemplate";
import { copyToClipboard } from "../utils/clipboard";
import { loadCustomCategories } from "../utils/storage";
import { showToast } from "../utils/toastManager";
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
import DashboardSummary from "./widgets/DashboardSummary";
import EmptyState from "./widgets/EmptyState";
import { useClaims } from "../hooks/useClaims";
import { getUnreadCount } from "../utils/notifications";
import { syncServerNotifications } from "../utils/serverNotifications";

const CellEditModal = lazy(() => import("./modals/CellEditModal"));
const SettingsModal = lazy(() => import("./modals/SettingsModal"));
const SubmitClaimModal = lazy(() => import("./modals/SubmitClaimModal"));
const FamilyOnboardingModal = lazy(() => import("./modals/FamilyOnboardingModal"));
const ClipboardFallbackModal = lazy(() => import("./modals/ClipboardFallbackModal"));
const CopyOptionsModal = lazy(() => import("./modals/CopyOptionsModal"));
const YearlyStatsModal = lazy(() => import("./modals/YearlyStatsModal"));
const StorageFullModal = lazy(() => import("./modals/StorageFullModal"));
const ProfileModal = lazy(() => import("./modals/ProfileModal"));
const MonthSelector = lazy(() => import("./drawers/MonthSelector"));
const ChoresChildModal = lazy(() => import("./modals/ChoresChildModal"));
const NotificationCenterModal = lazy(() => import("./modals/NotificationCenterModal"));
const BadgesModal = lazy(() => import("./modals/BadgesModal"));
const QnAModal = lazy(() => import("./modals/QnAModal"));
const ClaimHistoryModal = lazy(() => import("./modals/ClaimHistoryModal"));

function createConfetti(confettiRef, confettiTimerRef) {
  // H-28 / L-11: 이전 confetti가 있으면 제거
  if (confettiRef.current) confettiRef.current.remove();
  if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
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
  confettiTimerRef.current = setTimeout(() => {
    container.remove();
    if (confettiRef.current === container) confettiRef.current = null;
    confettiTimerRef.current = null;
  }, 3000);
}

export default function MainScreen({ settings: initialSettings, onSettingsChange, familyContext, onLogout }) {
  const settings = initialSettings;
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

  // 탭바 상태
  const [showMyTab, setShowMyTab] = useState(false); // 마이 팝업
  const [showNotifs, setShowNotifs] = useState(false); // 알림 팝업
  const myModalRef = useRef(null);
  useEffect(() => { if (showMyTab && myModalRef.current) myModalRef.current.focus(); }, [showMyTab]);

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
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount());
  const [showBadges, setShowBadges] = useState(false);
  const [showQnA, setShowQnA] = useState(false);
  const [showClaimHistory, setShowClaimHistory] = useState(false);

  // 월 변경 시 submittedStatus 초기화
  useEffect(() => {
    setSubmittedStatus(null);
  }, [viewYear, viewMonth]);

  // m-4: 알림 배지 실시간 갱신 + 서버 알림 동기화 (visibility 복귀 시)
  useEffect(() => {
    async function syncAndRefresh() {
      if (familyContext) {
        const uid = getActiveUser();
        if (uid) {
          try { await syncServerNotifications(familyContext.family_code, familyContext.member_id, uid); } catch {}
        }
      }
      setUnreadCount(getUnreadCount());
    }
    syncAndRefresh();
    function handleVisibility() {
      if (document.visibilityState === "visible") syncAndRefresh();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [familyContext]);

  // H-28: confetti DOM cleanup on unmount
  const confettiRef = useRef(null);
  const confettiTimerRef = useRef(null);
  useEffect(() => {
    return () => {
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
      if (confettiRef.current) {
        confettiRef.current.remove();
        confettiRef.current = null;
      }
    };
  }, []);

  // 2단계: 청구 제출 (훅보다 먼저 선언)
  const familyCtx = familyContext || null;
  const inFamily = !!familyCtx;
  const [currentSubmitted, setCurrentSubmitted] = useState(null);
  useEffect(() => {
    setCurrentSubmitted(getSubmittedClaimForMonth(viewYear, viewMonth));
  }, [viewYear, viewMonth, submittedStatus]);
  const claimStatus = submittedStatus || currentSubmitted?.status || null;

  // 자녀 자동 갱신: 30초 폴링으로 청구 상태 동기화
  const claimStatusRef = useRef(claimStatus);
  claimStatusRef.current = claimStatus;
  const pollClaimStatus = useCallback(async () => {
    if (!isOnline()) return;
    try {
      if (!familyCtx) return;
      const adapter = getKVAdapter();
      const { claims } = await adapter.listClaims(familyCtx.family_id);
      syncSubmittedClaims(claims);
      const updated = getSubmittedClaimForMonth(viewYear, viewMonth);
      if (updated?.status && updated.status !== claimStatusRef.current) {
        setSubmittedStatus(updated.status);
      }
      const uid = getActiveUser();
      if (uid) {
        const newCount = await syncServerNotifications(familyCtx.family_code, familyCtx.member_id, uid);
        if (newCount > 0) setUnreadCount(getUnreadCount());
      }
    } catch {
      // 폴링 실패는 무시
    }
  }, [viewYear, viewMonth, familyCtx]);

  useSyncPoller(pollClaimStatus, { interval: 30000, enabled: inFamily });

  // 추가 지급(Grant) 목록 조회
  const { claims: allClaims, fetchClaims: fetchAllClaims } = useClaims(familyCtx?.family_id);
  const pendingGrants = useMemo(() =>
    allClaims.filter(c => c.type === "grant" && c.status === "granted" && c.child_member_id === familyCtx?.member_id),
    [allClaims, familyCtx]
  );

  // 추가 지급 수령 확인
  const handleReceiveGrant = useCallback(async (grant) => {
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
  }, [fetchAllClaims]);

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
          createConfetti(confettiRef, confettiTimerRef);
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
    setShowSettings(false);
    refresh();
    if (onSettingsChange) onSettingsChange(newSettings);
    // Update startDay from current user prefs
    const uid = getActiveUser();
    const p = uid ? loadUserPrefs(uid) : {};
    setStartDay(p.calendar_start === "monday" ? 1 : 0);
  }


  function handleSubmitClaim() {
    if (!inFamily) return;
    if (!isOnline()) {
      showToast({ type: "error", message: getErrorMessage("NETWORK_ERROR") });
      return;
    }
    if (isEmpty) return;

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
      {/* 헤더 (월 네비) */}
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

      {/* ═══ 콘텐츠 영역 ═══ */}
      <div className="tab-content">
            {/* 대시보드 요약 (그라데이션 합계 카드) */}
            {!isEmpty && (
              <div className="dashboard-top">
                <DashboardSummary calc={calc} viewMonth={viewMonth} settings={settings} claimStatus={claimStatus} />
              </div>
            )}

            {/* 빈 상태 */}
            {isEmpty && (
              <EmptyState onOpenSettings={() => setShowSettings(true)} />
            )}

            {/* 추가 지급 알림 */}
            {inFamily && pendingGrants.length > 0 && (
              <div className="home-card grant-card">
                <div className="grant-card__header">
                  <span className="grant-card__icon">💝</span>
                  <span className="text-sm font-medium">추가 지급 {pendingGrants.length}건</span>
                </div>
                {pendingGrants.map(g => (
                  <div key={g.claim_id} className="grant-card__item">
                    <div>
                      <div className="text-sm font-medium">{g.name || "추가 지급"}</div>
                      <div className="text-xs grant-card__detail">
                        {formatAmountShort(g.total || g.amount || 0)}<span className="amount-unit">원</span>
                        {g.reason && <span> · {g.reason}</span>}
                      </div>
                    </div>
                    <button
                      className="btn btn--primary grant-card__btn"
                      onClick={() => handleReceiveGrant(g)}
                      disabled={grantReceiving === g.claim_id}
                    >
                      {grantReceiving === g.claim_id ? "확인 중..." : "받았어요"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 캘린더 */}
            {!isEmpty && (
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
            )}

            {/* 빠른 액션 */}
            {!isEmpty && (
              <div className="home-actions">
                <button
                  className="home-actions__btn"
                  onClick={() => setShowCopyOptions(true)}
                  disabled={copying}
                >
                  <span className="home-actions__btn-icon">{copying ? "⏳" : "📋"}</span>
                  <span className="home-actions__btn-text">카톡 복사</span>
                </button>
                {inFamily && (
                  <button
                    className="home-actions__btn home-actions__btn--primary"
                    onClick={handleSubmitClaim}
                  >
                    <span className="home-actions__btn-icon">📨</span>
                    <span className="home-actions__btn-text">청구하기</span>
                  </button>
                )}
              </div>
            )}

      </div>{/* /tab-content */}

      {/* 🔔 알림 팝업 */}
      {showNotifs && (
        <NotificationCenterModal onClose={() => { setShowNotifs(false); setUnreadCount(getUnreadCount()); }} />
      )}

      {/* 👤 마이 팝업 */}
      {showMyTab && (
        <div className="modal-backdrop" ref={myModalRef} onClick={() => setShowMyTab(false)} onKeyDown={e => { if (e.key === "Escape") setShowMyTab(false); }} tabIndex={-1} role="dialog" aria-modal="true" aria-label="마이 메뉴">
          <div className="modal-content" style={{ maxWidth: 400, width: "92%", padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">👤 마이</h2>
              <button onClick={() => setShowMyTab(false)} className="modal-close" aria-label="닫기">×</button>
            </div>
            <div className="my-tab">
              {/* 프로필 카드 */}
              <button className="my-tab__profile" onClick={() => { setShowMyTab(false); setShowProfile(true); }} type="button">
                <div className="my-tab__avatar">😊</div>
                <div className="my-tab__info">
                  <span className="my-tab__name">{familyCtx?.member_display_name || "사용자"}</span>
                  <span className="my-tab__role">{familyCtx ? (familyCtx.member_role === "child" ? "자녀" : "보호자") : ""}</span>
                </div>
                <span className="my-tab__arrow">›</span>
              </button>

              {/* 메뉴 리스트 */}
              <div className="my-tab__menu">
                {inFamily && (
                  <button className="my-tab__menu-item" onClick={() => { setShowMyTab(false); setShowClaimHistory(true); }}>
                    <span className="my-tab__menu-icon">📋</span>
                    <span className="my-tab__menu-label">청구 이력</span>
                    <span className="my-tab__arrow">›</span>
                  </button>
                )}
                {inFamily && (
                  <button className="my-tab__menu-item" onClick={() => { setShowMyTab(false); setShowChores(true); }}>
                    <span className="my-tab__menu-icon">🎯</span>
                    <span className="my-tab__menu-label">미션 보드</span>
                    <span className="my-tab__arrow">›</span>
                  </button>
                )}
                <button className="my-tab__menu-item" onClick={() => { setShowMyTab(false); setShowBadges(true); }}>
                  <span className="my-tab__menu-icon">🏅</span>
                  <span className="my-tab__menu-label">성취 배지</span>
                  <span className="my-tab__arrow">›</span>
                </button>
                <button className="my-tab__menu-item" onClick={() => { setShowMyTab(false); setShowQnA(true); }}>
                  <span className="my-tab__menu-icon">❓</span>
                  <span className="my-tab__menu-label">Q&A</span>
                  <span className="my-tab__arrow">›</span>
                </button>
                {inFamily && (
                  <button className="my-tab__menu-item" onClick={() => { setShowMyTab(false); setShowYearlyStats(true); }}>
                    <span className="my-tab__menu-icon">📊</span>
                    <span className="my-tab__menu-label">통계</span>
                    <span className="my-tab__arrow">›</span>
                  </button>
                )}
                <button className="my-tab__menu-item" onClick={() => { setShowMyTab(false); setShowSettings(true); }}>
                  <span className="my-tab__menu-icon">⚙️</span>
                  <span className="my-tab__menu-label">설정</span>
                  <span className="my-tab__arrow">›</span>
                </button>
              </div>

              {/* 하단 메뉴 */}
              <div className="my-tab__menu my-tab__menu--bottom">
                {inFamily && onLogout && (
                  <button className="my-tab__menu-item" onClick={() => { setShowMyTab(false); logout(); onLogout(); }}>
                    <span className="my-tab__menu-icon">👤</span>
                    <span className="my-tab__menu-label">계정 전환</span>
                    <span className="my-tab__arrow">›</span>
                  </button>
                )}
                {!inFamily && (
                  <button className="my-tab__menu-item" onClick={() => { setShowMyTab(false); setShowOnboarding(true); }}>
                    <span className="my-tab__menu-icon">👨‍👩‍👧</span>
                    <span className="my-tab__menu-label">가족 시작하기</span>
                    <span className="my-tab__arrow">›</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
      {/* 설정 모달 (마이에서 열림) */}
      {showSettings && (
        <SettingsModal
          mode="edit"
          onSaved={handleSettingsSaved}
          onClose={() => setShowSettings(false)}
          onRecurringSaved={(updatedSettings) => {
            if (onSettingsChange) onSettingsChange(updatedSettings);
            refresh();
          }}
        />
      )}

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

      {showQnA && (
        <QnAModal
          onClose={() => setShowQnA(false)}
          userName={familyCtx?.member_display_name || "사용자"}
          userRole={familyCtx?.member_role || "child"}
        />
      )}

      {/* 미션 보드 (자녀용) */}
      {showChores && familyCtx && (
        <ChoresChildModal
          childMemberId={familyCtx.member_id}
          childName={familyCtx.member_display_name || "자녀"}
          onClose={() => setShowChores(false)}
        />
      )}

      {/* 청구 이력 */}
      {showClaimHistory && (
        <ClaimHistoryModal onClose={() => setShowClaimHistory(false)} />
      )}

      {/* S-108 스토리지 부족 */}
      {storageFull && (
        <StorageFullModal
          pendingSave={storageFull}
          onClose={() => setStorageFull(null)}
          onRetrySuccess={() => refresh()}
        />
      )}

      {/* 하단 탭바 */}
      <nav className="tab-bar">
        <button
          className="tab-bar__item tab-bar__item--active"
          aria-label="홈"
        >
          <span className="tab-bar__icon">🏠</span>
          <span className="tab-bar__label">홈</span>
        </button>
        <button
          className="tab-bar__item"
          onClick={() => setShowNotifs(true)}
          aria-label="알림"
        >
          <span className="tab-bar__icon">🔔</span>
          <span className="tab-bar__label">알림</span>
          {unreadCount > 0 && <span className="tab-bar__badge">{unreadCount}</span>}
        </button>
        <button
          className="tab-bar__item"
          onClick={() => setShowMyTab(true)}
          aria-label="마이"
        >
          <span className="tab-bar__icon">👤</span>
          <span className="tab-bar__label">마이</span>
        </button>
      </nav>
      </Suspense>
    </div>
  );
}
