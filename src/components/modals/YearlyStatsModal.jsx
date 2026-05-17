// src/components/modals/YearlyStatsModal.jsx — 연간 용돈 통계 + 이력
import { useState, useMemo, useEffect } from "react";
import { loadSubmittedClaims, syncSubmittedClaims } from "../../utils/submittedClaims";
import { loadSettings, loadCalendarMonth } from "../../utils/storage";
import { calculateMonthlyAllowance } from "../../utils/calculator";
import { getHolidays } from "../../utils/holidays";
import { loadFamilyContext } from "../../utils/familyContext";
import { getSubmittedClaimForMonth } from "../../utils/submittedClaims";
import { useClaims } from "../../hooks/useClaims";
import { getKVAdapter } from "../../utils/kvAdapter";
import { isOnline } from "../../utils/onlineStatus";
import { showToast } from "../../utils/toastManager";
import StatusBadge from "../widgets/StatusBadge";
import ClaimCard from "../widgets/ClaimCard";
import ChildClaimDetailModal from "./ChildClaimDetailModal";
import ExtraClaimModal from "./ExtraClaimModal";
import { formatAmountShort } from "../../utils/formatAmount";
import SpendingStatsModal from "./SpendingStatsModal";

export default function YearlyStatsModal({ onClose, year: propYear, month: propMonth }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [year, setYear] = useState(currentYear);
  const [tab, setTab] = useState("stats"); // "stats" | "history"

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // 이력 탭 관련
  const ctx = useMemo(() => loadFamilyContext(), []);
  const { claims, fetchClaims, loading: claimsLoading } = useClaims(ctx?.family_id);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [receivingId, setReceivingId] = useState(null);
  const [showExtraClaim, setShowExtraClaim] = useState(false);
  const [showSpendingStats, setShowSpendingStats] = useState(false);

  const regularClaims = useMemo(() => claims.filter(c => c.type !== "grant"), [claims]);
  const grantClaims = useMemo(() => claims.filter(c => c.type === "grant"), [claims]);

  // 추가청구 가능 여부
  const currentSubmitted = getSubmittedClaimForMonth(propYear || currentYear, propMonth || currentMonth);
  const canExtraClaim = currentSubmitted?.status === "paid";

  useEffect(() => {
    if (tab === "history" && ctx) {
      const adapter = getKVAdapter();
      adapter.setFamilyCode(ctx.family_code);
      fetchClaims();
    }
  }, [tab, ctx, fetchClaims]);

  useEffect(() => {
    if (claims.length > 0) syncSubmittedClaims(claims);
  }, [claims]);

  async function handleReceiveGrant(grant) {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 확인할 수 없어요" });
      return;
    }
    setReceivingId(grant.claim_id);
    try {
      const adapter = getKVAdapter();
      await adapter.receiveGrant(grant.claim_id, { expected_updated_at: grant.updated_at });
      showToast({ type: "success", message: `💝 ${grant.name || "추가 보너스"} 수령 확인!` });
      await fetchClaims();
    } catch {
      showToast({ type: "error", message: "수령 확인 실패" });
    } finally {
      setReceivingId(null);
    }
  }

  const stats = useMemo(() => {
    const settings = loadSettings();
    const holidays = getHolidays();
    const allClaims = loadSubmittedClaims();
    const months = [];

    let yearTotal = 0;
    let yearApproved = 0;
    let yearPending = 0;
    let yearRejected = 0;

    for (let m = 1; m <= 12; m++) {
      // 미래 달은 스킵
      if (year === currentYear && m > currentMonth) {
        months.push({ month: m, total: 0, claim: null, isFuture: true });
        continue;
      }

      // 금액 계산
      let total = 0;
      if (settings) {
        try {
          const calendar = loadCalendarMonth(year, m);
          const calc = calculateMonthlyAllowance(year, m, settings, calendar, holidays);
          total = calc.total;
        } catch {
          // 계산 실패 시 0
        }
      }

      // 제출 이력
      const claim = allClaims.find(
        (c) => c.year === year && c.month === m && !c.is_extra
      ) || null;

      // 추가 청구
      const extraClaims = allClaims.filter(
        (c) => c.year === year && c.month === m && c.is_extra
      );
      const extraTotal = extraClaims.reduce((s, c) => s + (c.total || 0), 0);

      const displayTotal = claim?.total || total;
      yearTotal += displayTotal + extraTotal;

      if (claim) {
        if (claim.status === "approved" || claim.status === "paid") yearApproved++;
        else if (claim.status === "pending") yearPending++;
        else if (claim.status === "rejected") yearRejected++;
      }

      months.push({ month: m, total: displayTotal, extraTotal, claim, extraCount: extraClaims.length, isFuture: false });
    }

    return { months, yearTotal, yearApproved, yearPending, yearRejected };
  }, [year, currentYear, currentMonth]);

  // 최대 금액 (바 차트 스케일용)
  const maxTotal = Math.max(...stats.months.map(m => m.total + (m.extraTotal || 0)), 1);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-title"
    >
      <div
        className="modal-content"
        style={{ maxWidth: 480, padding: 0, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="stats-title" className="modal-title">📊 통계</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        {/* 탭 전환 */}
        <div className="general-type-toggle" style={{ margin: "0 var(--space-4) var(--space-2)" }}>
          <button
            className={`general-type-toggle__btn${tab === "stats" ? " general-type-toggle__btn--active" : ""}`}
            onClick={() => setTab("stats")}
          >
            📊 통계
          </button>
          <button
            className={`general-type-toggle__btn${tab === "history" ? " general-type-toggle__btn--active" : ""}`}
            onClick={() => setTab("history")}
          >
            📜 이력
          </button>
          <button
            className={`general-type-toggle__btn${tab === "analysis" ? " general-type-toggle__btn--active" : ""}`}
            onClick={() => setShowSpendingStats(true)}
          >
            📈 분석
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {/* 통계 탭 */}
          {tab === "stats" && <div className="modal-body">
            {/* 연도 선택 */}
            <div className="stats-year-nav">
              <button
                onClick={() => setYear(y => y - 1)}
                className="stats-year-btn"
                disabled={year <= 2024}
              >
                ◀
              </button>
              <span className="stats-year-label">{year}년</span>
              <button
                onClick={() => setYear(y => y + 1)}
                className="stats-year-btn"
                disabled={year >= currentYear}
              >
                ▶
              </button>
            </div>

            {/* 연간 요약 */}
            <div className="stats-summary">
              <div className="stats-summary__item stats-summary__item--total">
                <div className="stats-summary__value">
                  {formatAmountShort(stats.yearTotal)}<span className="amount-unit">원</span>
                </div>
                <div className="stats-summary__label">연간 총액</div>
              </div>
              <div className="stats-summary__item stats-summary__item--approved">
                <div className="stats-summary__value">{stats.yearApproved}</div>
                <div className="stats-summary__label">승인</div>
              </div>
              <div className="stats-summary__item stats-summary__item--pending">
                <div className="stats-summary__value">{stats.yearPending}</div>
                <div className="stats-summary__label">대기</div>
              </div>
              <div className="stats-summary__item stats-summary__item--rejected">
                <div className="stats-summary__value">{stats.yearRejected}</div>
                <div className="stats-summary__label">거절</div>
              </div>
            </div>

            {/* 월별 바 차트 */}
            <div className="stats-chart">
              {stats.months.map((m) => {
                const barTotal = m.total + (m.extraTotal || 0);
                const barPercent = maxTotal > 0 ? (barTotal / maxTotal) * 100 : 0;
                const isCurrentMonth = year === currentYear && m.month === currentMonth;

                return (
                  <div
                    key={m.month}
                    className={`stats-chart__row${m.isFuture ? " stats-chart__row--future" : ""}${isCurrentMonth ? " stats-chart__row--current" : ""}`}
                  >
                    <span className="stats-chart__month">{m.month}월</span>
                    <div className="stats-chart__bar-wrap">
                      {!m.isFuture && barTotal > 0 && (
                        <div
                          className="stats-chart__bar"
                          style={{ width: `${Math.max(barPercent, 4)}%` }}
                        >
                          {m.extraTotal > 0 && (
                            <div
                              className="stats-chart__bar-extra"
                              style={{ width: `${(m.extraTotal / barTotal) * 100}%` }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <span className="stats-chart__amount">
                      {m.isFuture ? "—" : (
                        <>
                          {formatAmountShort(barTotal)}
                          <span className="amount-unit">원</span>
                        </>
                      )}
                    </span>
                    <span className="stats-chart__status">
                      {m.claim ? <StatusBadge status={m.claim.status} size="sm" /> : (
                        !m.isFuture && <span className="stats-chart__no-claim">미제출</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <div className="stats-legend">
              <span><span className="stats-legend__dot stats-legend__dot--regular" />정기</span>
              <span><span className="stats-legend__dot stats-legend__dot--extra" />추가</span>
            </div>
          </div>}

          {/* 이력 탭 */}
          {tab === "history" && (
            <div style={{ padding: "var(--space-4)" }}>
              {claimsLoading && claims.length === 0 && (
                <div className="modal-empty">
                  <span className="spinner spinner--md" style={{ display: "block", margin: "0 auto var(--space-3)" }} />
                  <p className="modal-empty__text">불러오는 중...</p>
                </div>
              )}

              {!claimsLoading && claims.length === 0 && (
                <div className="modal-empty">
                  <div className="modal-empty__icon">📭</div>
                  <p className="modal-empty__text">아직 제출한 청구가 없어요</p>
                </div>
              )}

              {/* 추가 보너스 */}
              {grantClaims.length > 0 && (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <h3 className="text-sm font-medium" style={{ marginBottom: "var(--space-2)", color: "var(--color-text-secondary)" }}>💝 추가 보너스</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    {grantClaims.map((c, i) => (
                      <ClaimCard
                        key={c.claim_id}
                        claim={c}
                        onClick={setSelectedClaim}
                        onReceiveGrant={c.status === "granted" ? handleReceiveGrant : undefined}
                        quickLoading={receivingId === c.claim_id}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 청구 이력 */}
              {regularClaims.length > 0 && (
                <div>
                  {grantClaims.length > 0 && (
                    <h3 className="text-sm font-medium" style={{ marginBottom: "var(--space-2)", color: "var(--color-text-secondary)" }}>📋 청구 이력</h3>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    {regularClaims.map((c, i) => (
                      <ClaimCard
                        key={c.claim_id}
                        claim={c}
                        onClick={setSelectedClaim}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 추가 청구 버튼 */}
              {canExtraClaim && (
                <button
                  className="btn btn--primary"
                  style={{ width: "100%", marginTop: "var(--space-4)" }}
                  onClick={() => setShowExtraClaim(true)}
                >
                  ➕ 추가 청구하기
                </button>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer modal-footer--end">
          <button onClick={onClose} className="btn btn--secondary">닫기</button>
        </div>
      </div>

      {selectedClaim && (
        <ChildClaimDetailModal
          claimSummary={selectedClaim}
          onClose={() => { setSelectedClaim(null); fetchClaims(); }}
        />
      )}

      {showExtraClaim && (
        <ExtraClaimModal
          year={propYear || currentYear}
          month={propMonth || currentMonth}
          onClose={() => setShowExtraClaim(false)}
          onSuccess={() => { setShowExtraClaim(false); fetchClaims(); }}
        />
      )}
      {showSpendingStats && (
        <SpendingStatsModal
          role="child"
          onClose={() => setShowSpendingStats(false)}
        />
      )}
    </div>
  );
}
