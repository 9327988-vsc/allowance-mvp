// src/components/modals/GeneralCellEditModal.jsx — 일반계정 셀 편집
import { useState, useCallback } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { getGeneralCategoryIcon } from "../../constants/generalCategories";
import { newExtraItemId } from "../../utils/idGenerator";
import { validateMemo } from "../../utils/validators";
import { showToast } from "../../utils/toastManager";
import { formatAmountShort } from "../../utils/formatAmount";
import GeneralItemForm from "./GeneralItemForm";
import ConfirmDirtyModal from "./ConfirmDirtyModal";

const MAX_ITEMS = 20;

const WEEKDAY_KOR = { sun: "일", mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토" };

export default function GeneralCellEditModal({ cell, calendar, onSave, onClose }) {
  const { date, weekday, is_holiday, holiday_name } = cell;
  const day = parseInt(date.split("-")[2], 10);
  const month = parseInt(date.split("-")[1], 10);

  const [originalItems] = useState(() => {
    const items = calendar?.cells?.[date]?.extra_items;
    return items ? JSON.parse(JSON.stringify(items)) : [];
  });
  const [originalMemo] = useState(() => calendar?.cells?.[date]?.memo ?? "");

  const [items, setItems] = useState(() => {
    const existing = calendar?.cells?.[date]?.extra_items;
    return existing ? JSON.parse(JSON.stringify(existing)) : [];
  });
  const [memo, setMemo] = useState(() => calendar?.cells?.[date]?.memo ?? "");
  const [memoError, setMemoError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);

  const isDirty = useCallback(() => {
    return JSON.stringify({ extra_items: originalItems, memo: originalMemo }) !==
           JSON.stringify({ extra_items: items, memo });
  }, [originalItems, originalMemo, items, memo]);

  const handleClose = useCallback(() => {
    if (isDirty()) {
      setShowDirtyConfirm(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  // useModalBase: scroll lock + focus trap + ESC (when no sub-modal open)
  const hasChildOpen = !!(showDirtyConfirm || deleteConfirmId || showAddForm || editingItemId);
  const modalRef = useModalBase(handleClose, { active: !hasChildOpen });

  // Sub-modal: delete confirm — focus trap + scroll lock + ESC via modal stack
  const deleteDialogRef = useModalBase(() => setDeleteConfirmId(null), { active: !!deleteConfirmId });

  function handleSave() {
    const validation = validateMemo(memo);
    if (!validation.valid) {
      setMemoError(validation.errors.memo);
      return;
    }
    onSave(date, { extra_items: items, memo: memo.trim() });
    onClose();
  }

  function handleAddItem(input) {
    const newItem = {
      id: newExtraItemId(),
      type: input.type,
      category: input.category,
      name: input.name,
      amount: input.amount,
      created_at: new Date().toISOString(),
    };
    setItems(prev => [...prev, newItem]);
    setShowAddForm(false);
  }

  function handleEditItem(input) {
    setItems(prev =>
      prev.map(item =>
        item.id === editingItemId
          ? { ...item, type: input.type, category: input.category, name: input.name, amount: input.amount }
          : item
      )
    );
    setEditingItemId(null);
  }

  function handleDeleteItem(id) {
    setItems(prev => prev.filter(item => item.id !== id));
    setDeleteConfirmId(null);
  }

  const editingItem = editingItemId ? items.find(i => i.id === editingItemId) : null;

  // 합계 계산
  const incomeTotal = items.filter(i => i.type === "income").reduce((s, i) => s + (i.amount || 0), 0);
  const expenseTotal = items.filter(i => i.type !== "income").reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <>
      <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-1)" }} onClick={handleClose}>
        <div
          ref={modalRef}
          tabIndex={-1}
          className="modal-content cell-edit-modal"
          style={{ maxWidth: 480, width: "95%" }}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-label={`${month}월 ${day}일 편집`}
          aria-modal="true"
        >
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              {month}월 {day}일 ({WEEKDAY_KOR[weekday] || weekday})
              {holiday_name && (
                <span className="ml-2 text-sm font-normal" style={{ color: "var(--color-holiday)" }}>
                  {holiday_name}
                </span>
              )}
            </h3>
            <button onClick={handleClose} aria-label="닫기" className="text-xl px-2">×</button>
          </div>

          {/* 일일 요약 */}
          {(incomeTotal > 0 || expenseTotal > 0) && (
            <div className="general-day-summary mb-4">
              {incomeTotal > 0 && (
                <span className="general-day-summary__income">
                  +{formatAmountShort(incomeTotal)}원
                </span>
              )}
              {expenseTotal > 0 && (
                <span className="general-day-summary__expense">
                  -{formatAmountShort(expenseTotal)}원
                </span>
              )}
            </div>
          )}

          {/* 항목 목록 */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">
              항목 ({items.length}/{MAX_ITEMS})
            </p>
            {items.length === 0 && (
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                아직 등록된 항목이 없습니다
              </p>
            )}
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b" style={{ gap: "var(--space-2)" }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-1)", minWidth: 0 }}>
                  <span
                    className="text-xs px-1 rounded"
                    style={{
                      background: item.type === "income" ? "var(--color-income-bg, #e8f5e9)" : "var(--color-expense-bg, #ffebee)",
                      color: item.type === "income" ? "var(--color-income, #2e7d32)" : "var(--color-expense, #c62828)",
                    }}
                  >
                    {item.type === "income" ? "수입" : "지출"}
                  </span>
                  <span className="text-sm" style={{ whiteSpace: "nowrap" }}>
                    {getGeneralCategoryIcon(item.category)} {item.name}
                  </span>
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                    {formatAmountShort(item.amount)}<span className="amount-unit">원</span>
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingItemId(item.id)}
                    aria-label={`${item.name} 수정`}
                    className="px-2 py-1 text-sm rounded item-action-btn"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    aria-label={`${item.name} 삭제`}
                    className="px-2 py-1 text-sm rounded item-action-btn"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
            {items.length < MAX_ITEMS ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 w-full py-2 text-sm rounded-md border border-dashed item-add-btn"
                style={{ color: "var(--color-primary)" }}
              >
                + 항목 추가
              </button>
            ) : (
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                최대 {MAX_ITEMS}개까지 추가할 수 있습니다
              </p>
            )}
          </div>

          {/* 메모 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">메모 (200자 이내)</label>
            <textarea
              value={memo}
              onChange={e => { setMemo(e.target.value); setMemoError(""); }}
              maxLength={200}
              rows={3}
              className="w-full border rounded-md p-2 resize-none"
              style={{ fontSize: "var(--font-size-base)" }}
              placeholder="메모를 입력하세요"
            />
            <div className="flex justify-between text-xs" style={{ color: memoError ? "var(--color-error)" : "var(--color-text-tertiary)" }}>
              <span>{memoError}</span>
              <span>{memo.length}/200</span>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="modal-footer modal-footer--end">
            <button onClick={handleClose} className="btn btn--secondary">취소</button>
            <button onClick={handleSave} className="btn btn--primary">저장</button>
          </div>
        </div>
      </div>

      {/* 추가 폼 */}
      {showAddForm && (
        <GeneralItemForm onClose={() => setShowAddForm(false)} onSubmit={handleAddItem} />
      )}

      {/* 수정 폼 */}
      {editingItem && (
        <GeneralItemForm
          onClose={() => setEditingItemId(null)}
          onSubmit={handleEditItem}
          defaultValues={editingItem}
        />
      )}

      {/* 삭제 확인 */}
      {deleteConfirmId && (() => {
        const item = items.find(i => i.id === deleteConfirmId);
        if (!item) return null;
        return (
          <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-3)" }} onClick={() => setDeleteConfirmId(null)}>
            <div
              ref={deleteDialogRef}
              className="modal-content"
              style={{ maxWidth: 360, width: "90%" }}
              onClick={e => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-label="삭제 확인"
            >
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">🗑</div>
                <p className="font-medium">이 항목을 삭제할까요?</p>
              </div>
              <div className="text-center mb-4 p-3 rounded-md" style={{ background: "var(--color-bg-secondary)" }}>
                <p>{getGeneralCategoryIcon(item.category)} {item.name}</p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {formatAmountShort(item.amount)}<span className="amount-unit">원</span>
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-md border">취소</button>
                <button
                  onClick={() => handleDeleteItem(deleteConfirmId)}
                  className="px-4 py-2 rounded-md text-white"
                  style={{ background: "var(--color-error)" }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 변경 확인 */}
      {showDirtyConfirm && (
        <ConfirmDirtyModal
          onContinueEdit={() => setShowDirtyConfirm(false)}
          onDiscard={onClose}
        />
      )}
    </>
  );
}
