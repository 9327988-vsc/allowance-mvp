// src/components/drawers/CategoryManager.jsx — S-203 카테고리 관리
import { useState, useEffect, useCallback } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import {
  DEFAULT_CATEGORIES, getCategoryIcon,
  deleteCustomCategory, updateCustomCategory, COMMON_EMOJIS
} from "../../constants/categories";
import { loadCustomCategories } from "../../utils/storage";
import { getCategoryUsage, cleanupUnusedCategories } from "../../utils/categoryStats";
import { validateCustomCategory } from "../../utils/validators";
import { showToast } from "../../utils/toastManager";
import NewCategoryModal from "../modals/NewCategoryModal";

export default function CategoryManager({ onClose }) {
  const [customCats, setCustomCats] = useState(() => loadCustomCategories());
  const [usage, setUsage] = useState(() => getCategoryUsage());

  // 인라인 편집 상태
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editError, setEditError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState(null);

  // S-105 새 카테고리
  const [showNewCategory, setShowNewCategory] = useState(false);

  // 미사용 정리 미리보기
  const [cleanupPreview, setCleanupPreview] = useState(null);

  // 서브모달 열려있으면 부모 useModalBase 비활성 (ESC 중첩 방지)
  const hasSubModal = deleteTarget !== null || cleanupPreview !== null || showNewCategory;
  const contentRef = useModalBase(onClose, { active: !hasSubModal });
  const deleteDialogRef = useModalBase(() => setDeleteTarget(null), { active: deleteTarget !== null });
  const cleanupDialogRef = useModalBase(() => setCleanupPreview(null), { active: cleanupPreview !== null });

  const isEditing = editingId !== null;

  const refreshData = useCallback(() => {
    setCustomCats(loadCustomCategories());
    setUsage(getCategoryUsage());
  }, []);


  // ── 인라인 편집 ──
  function startEdit(cat) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    setEditError("");
    setShowEmojiPicker(false);
  }

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName("");
    setEditIcon("");
    setEditError("");
    setShowEmojiPicker(false);
  }, []);

  function saveEdit() {
    const otherCustom = customCats.filter(c => c.id !== editingId);
    const validation = validateCustomCategory(
      { name: editName, icon: editIcon },
      otherCustom
    );
    if (!validation.valid) {
      setEditError(Object.values(validation.errors).join(", "));
      return;
    }
    const result = updateCustomCategory(editingId, { name: editName.trim(), icon: editIcon });
    if (result.success) {
      showToast({
        type: "success",
        message: "✅ 카테고리 정보가 변경되었습니다. 기존 입력된 임시 항목은 이전 카테고리명으로 유지됩니다."
      });
      cancelEdit();
      refreshData();
    } else {
      showToast({ type: "error", message: "저장 실패" });
    }
  }

  // ── 삭제 ──
  function confirmDelete() {
    if (!deleteTarget) return;
    const result = deleteCustomCategory(deleteTarget.id);
    if (result.success) {
      showToast({ type: "success", message: "✅ 카테고리 삭제됨" });
      setDeleteTarget(null);
      refreshData();
    }
  }

  // ── 새 카테고리 추가 성공 ──
  function handleNewCategoryAdded() {
    setShowNewCategory(false);
    refreshData();
  }

  // ── 미사용 정리 ──
  function handleCleanupClick() {
    const currentUsage = getCategoryUsage();
    const unused = customCats.filter(c => !currentUsage.has(c.name));
    if (unused.length === 0) {
      showToast({ type: "warning", message: "정리할 카테고리가 없습니다", duration: 4000 });
      return;
    }
    setCleanupPreview(unused);
  }

  function executeCleanup() {
    const result = cleanupUnusedCategories();
    showToast({ type: "success", message: `${result.deleted.length}개 카테고리 정리: ${result.deleted.join(", ")}` });
    setCleanupPreview(null);
    refreshData();
  }

  // 삭제 대상 사용 횟수
  const deleteUsageCount = deleteTarget ? (usage.get(deleteTarget.name) || 0) : 0;

  return (
    <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-1)" }}>
      <div
        ref={contentRef}
        className="modal-content category-manager"
        style={{ maxWidth: 540, width: "95%", maxHeight: "85dvh", overflow: "auto" }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="카테고리 관리"
        aria-modal="true"
      >
        {/* 헤더 */}
        <div className="modal-header-row">
          <h2 className="modal-title">🏷 카테고리 관리</h2>
          <button className="modal-close-x" onClick={onClose} aria-label="닫기">×</button>
        </div>

        {/* 기본 카테고리 */}
        <section className="cm-section">
          <h3 className="cm-section-title">기본 카테고리 (수정 불가, {DEFAULT_CATEGORIES.length}개)</h3>
          <div className="cm-list">
            {DEFAULT_CATEGORIES.map(cat => (
              <div key={cat.id} className="cm-row cm-row--default">
                <span className="cm-icon">{cat.icon}</span>
                <span className="cm-name">{cat.name}</span>
                <span className="cm-usage">{usage.get(cat.name) || 0}건</span>
              </div>
            ))}
          </div>
        </section>

        {/* 사용자 카테고리 */}
        <section className="cm-section">
          <h3 className="cm-section-title">내가 추가한 카테고리</h3>
          <div className="cm-list">
            {customCats.length === 0 && (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)", padding: "var(--space-2) 0" }}>
                추가한 카테고리가 없습니다.
              </p>
            )}
            {customCats.map(cat => (
              <div key={cat.id} className="cm-row">
                {editingId === cat.id ? (
                  /* 인라인 편집 모드 */
                  <div className="cm-edit-row">
                    <button
                      className="cm-icon-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="아이콘 변경"
                    >
                      {editIcon}
                    </button>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => { setEditName(e.target.value); setEditError(""); }}
                      maxLength={20}
                      className="cm-edit-input"
                      autoFocus
                    />
                    <button className="cm-inline-btn cm-inline-btn--save" onClick={saveEdit}>저장</button>
                    <button className="cm-inline-btn" onClick={cancelEdit}>취소</button>
                    {editError && <p className="cm-edit-error">{editError}</p>}
                    {showEmojiPicker && (
                      <div className="cm-emoji-picker">
                        {COMMON_EMOJIS.map(em => (
                          <button
                            key={em}
                            className={`cm-emoji-btn${editIcon === em ? " cm-emoji-btn--selected" : ""}`}
                            onClick={() => { setEditIcon(em); setShowEmojiPicker(false); }}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 일반 모드 */
                  <>
                    <span className="cm-icon">{cat.icon}</span>
                    <span className="cm-name">{cat.name}</span>
                    <span className="cm-usage">{usage.get(cat.name) || 0}건</span>
                    <div className="cm-actions">
                      <button
                        className="cm-action-btn"
                        onClick={() => startEdit(cat)}
                        disabled={isEditing}
                        title="수정"
                        aria-label="수정"
                      >✏️</button>
                      <button
                        className="cm-action-btn"
                        onClick={() => setDeleteTarget(cat)}
                        disabled={isEditing}
                        title="삭제"
                        aria-label="삭제"
                      >🗑</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 새 카테고리 추가 */}
          <button
            className="cm-add-btn"
            onClick={() => setShowNewCategory(true)}
            disabled={isEditing}
          >
            + 새 카테고리 추가
          </button>
        </section>

        {/* 미사용 정리 */}
        <section className="cm-section">
          <button
            className="cm-cleanup-btn"
            onClick={handleCleanupClick}
            disabled={isEditing || customCats.length === 0}
          >
            사용 안 한 사용자 카테고리 정리
          </button>
        </section>

        {/* ── 삭제 확인 모달 ── */}
        {deleteTarget && (
          <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-3)" }}>
            <div
              ref={deleteDialogRef}
              className="modal-content"
              style={{ maxWidth: 380, width: "90%" }}
              onClick={e => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-label="카테고리 삭제 확인"
            >
              {deleteUsageCount > 0 ? (
                <p className="mb-3">
                  이 카테고리를 사용하는 임시 항목이 <strong>{deleteUsageCount}건</strong> 있습니다.
                  삭제하면 해당 항목의 아이콘이 ✨로 표시됩니다 (이름은 유지).
                </p>
              ) : (
                <p className="mb-3">&apos;{deleteTarget.name}&apos; 카테고리를 삭제하시겠습니까?</p>
              )}
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded-md border" onClick={() => setDeleteTarget(null)}>취소</button>
                <button
                  className="px-4 py-2 rounded-md text-white"
                  style={{ background: "var(--color-danger)" }}
                  onClick={confirmDelete}
                >삭제</button>
              </div>
            </div>
          </div>
        )}

        {/* ── 미사용 정리 미리보기 모달 ── */}
        {cleanupPreview && (
          <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-3)" }}>
            <div
              ref={cleanupDialogRef}
              className="modal-content"
              style={{ maxWidth: 400, width: "90%" }}
              onClick={e => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-label="미사용 카테고리 정리"
            >
              <h3 className="font-bold mb-2">🗂 정리 미리보기</h3>
              <p className="mb-2">다음 {cleanupPreview.length}개 카테고리는 임시 항목 어디에도 사용된 적이 없어요.</p>
              <ul className="text-sm mb-4" style={{ paddingLeft: "1.2em", listStyle: "disc" }}>
                {cleanupPreview.map(c => (
                  <li key={c.id}>{c.icon} {c.name}</li>
                ))}
              </ul>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded-md border" onClick={() => setCleanupPreview(null)}>취소</button>
                <button
                  className="px-4 py-2 rounded-md text-white"
                  style={{ background: "var(--color-primary)" }}
                  onClick={executeCleanup}
                >정리하기</button>
              </div>
            </div>
          </div>
        )}

        {/* S-105 새 카테고리 모달 */}
        {showNewCategory && (
          <NewCategoryModal
            onSuccess={handleNewCategoryAdded}
            onCancel={() => setShowNewCategory(false)}
          />
        )}
      </div>
    </div>
  );
}
