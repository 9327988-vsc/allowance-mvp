// src/components/modals/NewCategoryModal.jsx — S-105 새 카테고리 추가
import { useState, useEffect } from "react";
import { COMMON_EMOJIS, addCustomCategory } from "../../constants/categories";
import { showToast } from "../../utils/toastManager";

const GRID_COLS = 6;

export default function NewCategoryModal({ onSuccess, onCancel }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [errors, setErrors] = useState({});
  const [focusIndex, setFocusIndex] = useState(-1);

  // ESC = 닫기
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  function handleSubmit() {
    const result = addCustomCategory({ name: name.trim(), icon });
    if (!result.success) {
      setErrors(result.errors || {});
      return;
    }
    showToast({ type: "success", message: "✅ 카테고리 추가됨" });
    onSuccess(result.category);
  }

  // 이모지 그리드 키보드 네비게이션
  function handleGridKeyDown(e, idx) {
    let next = idx;
    const row = Math.floor(idx / GRID_COLS);
    const col = idx % GRID_COLS;
    const maxRow = Math.ceil(COMMON_EMOJIS.length / GRID_COLS) - 1;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        next = row * GRID_COLS + ((col + 1) % GRID_COLS);
        if (next >= COMMON_EMOJIS.length) next = row * GRID_COLS;
        break;
      case "ArrowLeft":
        e.preventDefault();
        next = row * GRID_COLS + ((col - 1 + GRID_COLS) % GRID_COLS);
        if (next >= COMMON_EMOJIS.length) next = COMMON_EMOJIS.length - 1;
        break;
      case "ArrowDown":
        e.preventDefault();
        if (row < maxRow) {
          next = (row + 1) * GRID_COLS + col;
          if (next >= COMMON_EMOJIS.length) return;
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (row > 0) next = (row - 1) * GRID_COLS + col;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        setIcon(COMMON_EMOJIS[idx]);
        return;
      default:
        return;
    }
    setFocusIndex(next);
  }

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: "var(--z-modal-3)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="modal-content"
        style={{ maxWidth: 400, width: "90%" }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="새 카테고리 추가"
        aria-modal="true"
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">새 카테고리 추가</h3>
          <button onClick={onCancel} aria-label="닫기" className="text-xl px-2">×</button>
        </div>

        {/* 이름 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">카테고리 이름</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
            maxLength={20}
            placeholder="예: 미술학원"
            className="w-full border rounded-md p-2"
            style={{ fontSize: "var(--font-size-base)" }}
            autoFocus
          />
          {errors.name && <p className="text-sm mt-1" style={{ color: "var(--color-error)" }}>{errors.name}</p>}
        </div>

        {/* 아이콘 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            아이콘 선택 {icon && <span className="ml-1">— 선택됨: {icon}</span>}
          </label>
          <div
            className="emoji-grid"
            role="radiogroup"
            aria-label="이모지 선택"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gap: "var(--space-1)",
            }}
          >
            {COMMON_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                role="radio"
                aria-checked={icon === emoji}
                aria-label={emoji}
                tabIndex={focusIndex === i || (focusIndex === -1 && icon === emoji) ? 0 : -1}
                ref={el => { if (el && focusIndex === i) el.focus(); }}
                onClick={() => { setIcon(emoji); setErrors(prev => ({ ...prev, icon: undefined })); }}
                onKeyDown={e => handleGridKeyDown(e, i)}
                className="emoji-cell"
                style={{
                  width: 44, height: 44,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, border: "none", borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  background: icon === emoji ? "var(--color-primary)" : "var(--color-bg-secondary)",
                  color: icon === emoji ? "white" : "inherit",
                  position: "relative",
                }}
              >
                {emoji}
                {icon === emoji && (
                  <span style={{
                    position: "absolute", bottom: 1, right: 2,
                    fontSize: 10, color: "white",
                  }}>✓</span>
                )}
              </button>
            ))}
          </div>
          {errors.icon && <p className="text-sm mt-1" style={{ color: "var(--color-error)" }}>{errors.icon}</p>}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border"
            style={{ color: "var(--color-text-secondary)" }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md text-white"
            style={{ background: "var(--color-primary)" }}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
