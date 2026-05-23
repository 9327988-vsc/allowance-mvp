// src/components/ParentMainScreen.jsx — 부모 메인 (리디자인: 탭바 + FAB + 칩 선택기)

import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useClaims } from "../hooks/useClaims";
import { useSyncPoller } from "../hooks/useSyncPoller";
import { useToast } from "../hooks/useToast";
import { getKVAdapter } from "../utils/kvAdapter";
import { isOnline } from "../utils/onlineStatus";
import { getMessageForError } from "../constants/errorMessages";
import { getStatusEmoji } from "../constants/statusLabels";

import ClaimCard from "./widgets/ClaimCard";
import { getUnreadCount, addNotification } from "../utils/notifications";
import { generateGrantId } from "../utils/idGenerator";
import { getDueSchedules, markScheduleRun } from "../utils/autoGrant";
import { getGreetingMessage } from "../utils/greetingMessage";
import ParentMyPopup from "./widgets/ParentMyPopup";

const ParentClaimDetailModal = lazy(() => import("./modals/ParentClaimDetailModal"));
const FamilyInfoModal = lazy(() => import("./modals/FamilyInfoModal"));
const RejectionReasonModal = lazy(() => import("./modals/RejectionReasonModal"));
const ParentSettingsModal = lazy(() => import("./modals/ParentSettingsModal"));
const CreateGrantModal = lazy(() => import("./modals/CreateGrantModal"));
const AutoGrantModal = lazy(() => import("./modals/AutoGrantModal"));
const ChoresManagerModal = lazy(() => import("./modals/ChoresManagerModal"));
const NotificationCenterModal = lazy(() => import("./modals/NotificationCenterModal"));
const SpendingStatsModal = lazy(() => import("./modals/SpendingStatsModal"));
const QnAModal = lazy(() => import("./modals/QnAModal"));

// Module-level style constants (avoid re-creating on each render)
const EMPTY_STATE_STYLE = { padding: "var(--space-10) var(--space-4)" };

/**
 * @param {{ familyContext: import("../utils/familyContext").FamilyContextData }} props
 */
