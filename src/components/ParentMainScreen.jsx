// src/components/ParentMainScreen.jsx — S-2-001 부모 메인 (받은 청구 목록)

import { useState, useCallback, useEffect, useMemo } from "react";
import { useClaims } from "../hooks/useClaims";
import { useSyncPoller } from "../hooks/useSyncPoller";
import { useToast } from "../hooks/useToast";
import { getKVAdapter } from "../utils/kvAdapter";
import { isOnline } from "../utils/onlineStatus";
import { logout } from "../utils/accountSwitcher";
import { getMessageForError } from "../constants/errorMessages";
import { getStatusEmoji } from "../constants/statusLabels";
import { formatAmountShort } from "../utils/formatAmount";

import ClaimCard from "./widgets/ClaimCard";
import ParentClaimDetailModal from "./modals/ParentClaimDetailModal";
import FamilyInfoModal from "./modals/FamilyInfoModal";
import RejectionReasonModal from "./modals/RejectionReasonModal";
import ParentSettingsModal from "./modals/ParentSettingsModal";
import CreateGrantModal from "./modals/CreateGrantModal";
import AutoGrantModal from "./modals/AutoGrantModal";
import ChoresManagerModal from "./modals/ChoresManagerModal";
import NotificationCenterModal from "./modals/NotificationCenterModal";
import { getUnreadCount } from "../utils/notifications";
import SpendingStatsModal from "./modals/SpendingStatsModal";
import { generateGrantId } from "../utils/idGenerator";
import { getDueSchedules, markScheduleRun } from "../utils/autoGrant";
import MoreMenu from "./widgets/MoreMenu";

/**
 * @param {{ familyContext: import("../utils/familyContext").FamilyContextData }} props
 */
