// src/components/modals/ExtraClaimModal.jsx — S-2-104 추가 청구

import { useState, useCallback, useEffect } from "react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useToast } from "../../hooks/useToast";
import { getKVAdapter } from "../../utils/kvAdapter";
import { loadFamilyContext } from "../../utils/familyContext";
import { generateClaimId, newExtraItemId } from "../../utils/idGenerator";
import { loadCustomCategories } from "../../utils/storage";
import { upsertSubmittedClaim } from "../../utils/submittedClaims";
import { isOnline } from "../../utils/onlineStatus";
import { getMessageForError } from "../../constants/errorMessages";
import ExtraItemForm from "./ExtraItemForm";
import { formatAmountShort } from "../../utils/formatAmount";

/**
 * @param {{
 *   year: number,
 *   month: number,
 *   onClose: () => void,
 *   onSuccess: (claim: object) => void
 * }} props
 */
export default function ExtraClaimModal({ year, month, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);
  const [showItemForm, setShowItemForm] = useState(false);

  const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);

  function handleAddItem(item) {
    setItems(prev => [...prev, { ...item, id: newExtraItemId() }]);
    setShowItemForm(false);
  }

  function handleRemoveItem(id) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  const submitAction = useAsyncAction(useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 제출할 수 없어요" });
      return;
    }
    if (items.length === 0) {
      showToast({ type: "error", message: "추가 항목을 1개 이상 입력하세요" });
      return;
    }

    const ctx = loadFamilyContext();
    if (!ctx) {
      showToast({ type: "error", message: "가족 설정이 필요합니다" });
      return;
    }

    const snapshot = {
      calculation: {
        total: itemsTotal,
        extra_items: items.map(({ id, ...rest }) => rest),
      },
      custom_categories: loadCustomCategories(),
    };

    const claimId = generateClaimId();
    const adapter = getKVAdapter();
    adapter.setFamilyCode(ctx.family_code);

    const claim = await adapter.submitClaim({
      claim_id: claimId,
      year,
      month,
      is_extra: true,
      snapshot,
    });

    upsertSubmittedClaim({
      claim_id: claim.claim_id,
      year,
      month,
      is_extra: true,
      status: claim.status,
      submitted_at: claim.submitted_at,
    });

    showToast({ type: "success", message: "추가 청구가 전송되었어요!" });
    onSuccess(claim);
  }, [year, month, items, itemsTotal, showToast, onSuccess]));

  function handleSubmit() {
    submitAction.run().catch((err) => {
      showToast({ type: "error", message: getMessageForError(err) });
    });
  }

  return (
    <div
      className="modal-backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="extra-title"
    >
      <div
        className="modal-content"
        style={{ maxWidth: 420, padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="extra-title" className="modal-title">
            {month}월 추가 청구
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

        <div className="modal-body">
          {/* 추가된 항목 목록 */}
          {items.length > 0 ? (
            <div className="detail-card" style={{ marginBottom: 12 }}>
              <div className="detail-card__header">추가 청구 항목</div>
              {items.map((item) => (
                <div key={item.id} className="extra-item-row">
                  <span className="extra-item-row__name">
                    {item.category} — {item.name}
                  </span>
                  <span className="extra-item-row__right">
                    <span className="extra-item-row__amount">
                      {formatAmountShort(item.amount)}<span className="amount-unit">원</span>
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={submitAction.loading}
                      className="extra-item-row__delete"
                      aria-label={`${item.name} 삭제`}
                    >
                      ×
                    </button>
                  </span>
                </div>
              ))}
              <div className="detail-total" style={{ marginTop: 8 }}>
                <span>합계</span>
                <span className="detail-total__amount">
                  {formatAmountShort(itemsTotal)}
                  <span className="amount-unit" style={{ color: "var(--color-primary)" }}>원</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="modal-empty" style={{ marginBottom: 12 }}>
              <div className="modal-empty__icon">📝</div>
              <p className="modal-empty__text">추가 청구할 항목을 입력하세요</p>
            </div>
          )}

          {/* 항목 추가 버튼 */}
          <button
            onClick={() => setShowItemForm(true)}
            disabled={submitAction.loading}
            className="btn btn--secondary"
            style={{ width: "100%", marginBottom: 12 }}
          >
            + 항목 추가
          </button>

          <div className="modal-hint">
            <span>💡</span>
            <span>추가 청구는 정기 청구와 별도로 처리됩니다.</span>
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
            disabled={submitAction.loading || items.length === 0}
            className="btn btn--primary"
          >
            {submitAction.loading ? (
              <><span className="spinner spinner--sm spinner--on-primary" /> 전송 중...</>
            ) : <>✈️ 추가 제출 ({formatAmountShort(itemsTotal)}<span className="amount-unit">원</span>)</>}
          </button>
        </div>
      </div>

      {/* 항목 추가 폼 */}
      {showItemForm && (
        <ExtraItemForm
          onClose={() => setShowItemForm(false)}
          onSubmit={handleAddItem}
        />
      )}
    </div>
  );
}
