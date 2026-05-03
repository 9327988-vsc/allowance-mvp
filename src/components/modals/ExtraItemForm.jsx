// src/components/modals/ExtraItemForm.jsx — S-104 임시 항목 추가/수정
import { useState } from "react";
import { DEFAULT_CATEGORIES } from "../../constants/categories";
import { loadCustomCategories } from "../../utils/storage";
import { validateExtraItem } from "../../utils/validators";
import CurrencyInput from "../inputs/CurrencyInput";
import NewCategoryModal from "./NewCategoryModal";

export default function ExtraItemForm({ onClose, onSubmit, defaultValues }) {
  const [category, setCategory] = useState(defaultValues?.category ?? "");
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [amount, setAmount] = useState(defaultValues?.amount ?? 0);
  const [errors, setErrors] = useState({});
  const [customCategories, setCustomCategories] = useState(() => loadCustomCategories());

  // S-105 상태
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [previousCategory, setPreviousCategory] = useState(null);

  const isEdit = !!defaultValues;
  const isS105Open = showNewCategoryModal;

  function handleSubmit() {
    const input = { category, name: name.trim(), amount };
    const validation = validateExtraItem(input);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    onSubmit(input);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape" && !isS105Open) {
      e.stopPropagation();
      onClose();
    }
  }

  function handleCategoryChange(e) {
    const value = e.target.value;
    if (value === "__add_new__") {
      setPreviousCategory(category);
      setShowNewCategoryModal(true);
    } else {
      setCategory(value);
      setErrors(prev => ({ ...prev, category: undefined }));
    }
  }

  function handleNewCategorySuccess(newCategory) {
    const updated = loadCustomCategories();
    setCustomCategories(updated);
    setCategory(newCategory.name);
    setShowNewCategoryModal(false);
    setPreviousCategory(null);
  }

  function handleNewCategoryCancel() {
    setCategory(previousCategory ?? "");
    setShowNewCategoryModal(false);
    setPreviousCategory(null);
  }

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.map(c => ({ id: c.id, name: c.name, icon: c.icon })),
  ];

  return (
    <>
      <div
        className="modal-backdrop"
        style={{ zIndex: "var(--z-modal-2)" }}
        onKeyDown={handleKeyDown}
      >
        <div
          className="modal-content"
          style={{ maxWidth: 400, width: "90%", opacity: isS105Open ? 0.6 : 1 }}
          role="dialog"
          aria-label={isEdit ? "임시 항목 수정" : "임시 항목 추가"}
          aria-modal="true"
        >
          <h3 className="text-lg font-bold mb-4">
            {isEdit ? "임시 항목 수정" : "임시 항목 추가"}
          </h3>

          {/* 카테고리 */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">카테고리</label>
            <select
              value={category}
              onChange={handleCategoryChange}
              disabled={isS105Open}
              className="w-full border rounded-md p-2"
              style={{ fontSize: "var(--font-size-base)" }}
            >
              <option value="">선택하세요</option>
              {allCategories.map(c => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
              <option value="__add_new__">+ 새 카테고리</option>
            </select>
            {errors.category && <p className="text-sm mt-1" style={{ color: "var(--color-error)" }}>{errors.category}</p>}
          </div>

          {/* 이름 */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
              maxLength={50}
              placeholder="예: 박물관 체험비"
              className="w-full border rounded-md p-2"
              style={{ fontSize: "var(--font-size-base)" }}
              disabled={isS105Open}
            />
            {errors.name && <p className="text-sm mt-1" style={{ color: "var(--color-error)" }}>{errors.name}</p>}
          </div>

          {/* 금액 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">금액</label>
            <CurrencyInput
              value={amount}
              onChange={val => { setAmount(val); setErrors(prev => ({ ...prev, amount: undefined })); }}
              max={10000000}
              disabled={isS105Open}
            />
            {errors.amount && <p className="text-sm mt-1" style={{ color: "var(--color-error)" }}>{errors.amount}</p>}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={isS105Open}
              className="px-4 py-2 rounded-md border"
              style={{ color: "var(--color-text-secondary)" }}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isS105Open}
              className="px-4 py-2 rounded-md text-white"
              style={{ background: "var(--color-primary)" }}
            >
              {isEdit ? "저장" : "추가"}
            </button>
          </div>
        </div>
      </div>

      {/* S-105 새 카테고리 모달 */}
      {showNewCategoryModal && (
        <NewCategoryModal
          onSuccess={handleNewCategorySuccess}
          onCancel={handleNewCategoryCancel}
        />
      )}
    </>
  );
}