export default function ParentMainScreen({ familyContext, onLogout }) {
  const { claims, loading: claimsLoading, error: claimsError, fetchClaims } = useClaims(familyContext.family_id);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [selectedChild, setSelectedChild] = useState("all");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showFamilyInfo, setShowFamilyInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quickRejectTarget, setQuickRejectTarget] = useState(null);
  const [quickActionId, setQuickActionId] = useState(null);
  const [undoRejectConfirmClaim, setUndoRejectConfirmClaim] = useState(null);

  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showAutoGrant, setShowAutoGrant] = useState(false);
  const [showChores, setShowChores] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount());
  const [showSpendingStats, setShowSpendingStats] = useState(false);
  const [showMyPopup, setShowMyPopup] = useState(false);
  const [showQnA, setShowQnA] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);
  const { showToast } = useToast();

  // Stable refs for callbacks that may change (M-2)
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; });
  const notifyRef = useRef(null);

  // addNotification 후 배지 즉시 갱신 (M-13)
  function notify(data) {
    addNotification(data);
    setUnreadCount(getUnreadCount());
  }

  // Keep notifyRef in sync
  useEffect(() => { notifyRef.current = notify; });

  // M-4: undoReject dialog focus ref
  const undoRejectRef = useRef(null);
  useEffect(() => {
    if (undoRejectConfirmClaim && undoRejectRef.current) {
      undoRejectRef.current.querySelector("button")?.focus();
    }
  }, [undoRejectConfirmClaim]);

  // m-7: 인사 메시지 메모이제이션 (하루 동안 동일, 자정에 갱신)
  const [dateKey, setDateKey] = useState(() => new Date().toDateString());
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const newKey = new Date().toDateString();
      setDateKey(prev => prev !== newKey ? newKey : prev);
    }, 60000);
    return () => clearInterval(checkMidnight);
  }, []);
  const greetingMsg = useMemo(() => getGreetingMessage(), [dateKey]);
  const greetingDate = useMemo(() => new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" }), [dateKey]);

  // 부모 화면은 스크롤 허용
  useEffect(() => {
    document.body.classList.add("parent-main-active");
    return () => {
      document.body.classList.remove("parent-main-active");
    };
  }, []);

  // KVAdapter에 familyCode + memberId 설정
  useEffect(() => {
    const adapter = getKVAdapter();
    if (adapter.familyCode !== familyContext.family_code) {
      adapter.setFamilyCode(familyContext.family_code);
    }
    if (adapter.memberId !== familyContext.member_id) {
      adapter.setMemberId(familyContext.member_id);
    }
  }, [familyContext.family_code, familyContext.member_id]);

  // 가족 멤버 목록 로드
  const refreshMembers = useCallback(async () => {
    try {
      const adapter = getKVAdapter();
      const result = await adapter.getFamily(familyContext.family_id);
      setFamilyMembers(result.members || []);
    } catch {
      // 실패 시 무시
    }
  }, [familyContext.family_id]);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  // 자동 정기 용돈 실행 (앱 진입 시 1회) (M-3: abort on unmount)
  useEffect(() => {
    let mounted = true;
    async function runDueSchedules() {
      if (!isOnline()) return;
      const due = getDueSchedules();
      if (due.length === 0) return;
      const adapter = getKVAdapter();
      let successCount = 0;
      for (const schedule of due) {
        if (!mounted) return;
        try {
          await adapter.submitGrant({
            grant_id: generateGrantId(),
            child_member_id: schedule.child_member_id,
            name: schedule.name,
            amount: schedule.amount,
            reason: `자동 지급 (${schedule.frequency === "weekly" ? "매주" : "매월"})`,
          });
          if (!mounted) return;
          const markResult = markScheduleRun(schedule.id);
          if (markResult.success) successCount++;
        } catch {
          // 개별 스케줄 실패 시 다음 것 계속
        }
      }
      if (!mounted) return;
      if (successCount > 0) {
        showToastRef.current({ type: "success", message: `🔄 자동 지급 ${successCount}건 완료` });
        notifyRef.current({ type: "auto_grant", title: "자동 정기 지급", message: `${successCount}건의 자동 지급이 완료되었어요` });
      }
      await fetchClaims();
    }
    runDueSchedules();
    return () => { mounted = false; };
  // 초기 마운트 1회만 실행 — 재실행 시 중복 자동지급 위험
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 30초 폴링
  const pollFn = useCallback(async () => {
    if (!isOnline()) return;
    await fetchClaims();
    await refreshMembers();
  }, [fetchClaims, refreshMembers]);

  useSyncPoller(pollFn, { interval: 30000 });

  // 청구 카드 클릭
  const handleClaimClick = useCallback((claim) => {
    setSelectedClaim(claim);
  }, []);

  function handleDetailClose() {
    setSelectedClaim(null);
    fetchClaims();
  }

  const getChildName = useCallback((childMemberId) => {
    const member = familyMembers.find((m) => m.member_id === childMemberId);
    return member?.display_name || "자녀";
  }, [familyMembers]);

  // 빠른 승인 (M-2: useCallback + stable refs)
  const handleQuickApprove = useCallback(async (claim) => {
    if (!isOnline()) {
      showToastRef.current({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    setQuickActionId(claim.claim_id);
    try {
      const adapter = getKVAdapter();
      await adapter.patchClaim(claim.claim_id, {
        status: "approved",
        decided_by_member_id: familyContext.member_id,
        expected_updated_at: claim.updated_at,
      });
      showToastRef.current({ type: "success", message: `${claim.month}월 청구 승인 완료!` });
      notifyRef.current({ type: "claim_approved", title: `${claim.month}월 청구 승인`, message: `${getChildName(claim.child_member_id)}의 청구가 승인되었어요` });
      await fetchClaims();
    } catch (err) {
      if (err.code === "CONFLICT") {
        showToastRef.current({ type: "error", message: "이미 처리된 청구입니다" });
      } else {
        showToastRef.current({ type: "error", message: getMessageForError(err) });
      }
    } finally {
      setQuickActionId(null);
    }
  }, [familyContext.member_id, fetchClaims, getChildName]);

  const handleQuickReject = useCallback((claim) => {
    setQuickRejectTarget(claim);
  }, []);

  async function handleQuickRejectSubmit(reason) {
    if (!quickRejectTarget) return;
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    setQuickActionId(quickRejectTarget.claim_id);
    try {
      const adapter = getKVAdapter();
      await adapter.patchClaim(quickRejectTarget.claim_id, {
        status: "rejected",
        rejection_reason: reason,
        decided_by_member_id: familyContext.member_id,
        expected_updated_at: quickRejectTarget.updated_at,
      });
      showToast({ type: "success", message: "거절되었습니다" });
      notify({ type: "claim_rejected", title: "청구 거절", message: `${getChildName(quickRejectTarget.child_member_id)}의 ${quickRejectTarget.month}월 청구가 거절되었어요` });
      setQuickRejectTarget(null);
      await fetchClaims();
    } catch (err) {
      if (err.code === "CONFLICT") {
        showToast({ type: "error", message: "이미 처리된 청구입니다" });
      } else {
        showToast({ type: "error", message: getMessageForError(err) });
      }
    } finally {
      setQuickActionId(null);
    }
  }

  async function handleSubmitGrant(input) {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 등록할 수 없어요" });
      return;
    }
    setGrantLoading(true);
    try {
      const adapter = getKVAdapter();
      await adapter.submitGrant({
        grant_id: generateGrantId(),
        child_member_id: input.child_member_id,
        name: input.name,
        amount: input.amount,
        reason: input.reason,
      });
      showToast({ type: "success", message: `${getStatusEmoji("granted")} ${input.name} 지급 등록 완료!` });
      notify({ type: "grant_received", title: "추가 지급", message: `${getChildName(input.child_member_id)}에게 ${input.name} 지급 완료` });
      setShowGrantModal(false);
      await fetchClaims();
    } catch (err) {
      showToast({ type: "error", message: getMessageForError(err) });
    } finally {
      setGrantLoading(false);
    }
  }

  // M-14: useCallback memoization
  const handleQuickUndoReject = useCallback((claim) => {
    if (!isOnline()) {
      showToastRef.current({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    setUndoRejectConfirmClaim(claim);
  }, []);

  async function executeUndoReject(claim) {
    setUndoRejectConfirmClaim(null);
    setQuickActionId(claim.claim_id);
    try {
      const adapter = getKVAdapter();
      await adapter.patchClaim(claim.claim_id, {
        status: "pending",
        decided_by_member_id: familyContext.member_id,
        expected_updated_at: claim.updated_at,
      });
      showToast({ type: "success", message: "거절이 취소되었습니다" });
      await fetchClaims();
    } catch (err) {
      if (err.code === "CONFLICT") {
        showToast({ type: "error", message: "이미 처리된 청구입니다" });
      } else {
        showToast({ type: "error", message: getMessageForError(err) });
      }
    } finally {
      setQuickActionId(null);
    }
  }

  // 자녀 필터 적용된 청구 목록
  const childMembers = useMemo(() => {
    return familyMembers.filter(m => m.role === "child");
  }, [familyMembers]);

  const filteredClaims = useMemo(() => {
    if (selectedChild === "all") return claims;
    return claims.filter(c => c.child_member_id === selectedChild);
  }, [claims, selectedChild]);

  const pendingClaims = useMemo(() => filteredClaims.filter((c) => c.status === "pending"), [filteredClaims]);
  const inProgressClaims = useMemo(() => filteredClaims.filter((c) => c.status === "approved" || c.status === "granted"), [filteredClaims]);
  const completedClaims = useMemo(() => filteredClaims.filter((c) => c.status === "paid" || c.status === "received" || c.status === "rejected"), [filteredClaims]);

  return (
    <div className="parent-screen">
      {/* 인사 헤더 */}
      <header className="parent-screen__greeting">
        <div className="parent-screen__greeting-text">
          <span className="parent-screen__greeting-hello">안녕하세요, {familyContext.member_display_name}님. {greetingMsg}</span>
          <span className="parent-screen__greeting-date">{greetingDate}</span>
        </div>
        {pendingClaims.length > 0 && (
          <span className="parent-screen__pending-badge">{pendingClaims.length}건 대기</span>
        )}
      </header>

      {/* 자녀 칩 선택기 */}
      {childMembers.length > 0 && (
        <div className="parent-screen__chips">
          <button
            className={`parent-chip${selectedChild === "all" ? " parent-chip--active" : ""}`}
            onClick={() => setSelectedChild("all")}
            aria-pressed={selectedChild === "all"}
          >
            전체
          </button>
          {childMembers.map(child => (
            <button
              key={child.member_id}
              className={`parent-chip${selectedChild === child.member_id ? " parent-chip--active" : ""}`}
              onClick={() => setSelectedChild(child.member_id)}
              aria-pressed={selectedChild === child.member_id}
            >
              {child.display_name}
            </button>
          ))}
        </div>
      )}

      {/* 필터 탭 (sticky) — m-15: show when ANY claims exist */}
      {claims.length > 0 && (
        <div className="parent-screen__filters" role="tablist" aria-label="청구 필터">
          {[
            { key: "pending", label: "대기", count: pendingClaims.length },
            { key: "inprogress", label: "진행", count: inProgressClaims.length },
            { key: "completed", label: "완료", count: completedClaims.length },
            { key: "all", label: "전체", count: filteredClaims.length },
          ].map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={filter === tab.key}
              className={`parent-filter-tab${filter === tab.key ? " parent-filter-tab--active" : ""}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}({tab.count})
            </button>
          ))}
        </div>
      )}

      {/* 스크롤 가능한 청구 리스트 */}
      <main className="parent-screen__content">
        {claimsLoading && claims.length === 0 ? (
          <div className="empty-state" style={EMPTY_STATE_STYLE}>
            <div className="empty-state__icon">⏳</div>
            <div className="empty-state__title">불러오는 중...</div>
          </div>
        ) : claimsError && claims.length === 0 ? (
          <div className="empty-state" style={EMPTY_STATE_STYLE}>
            <div className="empty-state__icon">⚠️</div>
            <div className="empty-state__title">데이터를 불러오지 못했어요</div>
            <button className="btn btn--secondary" style={{ marginTop: "var(--space-3)" }} onClick={fetchClaims}>다시 시도</button>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="empty-state" style={EMPTY_STATE_STYLE}>
            <div className="empty-state__icon">📭</div>
            <div className="empty-state__title">아직 받은 청구가 없어요</div>
            <div className="empty-state__desc">
              자녀가 청구를 보내면<br />여기에 표시됩니다
            </div>
            <div className="parent-family-code">
              <span className="parent-family-code__label">가족 코드</span>
              <span className="parent-family-code__value">{familyContext.family_code}</span>
            </div>
          </div>
        ) : (
          <>
            {/* 대기 탭 */}
            {filter === "pending" && (
              <section className="claim-section">
                {pendingClaims.length > 0 ? (
                  <div className="claim-section__list">
                    {pendingClaims.map((c, i) => (
                      <ClaimCard
                        key={c.claim_id}
                        claim={c}
                        childName={getChildName(c.child_member_id)}
                        onClick={handleClaimClick}
                        onQuickApprove={handleQuickApprove}
                        onQuickReject={handleQuickReject}
                        quickLoading={quickActionId === c.claim_id}
                        style={{ "--anim-delay": `${i * 0.06}s` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="modal-empty" style={{ padding: "var(--space-6) 0" }}>
                    <div className="modal-empty__icon">✅</div>
                    <p className="modal-empty__text">대기 중인 청구가 없어요</p>
                  </div>
                )}
              </section>
            )}

            {/* 진행 탭 */}
            {filter === "inprogress" && (
              <section className="claim-section">
                {inProgressClaims.length > 0 ? (
                  <div className="claim-section__list">
                    {inProgressClaims.map((c, i) => (
                      <ClaimCard
                        key={c.claim_id}
                        claim={c}
                        childName={getChildName(c.child_member_id)}
                        onClick={handleClaimClick}
                        quickLoading={quickActionId === c.claim_id}
                        style={{ "--anim-delay": `${i * 0.06}s` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="modal-empty" style={{ padding: "var(--space-6) 0" }}>
                    <div className="modal-empty__icon">📭</div>
                    <p className="modal-empty__text">진행 중인 청구가 없어요</p>
                  </div>
                )}
              </section>
            )}

            {/* 완료 탭 */}
            {filter === "completed" && (
              <section className="claim-section">
                {completedClaims.length > 0 ? (
                  <div className="claim-section__list">
                    {completedClaims.map((c, i) => (
                      <ClaimCard
                        key={c.claim_id}
                        claim={c}
                        childName={getChildName(c.child_member_id)}
                        onClick={handleClaimClick}
                        onQuickUndoReject={c.status === "rejected" ? handleQuickUndoReject : undefined}
                        quickLoading={quickActionId === c.claim_id}
                        style={{ "--anim-delay": `${i * 0.06}s` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="modal-empty" style={{ padding: "var(--space-6) 0" }}>
                    <div className="modal-empty__icon">📭</div>
                    <p className="modal-empty__text">처리된 청구가 없어요</p>
                  </div>
                )}
              </section>
            )}

            {/* 전체 탭 */}
            {filter === "all" && (
              <>
                {pendingClaims.length > 0 && (
                  <section className="claim-section">
                    <h2 className="claim-section__title">검토 대기 ({pendingClaims.length})</h2>
                    <div className="claim-section__list">
                      {pendingClaims.map((c, i) => (
                        <ClaimCard
                          key={c.claim_id}
                          claim={c}
                          childName={getChildName(c.child_member_id)}
                          onClick={handleClaimClick}
                          onQuickApprove={handleQuickApprove}
                          onQuickReject={handleQuickReject}
                          quickLoading={quickActionId === c.claim_id}
                          style={{ "--anim-delay": `${i * 0.06}s` }}
                        />
                      ))}
                    </div>
                  </section>
                )}
                {inProgressClaims.length > 0 && (
                  <section className="claim-section">
                    <h2 className="claim-section__title">진행 중 ({inProgressClaims.length})</h2>
                    <div className="claim-section__list">
                      {inProgressClaims.map((c, i) => (
                        <ClaimCard
                          key={c.claim_id}
                          claim={c}
                          childName={getChildName(c.child_member_id)}
                          onClick={handleClaimClick}
                          quickLoading={quickActionId === c.claim_id}
                          style={{ "--anim-delay": `${i * 0.06}s` }}
                        />
                      ))}
                    </div>
                  </section>
                )}
                {completedClaims.length > 0 && (
                  <section className="claim-section">
                    <h2 className="claim-section__title">완료 ({completedClaims.length})</h2>
                    <div className="claim-section__list">
                      {completedClaims.map((c, i) => (
                        <ClaimCard
                          key={c.claim_id}
                          claim={c}
                          childName={getChildName(c.child_member_id)}
                          onClick={handleClaimClick}
                          onQuickUndoReject={c.status === "rejected" ? handleQuickUndoReject : undefined}
                          quickLoading={quickActionId === c.claim_id}
                          style={{ "--anim-delay": `${i * 0.06}s` }}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* FAB 지급 버튼 */}
      <button
        className="parent-fab"
        onClick={() => {
          if (childMembers.length === 0) {
            showToast({ type: "info", message: "가족에 자녀가 없어요. 자녀를 먼저 초대해주세요." });
            return;
          }
          setShowGrantModal(true);
        }}
        aria-label="추가 지급"
      >
        <span className="parent-fab__icon">💝</span>
        <span className="parent-fab__label">지급</span>
      </button>

      {/* 탭 바 (fixed) */}
      <nav className="tab-bar tab-bar--fixed">
        <button className="tab-bar__item" onClick={() => setShowSpendingStats(true)}>
          <span className="tab-bar__icon">📊</span>
          <span className="tab-bar__label">통계</span>
        </button>
        <button className="tab-bar__item" onClick={() => setShowNotifs(true)}>
          <span className="tab-bar__icon">🔔</span>
          <span className="tab-bar__label">알림</span>
          {unreadCount > 0 && <span className="tab-bar__badge">{unreadCount}</span>}
        </button>
        <button className="tab-bar__item" onClick={() => setShowMyPopup(true)}>
          <span className="tab-bar__icon">👤</span>
          <span className="tab-bar__label">마이</span>
        </button>
      </nav>

      {/* 마이 팝업 */}
      {showMyPopup && (
        <ParentMyPopup
          familyContext={familyContext}
          onClose={() => setShowMyPopup(false)}
          onNavigate={(key) => {
            const navMap = { familyInfo: setShowFamilyInfo, settings: setShowSettings, chores: setShowChores, autoGrant: setShowAutoGrant, qna: setShowQnA };
            navMap[key]?.(true);
          }}
          onLogout={onLogout}
        />
      )}

      <Suspense fallback={null}>
      {selectedClaim && (
        <ParentClaimDetailModal
          claimSummary={selectedClaim}
          familyContext={familyContext}
          onClose={handleDetailClose}
        />
      )}

      {showFamilyInfo && (
        <FamilyInfoModal
          onClose={() => setShowFamilyInfo(false)}
          onLeft={() => {
            setShowFamilyInfo(false);
            if (onLogout) {
              showToast({ type: "info", message: "가족에서 나왔습니다" });
              onLogout();
            } else {
              showToast({ type: "info", message: "가족에서 나왔습니다" });
              setTimeout(() => window.location.reload(), 500);
            }
          }}
        />
      )}

      {showSettings && (
        <ParentSettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showGrantModal && (
        <CreateGrantModal
          childMembers={childMembers}
          onSubmit={handleSubmitGrant}
          onClose={() => setShowGrantModal(false)}
          loading={grantLoading}
        />
      )}

      {showNotifs && (
        <NotificationCenterModal onClose={() => { setShowNotifs(false); setUnreadCount(getUnreadCount()); }} />
      )}

      {showChores && (
        <ChoresManagerModal
          childMembers={childMembers}
          onClose={() => setShowChores(false)}
        />
      )}

      {showAutoGrant && (
        <AutoGrantModal
          childMembers={childMembers}
          onClose={() => setShowAutoGrant(false)}
        />
      )}

      {showSpendingStats && (
        <SpendingStatsModal
          role="parent"
          familyContext={familyContext}
          claims={claims}
          onClose={() => setShowSpendingStats(false)}
        />
      )}

      {undoRejectConfirmClaim && (
        <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-3)" }} onClick={() => setUndoRejectConfirmClaim(null)} onKeyDown={e => { if (e.key === "Escape") setUndoRejectConfirmClaim(null); }} tabIndex={-1}>
          <div className="modal-content" style={{ maxWidth: 360, width: "90%" }} onClick={e => e.stopPropagation()} ref={undoRejectRef} role="dialog" aria-modal="true" aria-label="거절 취소 확인">
            <p className="mb-3">거절을 취소하고 다시 대기 상태로 되돌릴까요?</p>
            <div className="flex justify-end gap-2">
              <button className="btn btn--secondary" onClick={() => setUndoRejectConfirmClaim(null)}>취소</button>
              <button className="btn btn--primary" onClick={() => executeUndoReject(undoRejectConfirmClaim)}>확인</button>
            </div>
          </div>
        </div>
      )}

      {quickRejectTarget && (
        <RejectionReasonModal
          onSubmit={handleQuickRejectSubmit}
          onClose={() => setQuickRejectTarget(null)}
          loading={!!quickActionId}
        />
      )}

      {showQnA && (
        <QnAModal
          onClose={() => setShowQnA(false)}
          userName={familyContext.member_display_name || "보호자"}
          userRole="parent"
        />
      )}
      </Suspense>
    </div>
  );
}
