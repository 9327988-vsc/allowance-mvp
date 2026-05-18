// src/components/modals/GeneralItemForm.jsx — 일반계정 수입/지출 항목 폼
import { useState, useEffect } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { GENERAL_EXPENSE_CATEGORIES, GENERAL_INCOME_CATEGORIES } from "../../constants/generalCategories";
import { loadCustomCategories } from "../../utils/storage";
import CurrencyInput from "../inputs/CurrencyInput";
import NewCategoryModal from "./NewCategoryModal";

export default function GeneralItemForm({ onClose, onSubmit, defaultValues }) {
  const contentRef = useModalBase(onClose);
  const [type, setType] = useState(defaultValues?.type ?? "expense");
  const [category, setCategory] = useState(defaultValues?.category ?? "");
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [amount, setAmount] = useState(defaultValues?.amount ?? 0);
  const [errors, setErrors] = useState({});
  const [customCategories, setCustomCategories] = useState(() => loadCustomCategories());
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [previousCategory, setPreviousCategory] = useState(null);

  const isEdit = !!defaultValues;

  // type 변경 시 카테고리 초기화 (편집 모드가 아닐 때만)
  useEffect(() => {
    if (!isEdit) {
      setCategory("");
    }
  }, [type, isEdit]);

  function validate() {
    const errs = {};
    if (!category) errs.category = "카테고리를 선택하세요";
    if (!name.trim()) errs.name = "이름을 입력하세요";
    if (name.trim().length > 50) errs.name = "50자 이내로 입력하세요";
    if (!amount || amount <= 0) errs.amount = "금액을 입력하세요";
    if (amount > 100000000) errs.amount = "1억 원 이하로 입력하세요";
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({ type, category, name: name.trim(), amount });
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
    setCustomCategories(loadCustomCategories());
    setCategory(newCategory.name);
    setShowNewCategoryModal(false);
    setPreviousCategory(null);
  }

  function handleNewCategoryCancel() {
    setCategory(previousCategory ?? "");
    setShowNewCategoryModal(false);
    setPreviousCategory(null);
  }

  const baseCategories = type === "income" ? GENERAL_INCOME_CATEGORIES : GENERAL_EXPENSE_CATEGORIES;
  const allCategories = [
    ...baseCategories,
    ...customCategories.map(c => ({ id: c.id, name: c.name, icon: c.icon })),
  ];

  return (
    <>
      <div
        className="modal-backdrop"
        style={{ zIndex: "var(--z-modal-2)" }}
        onClick={onClose}
      >
        <div
          ref={contentRef}
          className="modal-content"
          style={{ maxWidth: 400, width: "90%", opacity: showNewCategoryModal ? 0.6 : 1 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={isEdit ? "항목 수정" : "항목 추가"}
          aria-modal="true"
        >
          <h3 className="text-lg font-bold mb-4">
            {isEdit ? "항목 수정" : "항목 추가"}
          </h3>

          {/* 수입/지출 토글 */}
          <div className="mb-3">
            <div className="general-type-toggle">
              <button
                type="button"
                className={`general-type-toggle__btn${type === "income" ? " general-type-toggle__btn--active general-type-toggle__btn--income" : ""}`}
                onClick={() => setType("income")}
                disabled={showNewCategoryModal}
              >
                수입
              </button>
              <button
                type="button"
                className={`general-type-toggle__btn${type === "expense" ? " general-type-toggle__btn--active general-type-toggle__btn--expense" : ""}`}
                onClick={() => setType("expense")}
                disabled={showNewCategoryModal}
              >
                지출
              </button>
            </div>
          </div>

          {/* 카테고리 */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">카테고리</label>
            <select
              value={category}
              onChange={handleCategoryChange}
              disabled={showNewCategoryModal}
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
              placeholder={type === "income" ? "예: 5월 급여" : "예: 점심 식사"}
              className="w-full border rounded-md p-2"
              style={{ fontSize: "var(--font-size-base)" }}
              disabled={showNewCategoryModal}
            />
            {errors.name && <p className="text-sm mt-1" style={{ color: "var(--color-error)" }}>{errors.name}</p>}
          </div>

          {/* 금액 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">금액</label>
            <CurrencyInput
              value={amount}
              onChange={val => { setAmount(val); setErrors(prev => ({ ...prev, amount: undefined })); }}
              max={100000000}
              disabled={showNewCategoryModal}
            />
            {errors.amount && <p className="text-sm mt-1" style={{ color: "var(--color-error)" }}>{errors.amount}</p>}
          </div>

          {/* 버튼 */}
          <div className="modal-footer modal-footer--end">
            <button onClick={onClose} disabled={showNewCategoryModal} className="btn btn--secondary">
              취소
            </button>
            <button onClick={handleSubmit} disabled={showNewCategoryModal} className="btn btn--primary">
              {isEdit ? "저장" : "추가"}
            </button>
          </div>
        </div>
      </div>

      {showNewCategoryModal && (
        <NewCategoryModal
          onSuccess={handleNewCategorySuccess}
          onCancel={handleNewCategoryCancel}
        />
      )}
    </>
  );
}
