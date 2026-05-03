// src/components/modals/CellEditModal.jsx — S-103 셀 편집
import { useState, useEffect, useCallback } from "react";
import { getWeekdayKor } from "../../utils/calculator";
import { getCategoryIcon } from "../../constants/categories";
import { newExtraItemId } from "../../utils/idGenerator";
import { validateMemo } from "../../utils/validators";
import { showToast } from "../../utils/toastManager";
import ExtraItemForm from "./ExtraItemForm";
import ConfirmDirtyModal from "./ConfirmDirtyModal";

const MAX_EXTRA_ITEMS = 3;

export default function CellEditModal({ cell, calendar, onSave, onClose }) {
  const { date, weekday, is_holiday, holiday_name, school_fee, academy_fee } = cell;
  const day = parseInt(date.split("-")[2], 10);
  const month = parseInt(date.split("-")[1], 10);

  // draft 상태 (편집 중)
  const cellData = calendar?.cells?.[date];
  const originalExtraItems = cellData?.extra_items ? JSON.parse(JSON.stringify(cellData.extra_items)) : [];
  const originalMemo = cellData?.memo ?? "";

  const [extraItems, setExtraItems] = useState(originalExtraItems);
  const [memo, setMemo] = useState(originalMemo);
  const [memoError, setMemoError] = useState("");

  // S-104 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  // S-107 삭제 확인
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  // S-106 변경 확인
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);

  const isDirty = useCallback(() => {
    return JSON.stringify({ extra_items: originalExtraItems, memo: originalMemo }) !==
           JSON.stringify({ extra_items: extraItems, memo });
  }, [originalExtraItems, originalMemo, extraItems, memo]);

  const handleClose = useCallback(() => {
    if (isDirty()) {
      setShowDirtyConfirm(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  // ESC 처리
  useEffect(() => {
    function handleEsc(e) {
      if (e.key !== "Escape") return;

      // S-106 변경 확인이 열려있으면 → 계속 편집 (ESC = 안전 방향)
      if (showDirtyConfirm) {
        e.stopPropagation();
        setShowDirtyConfirm(false);
        return;
      }
      // S-107 삭제 확인이 열려있으면 그것만 닫기
      if (deleteConfirmId) {
        e.stopPropagation();
        setDeleteConfirmId(null);
        return;
      }
      // S-104가 열려있으면 그것만 닫기
      if (showAddForm || editingItemId) {
        e.stopPropagation();
        setShowAddForm(false);
        setEditingItemId(null);
        return;
      }
      // S-103 닫기
      handleClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showDirtyConfirm, deleteConfirmId, showAddForm, editingItemId, handleClose]);

  function handleSave() {
    const validation = validateMemo(memo);
    if (!validation.valid) {
      setMemoError(validation.errors.memo);
      return;
    }
    onSave(date, { extra_items: extraItems, memo: memo.trim() });
    onClose();
  }

  // S-104 추가 완료
  function handleAddItem(input) {
    const newItem = {
      id: newExtraItemId(),
      category: input.category,
      name: input.name,
      amount: input.amount,
      created_at: new Date().toISOString(),
    };
    setExtraItems(prev => [...prev, newItem]);
    setShowAddForm(false);
  }

  // S-104 수정 완료
  function handleEditItem(input) {
    setExtraItems(prev =>
      prev.map(item =>
        item.id === editingItemId
          ? { ...item, category: input.category, name: input.name, amount: input.amount }
          : item
      )
    );
    setEditingItemId(null);
  }

  // S-107 삭제 확인
  function handleDeleteItem(id) {
    setExtraItems(prev => prev.filter(item => item.id !== id));
    setDeleteConfirmId(null);
  }

  function handleAutoItemClick() {
    showToast({ type: "warning", message: "🏫 학교/학원 단가는 ⚙ 설정에서 변경하세요", duration: 4000 });
  }

  const editingItem = editingItemId ? extraItems.find(i => i.id === editingItemId) : null;

  return (
    <>
      <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-1)" }} onClick={handleClose}>
        <div
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
              {month}월 {day}일 ({getWeekdayKor(weekday)})
              {holiday_name && (
                <span className="ml-2 text-sm font-normal" style={{ color: "var(--color-holiday)" }}>
                  {holiday_name}
                </span>
              )}
            </h3>
            <button onClick={handleClose} aria-label="닫기" className="text-xl px-2">×</button>
          </div>

          {/* 자동 항목 (읽기 전용) */}
          {(school_fee > 0 || academy_fee > 0) && (
            <div
              className="mb-4 p-3 rounded-md"
              style={{ background: "var(--color-bg-secondary)", opacity: 0.85, cursor: "help" }}
              role="region"
              aria-label="자동 계산 항목, 수정 불가"
              onClick={handleAutoItemClick}
            >
              <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                기본 항목 (자동, 수정 불가)
              </p>
              {school_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>🏫 학교 등교</span>
                  <span>{school_fee.toLocaleString()}원</span>
                </div>
              )}
              {academy_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>📚 학원 등원</span>
                  <span>{academy_fee.toLocaleString()}원</span>
                </div>
              )}
              <p className="text-xs mt-2" style={{ color: "var(--color-text-tertiary)" }}>
                ⓘ ⚙ 설정에서 단가 변경 가능
              </p>
            </div>
          )}

          {/* 자동 항목 없는 경우 */}
          {school_fee === 0 && academy_fee === 0 && !is_holiday && (
            <p className="mb-4 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              (자동 항목 없음)
            </p>
          )}

          {/* 공휴일 + 등교 안 함 표시 */}
          {is_holiday && school_fee === 0 && academy_fee === 0 && (
            <div className="mb-4 p-3 rounded-md" style={{ background: "var(--color-bg-secondary)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                (공휴일 — 학교/학원 등교 안 함)
              </p>
            </div>
          )}

          {/* 임시 항목 */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">
              임시 항목 ({extraItems.length}/{MAX_EXTRA_ITEMS})
            </p>
            {extraItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <span className="text-sm">{getCategoryIcon(item.category)} {item.name}</span>
                  <span className="ml-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {item.amount.toLocaleString()}원
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingItemId(item.id)}
                    aria-label={`${item.name} 수정`}
                    className="px-2 py-1 text-sm rounded hover:bg-gray-100"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    aria-label={`${item.name} 삭제`}
                    className="px-2 py-1 text-sm rounded hover:bg-gray-100"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
            {extraItems.length < MAX_EXTRA_ITEMS ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 w-full py-2 text-sm rounded-md border border-dashed hover:bg-gray-50"
                style={{ color: "var(--color-primary)" }}
              >
                + 임시 항목 추가
              </button>
            ) : (
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                최대 {MAX_EXTRA_ITEMS}개까지 추가할 수 있습니다
              </p>
            )}
          </div>

          {/* 메모 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">메모 (200자 이내)</label>
            <textarea
              value={memo}
              onChange={e => {
                setMemo(e.target.value);
                setMemoError("");
              }}
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
          <div className="flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-md border"
              style={{ color: "var(--color-text-secondary)" }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-md text-white"
              style={{ background: "var(--color-primary)" }}
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* S-104 추가 폼 */}
      {showAddForm && (
        <ExtraItemForm
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddItem}
        />
      )}

      {/* S-104 수정 폼 */}
      {editingItem && (
        <ExtraItemForm
          onClose={() => setEditingItemId(null)}
          onSubmit={handleEditItem}
          defaultValues={editingItem}
        />
      )}

      {/* S-107 삭제 확인 */}
      {deleteConfirmId && (() => {
        const item = extraItems.find(i => i.id === deleteConfirmId);
        if (!item) return null;
        return (
          <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-3)" }} onClick={() => setDeleteConfirmId(null)}>
            <div
              className="modal-content"
              style={{ maxWidth: 360, width: "90%" }}
              onClick={e => e.stopPropagation()}
              role="alertdialog"
              aria-label="삭제 확인"
            >
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">🗑</div>
                <p className="font-medium">이 임시 항목을 삭제할까요?</p>
              </div>
              <div className="text-center mb-4 p-3 rounded-md" style={{ background: "var(--color-bg-secondary)" }}>
                <p>{getCategoryIcon(item.category)} {item.name}</p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {item.amount.toLocaleString()}원
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-md border"
                >
                  취소
                </button>
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

      {/* S-106 변경 확인 */}
      {showDirtyConfirm && (
        <ConfirmDirtyModal
          onContinueEdit={() => setShowDirtyConfirm(false)}
          onDiscard={onClose}
        />
      )}
    </>
  );
}