export default function ParentMainScreen({ familyContext, onLogout }) {
  const { claims, fetchClaims } = useClaims(familyContext.family_id);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [filter, setFilter] = useState("pending");
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
  const [showMore, setShowMore] = useState(false);
  const [showSpendingStats, setShowSpendingStats] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);
  const { showToast } = useToast();

  // KVAdapter에 familyCode + memberId 설정 (L-6: 변경 시에만 호출)
  useEffect(() => {
    const adapter = getKVAdapter();
    if (adapter.familyCode !== familyContext.family_code) {
      adapter.setFamilyCode(familyContext.family_code);
    }
    if (adapter.memberId !== familyContext.member_id) {
      adapter.setMemberId(familyContext.member_id);
    }
  }, [familyContext.family_code, familyContext.member_id]);

  // 가족 멤버 목록 로드 (자녀 이름 표시용)
  const refreshMembers = useCallback(async () => {
    try {
      const adapter = getKVAdapter();
      const result = await adapter.getFamily(familyContext.family_id);
      setFamilyMembers(result.members || []);
    } catch {
      // 실패 시 무시 — 이름 없이 표시
    }
  }, [familyContext.family_id]);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  // 자동 정기 용돈 실행 (앱 진입 시 1회)
  useEffect(() => {
    async function runDueSchedules() {
      if (!isOnline()) return;
      const due = getDueSchedules();
      if (due.length === 0) return;
      const adapter = getKVAdapter();
      let successCount = 0;
      for (const schedule of due) {
        try {
          await adapter.submitGrant({
            grant_id: generateGrantId(),
            child_member_id: schedule.child_member_id,
            name: schedule.name,
            amount: schedule.amount,
            reason: `자동 지급 (${schedule.frequency === "weekly" ? "매주" : "매월"})`,
          });
          const markResult = markScheduleRun(schedule.id);
          if (markResult.success) successCount++;
        } catch {
          // 개별 스케줄 실패 시 다음 것 계속
        }
      }
      if (successCount > 0) {
        showToast({ type: "success", message: `🔄 자동 지급 ${successCount}건 완료` });
      }
      await fetchClaims();
    }
    runDueSchedules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 30초 폴링 (청구 + 멤버 이름 갱신)
  const pollFn = useCallback(async () => {
    if (!isOnline()) return;
    await fetchClaims();
    await refreshMembers();
  }, [fetchClaims, refreshMembers]);

  useSyncPoller(pollFn, { interval: 30000 });

  // 청구 카드 클릭
  function handleClaimClick(claim) {
    setSelectedClaim(claim);
  }

  // 상세 모달 닫기 후 목록 갱신
  function handleDetailClose() {
    setSelectedClaim(null);
    fetchClaims();
  }

  // 자녀 이름 조회
  function getChildName(childMemberId) {
    const member = familyMembers.find((m) => m.member_id === childMemberId);
    return member?.display_name || "자녀";
  }

  // 빠른 승인
  async function handleQuickApprove(claim) {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
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
      showToast({ type: "success", message: `${claim.month}월 청구 승인 완료!` });
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

  // 빠른 거절 (사유 입력 모달 오픈)
  function handleQuickReject(claim) {
    setQuickRejectTarget(claim);
  }

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

  // 추가 지급 등록
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
      setShowGrantModal(false);
      await fetchClaims();
    } catch (err) {
      showToast({ type: "error", message: getMessageForError(err) });
    } finally {
      setGrantLoading(false);
    }
  }

  // 빠른 거절 취소
  function handleQuickUndoReject(claim) {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    setUndoRejectConfirmClaim(claim);
  }

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

  // 청구 분류: pending (상단) vs 나머지 (하단)
  const pendingClaims = useMemo(() => claims.filter((c) => c.type !== "grant" && c.status === "pending"), [claims]);
  const inProgressClaims = useMemo(() => claims.filter((c) => c.type !== "grant" && (c.status === "approved" || c.status === "paid")), [claims]);
  const completedClaims = useMemo(() => claims.filter((c) => c.type !== "grant" && (c.status === "received" || c.status === "rejected")), [claims]);
  const grantClaims = useMemo(() => claims.filter((c) => c.type === "grant"), [claims]);

  // 자녀별 요약 데이터
  const childSummaries = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();
    const byChild = {};

    claims.forEach((c) => {
      const id = c.child_member_id;
      if (!byChild[id]) {
        byChild[id] = { memberId: id, total: 0, approved: 0, count: 0, lastDate: null };
      }
      // 이번 달 기준 통계
      if (c.year === thisYear && c.month === thisMonth) {
        byChild[id].total += c.total || 0;
        byChild[id].count++;
        if (c.status === "approved" || c.status === "paid") byChild[id].approved++;
      }
      // 마지막 청구일
      const d = new Date(c.submitted_at);
      if (!byChild[id].lastDate || d > byChild[id].lastDate) byChild[id].lastDate = d;
    });

    return Object.values(byChild).map((s) => ({
      ...s,
      name: getChildName(s.memberId),
      approvalRate: s.count > 0 ? Math.round((s.approved / s.count) * 100) : 0,
      lastDateStr: s.lastDate
        ? s.lastDate.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
        : "-",
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claims, familyMembers]);

  const childMembers = useMemo(() => {
    return familyMembers.filter(m => m.role === "child");
  }, [familyMembers]);

  return (
    <div className="app-container" style={{ paddingBottom: "var(--space-16, 72px)" }}>
      <div className="parent-header-title">
        📬 받은 청구
        {pendingClaims.length > 0 && (
          <span className="notification-badge">{pendingClaims.length}</span>
        )}
      </div>

      {/* 자녀별 요약 (항상 표시) */}
      {childSummaries.length > 0 && (
        <div className="child-summary-section">
          <h3 className="child-summary-section__title">👦 자녀별 이번 달</h3>
          <div className="child-summary-cards">
            {childSummaries.map((child) => (
              <div key={child.memberId} className="child-summary-card">
                <div className="child-summary-card__name">{child.name}</div>
                <div className="child-summary-card__stats">
                  <div className="child-summary-card__stat">
                    <span className="child-summary-card__stat-value">
                      {formatAmountShort(child.total)}<span className="amount-unit">원</span>
                    </span>
                    <span className="child-summary-card__stat-label">청구 합계</span>
                  </div>
                  <div className="child-summary-card__stat">
                    <span className="child-summary-card__stat-value child-summary-card__stat-value--rate">
                      {child.approvalRate}%
                    </span>
                    <span className="child-summary-card__stat-label">승인율</span>
                  </div>
                  <div className="child-summary-card__stat">
                    <span className="child-summary-card__stat-value child-summary-card__stat-value--date">
                      {child.lastDateStr}
                    </span>
                    <span className="child-summary-card__stat-label">마지막 청구</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 필터 탭 */}
      <main className="parent-main-content">
        {claims.length > 0 && (
          <div className="parent-filter-tabs">
            {[
              { key: "pending", label: "대기", count: pendingClaims.length },
              { key: "inprogress", label: "진행", count: inProgressClaims.length },
              { key: "completed", label: "완료", count: completedClaims.length },
              { key: "all", label: "전체", count: claims.length },
            ].map(tab => (
              <button
                key={tab.key}
                className={`parent-filter-tab${filter === tab.key ? " parent-filter-tab--active" : ""}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        )}
        {claims.length === 0 ? (
          <div className="summary-table summary-table--empty">
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <div className="empty-state__title">아직 받은 청구가 없어요</div>
              <div className="empty-state__desc">
                자녀가 청구를 보내면<br />여기에 표시됩니다
              </div>
              <div className="empty-state__hints">
                <span className="empty-state__hint">✈️ 자녀가 [제출] 클릭</span>
                <span className="empty-state__hint">📋 여기서 검토/승인</span>
              </div>
              <div className="parent-family-code">
                <span className="parent-family-code__label">가족 코드</span>
                <span className="parent-family-code__value">{familyContext.family_code}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 대기 탭: pending만 */}
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
                        style={{ animationDelay: `${i * 0.06}s` }}
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

            {/* 진행 탭: approved + paid */}
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
                        style={{ animationDelay: `${i * 0.06}s` }}
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

            {/* 완료 탭: received + rejected + grant */}
            {filter === "completed" && (
              <section className="claim-section">
                <div className="claim-section__list">
                  {completedClaims.map((c, i) => (
                    <ClaimCard
                      key={c.claim_id}
                      claim={c}
                      childName={getChildName(c.child_member_id)}
                      onClick={handleClaimClick}
                      onQuickUndoReject={c.status === "rejected" ? handleQuickUndoReject : undefined}
                      quickLoading={quickActionId === c.claim_id}
                      style={{ animationDelay: `${i * 0.06}s` }}
                    />
                  ))}
                  {grantClaims.map((g, i) => (
                    <ClaimCard
                      key={g.claim_id}
                      claim={g}
                      childName={getChildName(g.child_member_id)}
                      onClick={handleClaimClick}
                      style={{ animationDelay: `${(completedClaims.length + i) * 0.06}s` }}
                    />
                  ))}
                </div>
                {completedClaims.length === 0 && grantClaims.length === 0 && (
                  <div className="modal-empty" style={{ padding: "var(--space-6) 0" }}>
                    <div className="modal-empty__icon">📭</div>
                    <p className="modal-empty__text">처리된 청구가 없어요</p>
                  </div>
                )}
              </section>
            )}

            {/* 전체 탭: 섹션별 구분 */}
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
                          style={{ animationDelay: `${i * 0.06}s` }}
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
                          style={{ animationDelay: `${i * 0.06}s` }}
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
                          style={{ animationDelay: `${i * 0.06}s` }}
                        />
                      ))}
                    </div>
                  </section>
                )}
                {grantClaims.length > 0 && (
                  <section className="claim-section">
                    <h2 className="claim-section__title">💝 추가 지급 ({grantClaims.length})</h2>
                    <div className="claim-section__list">
                      {grantClaims.map((g, i) => (
                        <ClaimCard
                          key={g.claim_id}
                          claim={g}
                          childName={getChildName(g.child_member_id)}
                          onClick={handleClaimClick}
                          style={{ animationDelay: `${i * 0.06}s` }}
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

      {/* 상세 모달 */}
      {selectedClaim && (
        <ParentClaimDetailModal
          claimSummary={selectedClaim}
          familyContext={familyContext}
          onClose={handleDetailClose}
        />
      )}

      {/* 하단 액션바 */}
      <div className="parent-action-bar">
        <button
          className="parent-action-bar__btn parent-action-bar__btn--primary"
          onClick={() => {
            if (childMembers.length === 0) {
              showToast({ type: "info", message: "가족에 자녀가 없어요. 자녀를 먼저 초대해주세요." });
              return;
            }
            setShowGrantModal(true);
          }}
          aria-label={childMembers.length === 0 ? "추가 지급 (자녀 없음)" : "추가 지급"}
          title={childMembers.length === 0 ? "가족에 자녀가 없어요" : undefined}
        >
          <span className="parent-action-bar__icon">💝</span>
          <span className="parent-action-bar__label">지급</span>
        </button>
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
          onClick={() => setShowFamilyInfo(true)}
          aria-label="가족 정보"
        >
          <span className="parent-action-bar__icon">👨‍👩‍👧</span>
          <span className="parent-action-bar__label">가족</span>
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
                { icon: "🏠", label: "미션 관리", onClick: () => setShowChores(true) },
                { icon: "🔄", label: "자동 지급", onClick: () => setShowAutoGrant(true) },
                { icon: "📊", label: "지출 통계", onClick: () => setShowSpendingStats(true) },
                ...(onLogout ? [{ icon: "👤", label: "계정 전환", onClick: () => { logout(); onLogout(); } }] : []),
              ]}
            />
          )}
        </div>
      </div>

      {/* 가족 정보 모달 */}
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

      {/* 맞춤 설정 모달 */}
      {showSettings && (
        <ParentSettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* 추가 지급 모달 */}
      {showGrantModal && (
        <CreateGrantModal
          childMembers={childMembers}
          onSubmit={handleSubmitGrant}
          onClose={() => setShowGrantModal(false)}
          loading={grantLoading}
        />
      )}

      {/* 알림 센터 */}
      {showNotifs && (
        <NotificationCenterModal onClose={() => { setShowNotifs(false); setUnreadCount(getUnreadCount()); }} />
      )}

      {/* 집안일 미션 관리 */}
      {showChores && (
        <ChoresManagerModal
          childMembers={childMembers}
          onClose={() => setShowChores(false)}
        />
      )}

      {/* 자동 정기 용돈 관리 */}
      {showAutoGrant && (
        <AutoGrantModal
          childMembers={childMembers}
          onClose={() => setShowAutoGrant(false)}
        />
      )}

      {/* 지출 통계 */}
      {showSpendingStats && (
        <SpendingStatsModal
          role="parent"
          familyContext={familyContext}
          claims={claims}
          onClose={() => setShowSpendingStats(false)}
        />
      )}

      {/* 빠른 거절 사유 입력 */}
      {undoRejectConfirmClaim && (
        <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-3)" }} onClick={() => setUndoRejectConfirmClaim(null)}>
          <div className="modal-content" style={{ maxWidth: 360, width: "90%" }} onClick={e => e.stopPropagation()}>
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
    </div>
  );
}
