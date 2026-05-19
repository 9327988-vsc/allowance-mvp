// src/components/modals/ParentClaimDetailModal.jsx — S-2-002 부모 청구 상세
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { useClaim } from "../../hooks/useClaim";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useToast } from "../../hooks/useToast";
import { getKVAdapter } from "../../utils/kvAdapter";
import { isOnline } from "../../utils/onlineStatus";
import { getMessageForError } from "../../constants/errorMessages";
import { getCategoryIcon } from "../../constants/categories";
import StatusBadge from "../widgets/StatusBadge";
import CommentSection from "../widgets/CommentSection";
import RejectionReasonModal from "./RejectionReasonModal";
import { formatAmountShort } from "../../utils/formatAmount";
import { loadUserPrefs } from "../../utils/userPrefs";
import { getActiveUser } from "../../utils/authStore";

const DAY_HEADERS_SUN = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_HEADERS_MON = ["월", "화", "수", "목", "금", "토", "일"];
const WEEKDAY_KOR = { sun: "일", mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토" };

/** 셀 클릭 시 나오는 상세 팝업 */
function CellDetailPopup({ cell, customCategories, onClose }) {
  if (!cell) return null;
  const day = parseInt(cell.date.split("-")[2], 10);
  const weekdayKor = WEEKDAY_KOR[cell.weekday] || "";
  const hasExtra = cell.extra_items && cell.extra_items.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${day}일 (${weekdayKor}) 상세 정보`}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      style={{
        position: "fixed", inset: 0, zIndex: "var(--z-modal-1, 200)",
        background: "rgba(15,23,42,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--space-4)",
        animation: "backdrop-fade 0.15s ease-out",
      }}
    >
      <div
        style={{
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-xl)",
          padding: 0,
          maxWidth: 340,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "modal-enter 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          padding: "var(--space-3) var(--space-4)",
          background: "linear-gradient(135deg, var(--gradient-primary-start) 0%, var(--gradient-primary-end) 100%)",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontWeight: 700, fontSize: "var(--font-size-base)" }}>
            {day}일 ({weekdayKor})
            {cell.is_holiday && cell.holiday_name && (
              <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.8, marginLeft: 6 }}>{cell.holiday_name}</span>
            )}
          </span>
          <button
            onClick={onClose}
            className="cell-popup-close"
          >
            ×
          </button>
        </div>

        <div style={{ padding: "var(--space-4)" }}>
          {/* 등교/학원 */}
          {cell.school_fee > 0 && (
            <div className="detail-row">
              <span className="detail-row__label">🏫 학교 버스</span>
              <span className="detail-row__amount">{formatAmountShort(cell.school_fee)}<span className="amount-unit">원</span></span>
            </div>
          )}
          {cell.academy_fee > 0 && (
            <div className="detail-row">
              <span className="detail-row__label">✏️ 학원 버스</span>
              <span className="detail-row__amount">{formatAmountShort(cell.academy_fee)}<span className="amount-unit">원</span></span>
            </div>
          )}

          {/* 임시 항목 */}
          {hasExtra && cell.extra_items.map((item, idx) => (
            <div key={idx} className="detail-row">
              <span className="detail-row__label">
                {getCategoryIcon(item.category, customCategories)} {item.category}
              </span>
              <span className="detail-row__amount">{formatAmountShort(item.amount)}<span className="amount-unit">원</span></span>
            </div>
          ))}

          {/* 메모 */}
          {cell.memo && (
            <div style={{
              marginTop: "var(--space-2)",
              padding: "var(--space-2) var(--space-3)",
              background: "var(--color-bg-secondary)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-secondary)",
            }}>
              📝 {cell.memo}
            </div>
          )}

          {/* 빈 상태 */}
          {!cell.school_fee && !cell.academy_fee && !hasExtra && (
            <div style={{
              textAlign: "center",
              padding: "var(--space-4)",
              color: "var(--color-text-tertiary)",
              fontSize: "var(--font-size-sm)",
            }}>
              {cell.is_holiday ? "🎉 공휴일 — 데이터 없음" : "데이터 없음"}
            </div>
          )}

          {/* 합계 */}
          {cell.total > 0 && (
            <div style={{
              borderTop: "2px solid var(--color-primary)",
              marginTop: "var(--space-3)",
              paddingTop: "var(--space-3)",
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              color: "var(--color-primary)",
            }}>
              <span>합계</span>
              <span>{formatAmountShort(cell.total)}<span className="amount-unit" style={{ color: "var(--color-primary)" }}>원</span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 자녀 캘린더와 동일한 형태의 달력 */
function SnapshotCalendar({ year, month, cells, customCategories, startDay = 0 }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const rawFirstDay = new Date(year, month - 1, 1).getDay();
  const firstDay = (rawFirstDay - startDay + 7) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const DAY_HEADERS = startDay === 1 ? DAY_HEADERS_MON : DAY_HEADERS_SUN;
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  // date 문자열 → cell 매핑
  const cellMap = useMemo(() => {
    const map = {};
    if (cells) {
      cells.forEach((c) => { map[c.date] = c; });
    }
    return map;
  }, [cells]);

  function formatDate(d) {
    return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // 그리드 빈칸 + 날짜
  const gridItems = [];
  for (let i = 0; i < firstDay; i++) gridItems.push(null);
  for (let d = 1; d <= daysInMonth; d++) gridItems.push(d);
  while (gridItems.length % 7 !== 0) gridItems.push(null);

  return (
    <>
      <div className="snapshot-calendar">
        {/* 요일 헤더 */}
        <div className="snapshot-calendar__header">
          {DAY_HEADERS.map((label, i) => (
            <div key={label} className="snapshot-calendar__weekday" style={{
              color: (startDay === 1 ? i === 6 : i === 0) ? "var(--color-holiday)" : (startDay === 1 ? i === 5 : i === 6) ? "var(--color-saturday)" : undefined,
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="snapshot-calendar__body">
          {gridItems.map((day, i) => {
            if (day === null) {
              return <div key={`blank-${i}`} className="snapshot-calendar__cell snapshot-calendar__cell--empty" />;
            }

            const dateStr = formatDate(day);
            const cell = cellMap[dateStr];
            const isToday = isCurrentMonth && day === today.getDate();
            const hasSchool = cell?.school_fee > 0;
            const hasAcademy = cell?.academy_fee > 0;
            const hasExtra = cell?.extra_items?.length > 0;
            const hasData = hasSchool || hasAcademy || hasExtra;
            const cellTotal = cell?.total || 0;
            const gridCol = (firstDay + day - 1) % 7;
            const actualDow = (gridCol + startDay) % 7; // 0=일
            const isHoliday = cell?.is_holiday || actualDow === 0;
            const isSaturday = actualDow === 6;

            return (
              <button
                key={day}
                className={`snapshot-calendar__cell${isToday ? " snapshot-calendar__cell--today" : ""}${hasData ? " snapshot-calendar__cell--has-data" : ""}`}
                onClick={() => cell && setSelectedCell(cell)}
                disabled={!cell}
              >
                <span className="snapshot-calendar__date" style={{
                  color: isHoliday ? "var(--color-holiday)" : isSaturday ? "var(--color-saturday)" : undefined,
                }}>
                  {day}
                </span>
                {hasData && (
                  <div className="snapshot-calendar__icons">
                    {hasSchool && <span>🏫</span>}
                    {hasAcademy && <span>✏️</span>}
                    {hasExtra && <span>🎒</span>}
                  </div>
                )}
                {cellTotal > 0 && (
                  <span className="snapshot-calendar__amount">
                    {formatAmountShort(cellTotal)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="snapshot-calendar__legend">
          <span><span className="snapshot-calendar__legend-dot" style={{ background: "var(--color-school)" }} />학교</span>
          <span><span className="snapshot-calendar__legend-dot" style={{ background: "var(--color-academy)" }} />학원</span>
          <span><span className="snapshot-calendar__legend-dot" style={{ background: "var(--color-extra)" }} />추가</span>
        </div>
      </div>

      {/* 셀 상세 팝업 */}
      {selectedCell && (
        <CellDetailPopup
          cell={selectedCell}
          customCategories={customCategories}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </>
  );
}

/**
 * @param {{
 *   claimSummary: { claim_id, status },
 *   familyContext: import("../../utils/familyContext").FamilyContextData,
 *   onClose: () => void
 * }} props
 */
export default function ParentClaimDetailModal({ claimSummary, familyContext, onClose }) {
  const contentRef = useModalBase(onClose);
  const startDay = useMemo(() => { const uid = getActiveUser(); const p = uid ? loadUserPrefs(uid) : {}; return p.calendar_start === "monday" ? 1 : 0; }, []);
  const { claim, fetchClaim } = useClaim(claimSummary.claim_id);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showUndoRejectConfirm, setShowUndoRejectConfirm] = useState(false);
  const [showPartialPay, setShowPartialPay] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const { showToast } = useToast();


  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

  // 30초 폴링 — 다른 부모가 처리했을 때 반영 (ref로 최신 fetchClaim 참조)
  const fetchClaimRef = useRef(fetchClaim);
  fetchClaimRef.current = fetchClaim;

  useEffect(() => {
    const interval = setInterval(() => {
      fetchClaimRef.current();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 승인
  const approveAction = useAsyncAction(useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    await adapter.patchClaim(claim.claim_id, {
      status: "approved",
      decided_by_member_id: familyContext.member_id,
      expected_updated_at: claim.updated_at,
    });
    showToast({ type: "success", message: "승인되었습니다!" });
    onClose();
  }, [claim, familyContext.member_id, showToast, onClose]));

  // 지급 (전액 또는 부분)
  const payAction = useAsyncAction(useCallback(async (paidAmount) => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    const patchData = {
      status: "paid",
      paid_by_member_id: familyContext.member_id,
      expected_updated_at: claim.updated_at,
    };
    if (paidAmount !== undefined && paidAmount !== null) {
      patchData.paid_amount = paidAmount;
    }
    await adapter.patchClaim(claim.claim_id, patchData);
    const isPartial = paidAmount && paidAmount < (claim.snapshot?.calculation?.total || 0);
    showToast({ type: "success", message: isPartial ? `${paidAmount.toLocaleString("ko-KR")}원 부분 지급 완료!` : "지급 완료!" });
    onClose();
  }, [claim, familyContext.member_id, showToast, onClose]));

  // 거절 (사유 입력 후)
  async function handleReject(reason) {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    try {
      await adapter.patchClaim(claim.claim_id, {
        status: "rejected",
        rejection_reason: reason,
        decided_by_member_id: familyContext.member_id,
        expected_updated_at: claim.updated_at,
      });
      showToast({ type: "success", message: "거절되었습니다" });
      setShowRejectModal(false);
      onClose();
    } catch (err) {
      if (err.code === "CONFLICT") {
        showToast({ type: "error", message: "이미 처리된 청구입니다 (다른 부모가 처리)" });
        setShowRejectModal(false);
        onClose();
      } else {
        showToast({ type: "error", message: getMessageForError(err) });
      }
    }
  }

  function handleAction(action) {
    action.run().catch((err) => {
      if (err.code === "CONFLICT") {
        showToast({ type: "error", message: "이미 처리된 청구입니다 (다른 부모가 처리)" });
        onClose();
      } else {
        showToast({ type: "error", message: getMessageForError(err) });
      }
    });
  }

  // 거절 취소 (되돌리기)
  const undoRejectAction = useAsyncAction(useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    await adapter.patchClaim(claim.claim_id, {
      status: "pending",
      decided_by_member_id: familyContext.member_id,
      expected_updated_at: claim.updated_at,
    });
    showToast({ type: "success", message: "거절이 취소되었습니다" });
    fetchClaim();
  }, [claim, familyContext.member_id, showToast, fetchClaim]));

  const isActing = approveAction.loading || payAction.loading || undoRejectAction.loading;

  if (!claim) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" style={{ maxWidth: 440, padding: 0 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">청구 상세</h2>
            <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
          </div>
          <div className="modal-body">
            <div className="modal-empty">
              <span className="spinner spinner--md" style={{ display: "block", margin: "0 auto var(--space-3)" }} />
              <p className="modal-empty__text">불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const calc = claim.snapshot?.calculation;
  const customCategories = claim.snapshot?.custom_categories || [];

  // 카테고리별 그룹
  const extraGroups = {};
  if (calc?.cells) {
    calc.cells.forEach((c) => {
      (c.extra_items || []).forEach((item) => {
        const cat = item.category;
        if (!extraGroups[cat]) {
          extraGroups[cat] = { count: 0, total: 0, icon: getCategoryIcon(cat, customCategories) };
        }
        extraGroups[cat].count++;
        extraGroups[cat].total += item.amount;
      });
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 460, maxHeight: "90vh", overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-detail-title"
      >
        {/* 헤더 */}
        <div className="modal-header">
          <h2 id="claim-detail-title" className="modal-title">
            {claim.month}월 {claim.is_extra ? "추가" : "정기"} 청구
          </h2>
          <button
            onClick={onClose}
            disabled={isActing}
            className="modal-close"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "var(--space-5)" }}>
          {/* 상태 배지 */}
          <div style={{ marginBottom: "var(--space-4)" }}>
            <StatusBadge status={claim.status} size="md" />
          </div>

          {/* 스냅샷 미리보기 */}
          {!claim.snapshot && (
            <div className="detail-card">
              <div className="detail-card__body" style={{ textAlign: "center", padding: "var(--space-4)", color: "var(--color-text-tertiary)" }}>
                📄 스냅샷 데이터가 없습니다
              </div>
            </div>
          )}
          {calc && (
            <div className="detail-card">
              <div className="detail-card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>청구 내역 ({claim.snapshot?.snapshot_taken_at ? new Date(claim.snapshot.snapshot_taken_at).toLocaleDateString("ko-KR") : "날짜 없음"} 기준)</span>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="btn btn--ghost"
                  style={{ padding: "2px 8px", minHeight: "auto", fontSize: "var(--font-size-xs)" }}
                >
                  {showCalendar ? "📋 내역" : "📅 달력"}
                </button>
              </div>

              {showCalendar ? (
                <div style={{ padding: "var(--space-3) var(--space-4)" }}>
                  <SnapshotCalendar
                    year={claim.year}
                    month={claim.month}
                    cells={calc.cells}
                    customCategories={customCategories}
                    startDay={startDay}
                  />
                </div>
              ) : (
                <>
                  <div className="detail-card__body">
                    {calc.base_allowance > 0 && (
                      <div className="detail-row">
                        <span className="detail-row__label">💰 기본 용돈</span>
                        <span className="detail-row__amount">{formatAmountShort(calc.base_allowance)}<span className="amount-unit">원</span></span>
                      </div>
                    )}
                    {calc.school_total > 0 && (
                      <div className="detail-row">
                        <span className="detail-row__label">🏫 학교 버스</span>
                        <span className="detail-row__amount">{formatAmountShort(calc.school_total)}<span className="amount-unit">원</span></span>
                      </div>
                    )}
                    {calc.academy_total > 0 && (
                      <div className="detail-row">
                        <span className="detail-row__label">✏️ 학원 버스</span>
                        <span className="detail-row__amount">{formatAmountShort(calc.academy_total)}<span className="amount-unit">원</span></span>
                      </div>
                    )}
                    {Object.entries(extraGroups).map(([cat, g]) => (
                      <div key={cat} className="detail-row">
                        <span className="detail-row__label">{g.icon} {g.count > 1 ? `${cat} ${g.count}건` : cat}</span>
                        <span className="detail-row__amount">{formatAmountShort(g.total)}<span className="amount-unit">원</span></span>
                      </div>
                    ))}
                  </div>
                  <div className="detail-total">
                    <span>합계</span>
                    <span className="detail-total__amount">{formatAmountShort(calc.total)}<span className="amount-unit" style={{ color: "var(--color-primary)" }}>원</span></span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 이월 금액 (있을 경우) */}
          {claim.snapshot?.carryover && claim.snapshot.carryover.total > 0 && (
            <div className="carryover-section">
              <div className="carryover-toggle__title" style={{ marginBottom: "var(--space-2)" }}>
                📦 이월 청구 포함 (+{formatAmountShort(claim.snapshot.carryover.total)}<span className="amount-unit">원</span>)
              </div>
              {claim.snapshot.carryover.auto && (
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                  {claim.snapshot.carryover.auto.month}월 미청구분 {claim.snapshot.carryover.auto.items.length}건
                </div>
              )}
              {claim.snapshot.carryover.manual && (
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                  수동 입력: {claim.snapshot.carryover.manual.note} ({formatAmountShort(claim.snapshot.carryover.manual.amount)}<span className="amount-unit">원</span>)
                </div>
              )}
            </div>
          )}

          {/* 거절 사유 (rejected 일 때) */}
          {claim.status === "rejected" && claim.rejection_reason && (
            <div className="rejection-box">
              <div className="rejection-box__label">거절 사유</div>
              <p className="rejection-box__text">{claim.rejection_reason}</p>
            </div>
          )}

          {/* 타임라인 */}
          <div className="timeline">
            <div className="timeline__item">
              <div className="timeline__dot timeline__dot--active" />
              <div className="timeline__content">
                <div className="timeline__label">📤 제출</div>
                <div className="timeline__date">{new Date(claim.submitted_at).toLocaleString("ko-KR")}</div>
              </div>
            </div>
            {claim.decided_at && (
              <div className="timeline__item">
                <div className={`timeline__dot ${claim.status === "rejected" ? "timeline__dot--error" : "timeline__dot--success"}`} />
                <div className="timeline__content">
                  <div className="timeline__label">{claim.status === "rejected" ? "❌ 거절" : "✅ 승인"}</div>
                  <div className="timeline__date">{new Date(claim.decided_at).toLocaleString("ko-KR")}</div>
                </div>
              </div>
            )}
            {claim.paid_at && (
              <div className="timeline__item">
                <div className="timeline__dot timeline__dot--success" />
                <div className="timeline__content">
                  <div className="timeline__label">
                    💰 지급{claim.paid_amount ? ` (${claim.paid_amount.toLocaleString("ko-KR")}원 / ${(claim.snapshot?.calculation?.total || 0).toLocaleString("ko-KR")}원)` : ""}
                  </div>
                  <div className="timeline__date">{new Date(claim.paid_at).toLocaleString("ko-KR")}</div>
                </div>
              </div>
            )}
            {claim.received_at && (
              <div className="timeline__item">
                <div className="timeline__dot timeline__dot--success" />
                <div className="timeline__content">
                  <div className="timeline__label">📥 수령 확인</div>
                  <div className="timeline__date">{new Date(claim.received_at).toLocaleString("ko-KR")}</div>
                </div>
              </div>
            )}
          </div>

          {/* 댓글 */}
          <CommentSection
            claimId={claim.claim_id}
            comments={claim.comments}
            reactions={claim.reactions}
            claimUpdatedAt={claim.updated_at}
            onCommentAdded={fetchClaim}
          />
        </div>

        {/* 액션 버튼 */}
        {(claim.status === "pending" || claim.status === "approved" || claim.status === "rejected") && (
          <div className="modal-footer modal-footer--stretch">
            {claim.status === "pending" && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isActing}
                  className="btn btn--danger"
                >
                  {isActing ? "..." : "❌ 거절"}
                </button>
                <button
                  onClick={() => handleAction(approveAction)}
                  disabled={isActing}
                  className="btn btn--primary"
                >
                  {approveAction.loading ? (
                    <><span className="spinner spinner--sm spinner--on-primary" /> 처리 중</>
                  ) : "✅ 승인"}
                </button>
              </>
            )}

            {claim.status === "approved" && !showPartialPay && (
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button
                  onClick={() => handleAction(payAction)}
                  disabled={isActing}
                  className="btn btn--success btn--lg"
                  style={{ flex: 1 }}
                >
                  {payAction.loading ? (
                    <><span className="spinner spinner--sm spinner--on-primary" /> 처리 중</>
                  ) : "💸 전액 지급"}
                </button>
                <button
                  onClick={() => setShowPartialPay(true)}
                  disabled={isActing}
                  className="btn btn--secondary btn--lg"
                >
                  부분 지급
                </button>
              </div>
            )}

            {claim.status === "approved" && showPartialPay && (
              <div className="partial-pay-form" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                  지급 금액 (청구액: {(claim.snapshot?.calculation?.total || 0).toLocaleString("ko-KR")}원)
                </label>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <input
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="금액 입력"
                    className="input"
                    style={{ flex: 1 }}
                    min="1"
                    max={claim.snapshot?.calculation?.total || 999999}
                  />
                  <span style={{ display: "flex", alignItems: "center", color: "var(--color-text-secondary)" }}>원</span>
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button
                    onClick={() => {
                      const amt = parseInt(partialAmount, 10);
                      const total = claim.snapshot?.calculation?.total || 0;
                      if (!amt || amt < 1) {
                        showToast({ type: "error", message: "1원 이상 입력해주세요" });
                        return;
                      }
                      if (amt > total) {
                        showToast({ type: "error", message: "청구액을 초과할 수 없어요" });
                        return;
                      }
                      payAction.run(amt).catch((err) => {
                        if (err.code === "CONFLICT") {
                          showToast({ type: "error", message: "이미 처리된 청구입니다" });
                          onClose();
                        } else {
                          showToast({ type: "error", message: getMessageForError(err) });
                        }
                      });
                    }}
                    disabled={isActing}
                    className="btn btn--success"
                    style={{ flex: 1 }}
                  >
                    {payAction.loading ? "처리 중..." : "💸 부분 지급"}
                  </button>
                  <button
                    onClick={() => { setShowPartialPay(false); setPartialAmount(""); }}
                    className="btn btn--secondary"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {claim.status === "rejected" && (
              <button
                onClick={() => {
                  if (!isOnline()) {
                    showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
                    return;
                  }
                  setShowUndoRejectConfirm(true);
                }}
                disabled={isActing}
                className="btn btn--secondary btn--full"
              >
                {undoRejectAction.loading ? (
                  <><span className="spinner spinner--sm" /> 처리 중</>
                ) : "↩️ 거절 취소"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 거절 취소 확인 */}
      {showUndoRejectConfirm && (
        <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-3)" }} onClick={() => setShowUndoRejectConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: 360, width: "90%" }} onClick={e => e.stopPropagation()}>
            <p className="mb-3">거절을 취소하고 다시 대기 상태로 되돌릴까요?</p>
            <div className="flex justify-end gap-2">
              <button className="btn btn--secondary" onClick={() => setShowUndoRejectConfirm(false)}>취소</button>
              <button className="btn btn--primary" onClick={() => { setShowUndoRejectConfirm(false); handleAction(undoRejectAction); }}>확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 거절 사유 모달 */}
      {showRejectModal && (
        <RejectionReasonModal
          onSubmit={handleReject}
          onClose={() => setShowRejectModal(false)}
          loading={isActing}
        />
      )}
    </div>
  );
}
