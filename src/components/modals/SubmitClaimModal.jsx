// src/components/modals/SubmitClaimModal.jsx — S-2-103 청구 제출 확인 + 이월 청구
import { useState, useCallback, useMemo } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useToast } from "../../hooks/useToast";
import { getKVAdapter } from "../../utils/kvAdapter";
import { loadFamilyContext } from "../../utils/familyContext";
import { generateClaimId } from "../../utils/idGenerator";
import { upsertSubmittedClaim } from "../../utils/submittedClaims";
import { getMessageForError } from "../../constants/errorMessages";
import { getCategoryIcon } from "../../constants/categories";
import { loadCustomCategories } from "../../utils/storage";
import { detectCarryover } from "../../utils/carryoverDetector";
import { formatAmount, formatAmountShort } from "../../utils/formatAmount";
import { getWeekdayKor } from "../../utils/calculator";
import CurrencyInput from "../inputs/CurrencyInput";

/**
 * @param {{
 *   year: number,
 *   month: number,
 *   snapshot: import("../../utils/createClaimSnapshot").ClaimSnapshot,
 *   onClose: () => void,
 *   onSuccess: (claim: object) => void
 * }} props
 */
export default function SubmitClaimModal({ year, month, snapshot, onClose, onSuccess }) {
  const contentRef = useModalBase(onClose);
  const { showToast } = useToast();

  const calc = snapshot.calculation;
  const customCategories = snapshot.custom_categories || loadCustomCategories();

  // 이월 감지
  const carryover = useMemo(() => detectCarryover(year, month), [year, month]);
  const [includeCarryover, setIncludeCarryover] = useState(carryover.found);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualNote, setManualNote] = useState("");

  // 수동 입력 금액
  const manualAmountNum = parseInt(manualAmount, 10) || 0;

  // 이월 금액 (자동 감지 또는 수동 입력)
  const carryoverAmount = includeCarryover && carryover.found
    ? carryover.total
    : 0;
  const totalCarryover = carryoverAmount + manualAmountNum;

  // 최종 합계
  const grandTotal = calc.total + totalCarryover;

  // 이월 정보를 스냅샷에 포함
  const enrichedSnapshot = useMemo(() => {
    if (totalCarryover <= 0) return snapshot;
    return {
      ...snapshot,
      carryover: {
        auto: includeCarryover && carryover.found ? {
          year: carryover.year,
          month: carryover.month,
          items: carryover.items,
          total: carryover.total,
        } : null,
        manual: manualAmountNum > 0 ? {
          amount: manualAmountNum,
          note: manualNote.trim() || "수동 이월 금액",
        } : null,
        total: totalCarryover,
      },
      calculation: {
        ...snapshot.calculation,
        carryover_total: totalCarryover,
        total: grandTotal,
      },
    };
  }, [snapshot, totalCarryover, includeCarryover, carryover, manualAmountNum, manualNote, grandTotal]);

  const submitAction = useAsyncAction(useCallback(async () => {
    const ctx = loadFamilyContext();
    if (!ctx) {
      showToast({ type: "error", message: "가족 설정이 필요합니다." });
      return;
    }

    const claimId = generateClaimId();
    const adapter = getKVAdapter();
    adapter.setFamilyCode(ctx.family_code);

    const claim = await adapter.submitClaim({
      claim_id: claimId,
      year,
      month,
      is_extra: false,
      snapshot: enrichedSnapshot,
    });

    upsertSubmittedClaim({
      claim_id: claim.claim_id,
      year,
      month,
      is_extra: false,
      status: claim.status,
      submitted_at: claim.submitted_at,
    });

    showToast({ type: "success", message: "청구가 전송되었어요! 부모님 확인을 기다리는 중" });
    onSuccess(claim);
  }, [year, month, enrichedSnapshot, showToast, onSuccess]));

  function handleSubmit() {
    submitAction.run().catch((err) => {
      const msg = getMessageForError(err);
      showToast({ type: "error", message: msg });
      if (err.code === "DUPLICATE_CLAIM") {
        onClose();
      }
    });
  }

  // 카테고리별 임시 항목 그룹화
  const extraGroups = {};
  if (calc.cells) {
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

  // 이월 항목 카테고리별 그룹
  const carryoverGroups = {};
  if (includeCarryover && carryover.found) {
    carryover.items.forEach((item) => {
      const cat = item.category;
      if (!carryoverGroups[cat]) {
        carryoverGroups[cat] = { count: 0, total: 0, icon: getCategoryIcon(cat, customCategories) };
      }
      carryoverGroups[cat].count++;
      carryoverGroups[cat].total += item.amount;
    });
  }

  return (
    <div className="modal-backdrop" onClick={submitAction.loading ? undefined : onClose}>
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 440, padding: 0, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-title"
      >
        <div className="modal-header">
          <h2 id="submit-title" className="modal-title">
            {month}월 정기 청구
          </h2>
          <button
            onClick={onClose}
            disabled={submitAction.loading}
            className="modal-close"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          <div className="modal-body">
            {/* 이번 달 내역 */}
            <div className="detail-card">
              <div className="detail-card__header">{month}월 청구 내역</div>
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
              {totalCarryover <= 0 && (
                <div className="detail-total">
                  <span>합계</span>
                  <span className="detail-total__amount">{formatAmountShort(calc.total)}<span className="amount-unit" style={{ color: "var(--color-primary)" }}>원</span></span>
                </div>
              )}
            </div>

            {/* 결석(빠진 날) 요약 */}
            {(() => {
              const skippedDays = (calc.cells || []).filter(c => c.skip_school || c.skip_academy);
              if (skippedDays.length === 0) return null;
              const schoolFullCount = skippedDays.filter(c => c.skip_school === "full").length;
              const schoolHalfCount = skippedDays.filter(c => c.skip_school === "half").length;
              const academyFullCount = skippedDays.filter(c => c.skip_academy === "full").length;
              const academyHalfCount = skippedDays.filter(c => c.skip_academy === "half").length;
              return (
                <div className="detail-card" style={{ marginBottom: "var(--space-3)" }}>
                  <div className="detail-card__header">🚫 빠진 날 ({skippedDays.length}일)</div>
                  <div className="detail-card__body">
                    {skippedDays.map(c => {
                      const d = parseInt(c.date.split("-")[2], 10);
                      const labels = [];
                      if (c.skip_school === "full") labels.push("🏫전체");
                      else if (c.skip_school === "half") labels.push("🏫편도");
                      if (c.skip_academy === "full") labels.push("✏️전체");
                      else if (c.skip_academy === "half") labels.push("✏️편도");
                      return (
                        <div key={c.date} className="detail-row" style={{ fontSize: "var(--font-size-sm)" }}>
                          <span className="detail-row__label">
                            {month}/{d}({getWeekdayKor(c.weekday)}) {labels.join(" ")}
                          </span>
                          <span className="detail-row__amount" style={{ color: "var(--color-text-tertiary)" }}>
                            제외
                          </span>
                        </div>
                      );
                    })}
                    <div className="detail-row" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-2)", marginTop: "var(--space-2)" }}>
                      <span className="detail-row__label" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                        {schoolFullCount > 0 && `학교 결석 ${schoolFullCount}일`}
                        {schoolHalfCount > 0 && ` 편도 ${schoolHalfCount}일`}
                        {(schoolFullCount > 0 || schoolHalfCount > 0) && (academyFullCount > 0 || academyHalfCount > 0) && " / "}
                        {academyFullCount > 0 && `학원 결석 ${academyFullCount}일`}
                        {academyHalfCount > 0 && ` 편도 ${academyHalfCount}일`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 이월 청구 섹션 */}
            {carryover.found && (
              <div className="carryover-section">
                <label className="carryover-toggle">
                  <input
                    type="checkbox"
                    checked={includeCarryover}
                    onChange={(e) => setIncludeCarryover(e.target.checked)}
                  />
                  <div className="carryover-toggle__content">
                    <div className="carryover-toggle__title">
                      📦 {carryover.month}월 미청구 금액 포함
                    </div>
                    <div className="carryover-toggle__desc">
                      지난달 청구되지 않은 {carryover.items.length}건, {formatAmount(carryover.total)}
                    </div>
                  </div>
                </label>

                {includeCarryover && (
                  <div className="detail-card" style={{ marginTop: "var(--space-2)" }}>
                    <div className="detail-card__header">{carryover.month}월 미청구 내역</div>
                    <div className="detail-card__body">
                      {Object.entries(carryoverGroups).map(([cat, g]) => (
                        <div key={cat} className="detail-row">
                          <span className="detail-row__label">{g.icon} {g.count > 1 ? `${cat} ${g.count}건` : cat}</span>
                          <span className="detail-row__amount">{formatAmountShort(g.total)}<span className="amount-unit">원</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 수동 이월 입력 */}
            {!carryover.found && !showManualInput && (
              <button
                onClick={() => setShowManualInput(true)}
                className="btn btn--ghost btn--full"
                style={{ marginBottom: "var(--space-3)" }}
              >
                📦 지난달 미청구 금액 직접 입력
              </button>
            )}

            {showManualInput && (
              <div className="carryover-section">
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: "var(--space-2)",
                }}>
                  <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text-primary)" }}>
                    📦 지난달 미청구 금액
                  </span>
                  <button
                    onClick={() => { setShowManualInput(false); setManualAmount(""); setManualNote(""); }}
                    className="btn btn--ghost"
                    style={{ padding: "2px 8px", minHeight: "auto", fontSize: "var(--font-size-xs)" }}
                  >
                    취소
                  </button>
                </div>
                <CurrencyInput
                  value={manualAmount}
                  onChange={setManualAmount}
                  placeholder="금액 (원)"
                  max={10000000}
                  label="수동 이월 금액"
                />
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="메모 (예: 4월 환승 추가요금)"
                  maxLength={50}
                  style={{ width: "100%" }}
                />
              </div>
            )}

            {/* 최종 합계 (이월 포함 시) */}
            {totalCarryover > 0 && (
              <div className="detail-card">
                <div className="detail-total" style={{ borderTop: "none" }}>
                  <div>
                    <span>최종 합계</span>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", fontWeight: "normal" }}>
                      이번달 {formatAmount(calc.total)} + 이월 {formatAmount(totalCarryover)}
                    </div>
                  </div>
                  <span className="detail-total__amount">{formatAmountShort(grandTotal)}<span className="amount-unit" style={{ color: "var(--color-primary)" }}>원</span></span>
                </div>
              </div>
            )}

            <div className="modal-hint">
              <span>💡</span>
              <span>부모님께 도착하면 검토 후 승인/거절됩니다.</span>
            </div>
          </div>
        </div>

        <div className="modal-footer modal-footer--stretch">
          <button
            onClick={onClose}
            disabled={submitAction.loading}
            className="btn btn--secondary"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitAction.loading}
            className="btn btn--primary"
            autoFocus
          >
            {submitAction.loading ? (
              <><span className="spinner spinner--sm spinner--on-primary" /> 전송 중...</>
            ) : <>✈️ {formatAmountShort(grandTotal)}<span className="amount-unit">원</span> 제출</>}
          </button>
        </div>
      </div>
    </div>
  );
}
