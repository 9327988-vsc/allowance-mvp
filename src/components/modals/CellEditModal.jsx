// src/components/modals/CellEditModal.jsx — S-103 셀 편집
import { useState, useCallback } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { getWeekdayKor } from "../../utils/calculator";
import { getCategoryIcon } from "../../constants/categories";
import { newExtraItemId } from "../../utils/idGenerator";
import { validateMemo } from "../../utils/validators";
import { showToast } from "../../utils/toastManager";
import ExtraItemForm from "./ExtraItemForm";
import ReceiptViewerModal from "./ReceiptViewerModal";
import ConfirmDirtyModal from "./ConfirmDirtyModal";
import { formatAmountShort } from "../../utils/formatAmount";
import MoodPicker from "../widgets/MoodPicker";

// NOTE: This limit should match any server-side validation for max extra items per cell
const MAX_EXTRA_ITEMS = 3;

export default function CellEditModal({ cell, calendar, settings, onSave, onClose }) {
  const { date, weekday, is_holiday, holiday_name, school_fee, academy_fee } = cell;
  const day = parseInt(date.split("-")[2], 10);
  const month = parseInt(date.split("-")[1], 10);

  // 학교/학원 등교일인지 판별
  const isSchoolDay = settings?.school?.days?.includes(weekday) && (!is_holiday || settings?.school?.holiday_attend);
  const isAcademyDay = settings?.academy?.days?.includes(weekday) && (!is_holiday || settings?.academy?.holiday_attend);

  // draft 상태 (편집 중) — 초기값을 state로 캡처하여 리렌더 시 재계산 방지
  const [originalExtraItems] = useState(() => {
    const items = calendar?.cells?.[date]?.extra_items;
    return items ? JSON.parse(JSON.stringify(items)) : [];
  });
  const [originalMemo] = useState(() => calendar?.cells?.[date]?.memo ?? "");
  const [originalMood] = useState(() => calendar?.cells?.[date]?.mood ?? null);
  const [originalSkipSchool] = useState(() => calendar?.cells?.[date]?.skip_school || false);
  const [originalSkipAcademy] = useState(() => calendar?.cells?.[date]?.skip_academy || false);

  const [extraItems, setExtraItems] = useState(() => {
    const items = calendar?.cells?.[date]?.extra_items;
    return items ? JSON.parse(JSON.stringify(items)) : [];
  });
  const [memo, setMemo] = useState(() => calendar?.cells?.[date]?.memo ?? "");
  const [mood, setMood] = useState(() => calendar?.cells?.[date]?.mood ?? null);
  // false | "half" | "full"
  const [skipSchool, setSkipSchool] = useState(() => calendar?.cells?.[date]?.skip_school || false);
  const [skipAcademy, setSkipAcademy] = useState(() => calendar?.cells?.[date]?.skip_academy || false);
  const [memoError, setMemoError] = useState("");

  // S-104 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  // S-107 삭제 확인
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  // S-106 변경 확인
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  // 영수증 뷰어
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const isDirty = useCallback(() => {
    return JSON.stringify({ extra_items: originalExtraItems, memo: originalMemo, mood: originalMood, skip_school: originalSkipSchool, skip_academy: originalSkipAcademy }) !==
           JSON.stringify({ extra_items: extraItems, memo, mood, skip_school: skipSchool, skip_academy: skipAcademy });
  }, [originalExtraItems, originalMemo, originalMood, originalSkipSchool, originalSkipAcademy, extraItems, memo, mood, skipSchool, skipAcademy]);

  const handleClose = useCallback(() => {
    if (isDirty()) {
      setShowDirtyConfirm(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  // useModalBase: scroll lock + focus trap + ESC (when no sub-modal open)
  const hasChildOpen = !!(viewingReceipt || showDirtyConfirm || deleteConfirmId || showAddForm || editingItemId);
  const modalRef = useModalBase(handleClose, { active: !hasChildOpen });

  // Sub-modal: delete confirm — focus trap + scroll lock + ESC via modal stack
  const deleteDialogRef = useModalBase(() => setDeleteConfirmId(null), { active: !!deleteConfirmId });

  // Sub-modal ESC 처리 — ExtraItemForm/ConfirmDirtyModal은 자체 useModalBase가 있으므로 여기서는 불필요
  // viewingReceipt(ReceiptViewerModal)도 자체 useModalBase 사용

  function handleSave() {
    const validation = validateMemo(memo);
    if (!validation.valid) {
      setMemoError(validation.errors.memo);
      return;
    }
    onSave(date, { extra_items: extraItems, memo: memo.trim(), mood, skip_school: skipSchool, skip_academy: skipAcademy });
    onClose();
  }

  // S-104 추가 완료
  function handleAddItem(input) {
    const newItem = {
      id: newExtraItemId(),
      type: input.type || "expense",
      category: input.category,
      name: input.name,
      amount: input.amount,
      created_at: new Date().toISOString(),
    };
    if (input.receipt) newItem.receipt = input.receipt;
    setExtraItems(prev => [...prev, newItem]);
    setShowAddForm(false);
  }

  // S-104 수정 완료
  function handleEditItem(input) {
    setExtraItems(prev =>
      prev.map(item =>
        item.id === editingItemId
          ? { ...item, type: input.type || "expense", category: input.category, name: input.name, amount: input.amount, receipt: input.receipt || item.receipt }
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
          {(isSchoolDay || isAcademyDay) && (
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
              {isSchoolDay && (
                <>
                  <div className="flex justify-between text-sm" style={{ textDecoration: skipSchool === "full" ? "line-through" : "none", opacity: skipSchool ? 0.5 : 1 }}>
                    <span>🏫 학교 등교 {skipSchool === "half" ? "(편도)" : ""}</span>
                    <span>{formatAmountShort(skipSchool === "half" ? settings.school.fare : settings.school.fare * (settings.school.round_trip ? 2 : 1))}<span className="amount-unit">원</span></span>
                  </div>
                  {settings?.school?.bus_routes?.length > 0 && (
                    <div className="text-xs" style={{ color: "var(--color-text-secondary)", paddingLeft: "var(--space-2)", marginTop: "2px", marginBottom: "var(--space-1)" }}>
                      <div>🚌 {settings.school.bus_routes.join(" → ")}{settings.school.bus_routes.length === 1 ? " (직행)" : settings.school.bus_routes.length - 1 > 0 ? ` (환승 ${settings.school.bus_routes.length - 1}회)` : ""}</div>
                      {(settings.school.bus_stops?.from || settings.school.bus_stops?.to) && (
                        <div>🚏 {settings.school.bus_stops.from || "?"} → {settings.school.bus_stops.to || "?"}{settings.school.round_trip ? " (왕복)" : " (편도)"}</div>
                      )}
                    </div>
                  )}
                </>
              )}
              {isAcademyDay && (
                <>
                  <div className="flex justify-between text-sm" style={{ textDecoration: skipAcademy === "full" ? "line-through" : "none", opacity: skipAcademy ? 0.5 : 1 }}>
                    <span>✏️ 학원 등원 {skipAcademy === "half" ? "(편도)" : ""}</span>
                    <span>{formatAmountShort(skipAcademy === "half" ? settings.academy.fare : settings.academy.fare * (settings.academy.round_trip ? 2 : 1))}<span className="amount-unit">원</span></span>
                  </div>
                  {settings?.academy?.bus_routes?.length > 0 && (
                    <div className="text-xs" style={{ color: "var(--color-text-secondary)", paddingLeft: "var(--space-2)", marginTop: "2px", marginBottom: "var(--space-1)" }}>
                      <div>🚌 {settings.academy.bus_routes.join(" → ")}{settings.academy.bus_routes.length === 1 ? " (직행)" : settings.academy.bus_routes.length - 1 > 0 ? ` (환승 ${settings.academy.bus_routes.length - 1}회)` : ""}</div>
                      {(settings.academy.bus_stops?.from || settings.academy.bus_stops?.to) && (
                        <div>🚏 {settings.academy.bus_stops.from || "?"} → {settings.academy.bus_stops.to || "?"}{settings.academy.round_trip ? " (왕복)" : " (편도)"}</div>
                      )}
                    </div>
                  )}
                </>
              )}
              <p className="text-xs mt-2" style={{ color: "var(--color-text-tertiary)" }}>
                ⓘ ⚙ 설정에서 단가 변경 가능
              </p>
            </div>
          )}

          {/* 결석(안 간 날) 토글 */}
          {(isSchoolDay || isAcademyDay) && (
            <div className="mb-4 p-3 rounded-md" style={{ background: "var(--color-bg-tertiary, var(--color-bg-secondary))", border: "1px dashed var(--color-border)" }}>
              <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                🚫 안 간 날 (버스비 제외)
              </p>
              {isSchoolDay && (
                <div className="py-1">
                  <p className="text-sm mb-1" style={{ color: "var(--color-text-primary)" }}>��� 학교</p>
                  <div className="flex gap-3 ml-2">
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input type="radio" name="skipSchool" checked={!skipSchool} onChange={() => setSkipSchool(false)} />
                      <span>정상 등교</span>
                    </label>
                    {settings.school.round_trip && (
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input type="radio" name="skipSchool" checked={skipSchool === "half"} onChange={() => setSkipSchool("half")} />
                        <span>편도만</span>
                        {skipSchool === "half" && <span style={{ color: "var(--color-error)" }}>-{formatAmountShort(settings.school.fare)}원</span>}
                      </label>
                    )}
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input type="radio" name="skipSchool" checked={skipSchool === "full"} onChange={() => setSkipSchool("full")} />
                      <span>안 감</span>
                      {skipSchool === "full" && <span style={{ color: "var(--color-error)" }}>-{formatAmountShort(settings.school.fare * (settings.school.round_trip ? 2 : 1))}원</span>}
                    </label>
                  </div>
                </div>
              )}
              {isAcademyDay && (
                <div className="py-1">
                  <p className="text-sm mb-1" style={{ color: "var(--color-text-primary)" }}>✏️ 학원</p>
                  <div className="flex gap-3 ml-2">
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input type="radio" name="skipAcademy" checked={!skipAcademy} onChange={() => setSkipAcademy(false)} />
                      <span>정상 등원</span>
                    </label>
                    {settings.academy.round_trip && (
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input type="radio" name="skipAcademy" checked={skipAcademy === "half"} onChange={() => setSkipAcademy("half")} />
                        <span>편도만</span>
                        {skipAcademy === "half" && <span style={{ color: "var(--color-error)" }}>-{formatAmountShort(settings.academy.fare)}원</span>}
                      </label>
                    )}
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input type="radio" name="skipAcademy" checked={skipAcademy === "full"} onChange={() => setSkipAcademy("full")} />
                      <span>안 감</span>
                      {skipAcademy === "full" && <span style={{ color: "var(--color-error)" }}>-{formatAmountShort(settings.academy.fare * (settings.academy.round_trip ? 2 : 1))}원</span>}
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 자동 항목 없는 경우 */}
          {school_fee === 0 && academy_fee === 0 && !is_holiday && !isSchoolDay && !isAcademyDay && (
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
              <div key={item.id} className="flex items-center justify-between py-2 border-b" style={{ gap: "var(--space-2)" }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-1)", minWidth: 0 }}>
                  <span className="text-sm" style={{ whiteSpace: "nowrap" }}>
                    {getCategoryIcon(item.category)} {item.name}
                    {item.receipt && <button type="button" onClick={() => setViewingReceipt(item)} aria-label={`${item.name} 영수증 보기`} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", marginLeft: 2 }}>📷</button>}
                  </span>
                  <span className="text-sm" style={{ color: item.type === "income" ? "var(--color-income, #2e7d32)" : "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                    {item.type === "income" ? "+" : ""}{formatAmountShort(item.amount)}<span className="amount-unit">원</span>
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
            {extraItems.length < MAX_EXTRA_ITEMS ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 w-full py-2 text-sm rounded-md border border-dashed item-add-btn"
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

          {/* 오늘의 기분 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">😊 오늘의 기분</label>
            <MoodPicker value={mood} onChange={setMood} size="sm" />
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
          <div className="modal-footer modal-footer--end">
            <button onClick={handleClose} className="btn btn--secondary">
              취소
            </button>
            <button onClick={handleSave} className="btn btn--primary">
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
                <p className="font-medium">이 임시 항목을 삭제할까요?</p>
              </div>
              <div className="text-center mb-4 p-3 rounded-md" style={{ background: "var(--color-bg-secondary)" }}>
                <p>{getCategoryIcon(item.category)} {item.name}</p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {formatAmountShort(item.amount)}<span className="amount-unit">원</span>
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

      {/* 영수증 뷰어 */}
      {viewingReceipt && (
        <ReceiptViewerModal
          src={viewingReceipt.receipt}
          itemName={viewingReceipt.name}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </>
  );
}
