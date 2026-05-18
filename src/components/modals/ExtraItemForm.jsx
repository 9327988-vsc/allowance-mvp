// src/components/modals/ExtraItemForm.jsx — S-104 임시 항목 추가/수정
import { useState, useRef } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { DEFAULT_CATEGORIES } from "../../constants/categories";
import { loadCustomCategories } from "../../utils/storage";
import { validateExtraItem } from "../../utils/validators";
import { resizeImage } from "../../utils/imageResize";
import CurrencyInput from "../inputs/CurrencyInput";
import NewCategoryModal from "./NewCategoryModal";

export default function ExtraItemForm({ onClose, onSubmit, defaultValues }) {
  const contentRef = useModalBase(onClose);
  const [itemType, setItemType] = useState(defaultValues?.type ?? "expense");
  const [category, setCategory] = useState(defaultValues?.category ?? "");
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [amount, setAmount] = useState(defaultValues?.amount ?? 0);
  const [errors, setErrors] = useState({});
  const [customCategories, setCustomCategories] = useState(() => loadCustomCategories());
  const [receipt, setReceipt] = useState(defaultValues?.receipt || null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const fileInputRef = useRef(null);

  // S-105 상태
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [previousCategory, setPreviousCategory] = useState(null);

  const isEdit = !!defaultValues;
  const isS105Open = showNewCategoryModal;

  function handleSubmit() {
    const input = { type: itemType, category, name: name.trim(), amount };
    const validation = validateExtraItem(input);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    if (receipt) input.receipt = receipt;
    onSubmit(input);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptLoading(true);
    setErrors(prev => ({ ...prev, receipt: undefined }));
    try {
      const dataUrl = await resizeImage(file);
      setReceipt(dataUrl);
    } catch (err) {
      setErrors(prev => ({ ...prev, receipt: err.message }));
    } finally {
      setReceiptLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        onClick={onClose}
      >
        <div
          ref={contentRef}
          className="modal-content"
          style={{ maxWidth: 400, width: "90%", opacity: isS105Open ? 0.6 : 1 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={isEdit ? "임시 항목 수정" : "임시 항목 추가"}
          aria-modal="true"
        >
          <h3 className="text-lg font-bold mb-4">
            {isEdit ? "임시 항목 수정" : "임시 항목 추가"}
          </h3>

          {/* 지출/수입 토글 */}
          <div className="mb-3">
            <div className="extra-type-toggle">
              <button
                type="button"
                className={`extra-type-toggle__btn extra-type-toggle__btn--expense${itemType === "expense" ? " extra-type-toggle__btn--active" : ""}`}
                onClick={() => setItemType("expense")}
                disabled={isS105Open}
              >
                📉 지출
              </button>
              <button
                type="button"
                className={`extra-type-toggle__btn extra-type-toggle__btn--income${itemType === "income" ? " extra-type-toggle__btn--active" : ""}`}
                onClick={() => setItemType("income")}
                disabled={isS105Open}
              >
                📈 수입
              </button>
            </div>
          </div>

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

          {/* 영수증 사진 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">영수증 (선택)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isS105Open || receiptLoading}
              style={{ display: "none" }}
            />
            {receipt ? (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <img
                  src={receipt}
                  alt="영수증"
                  style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn--sm btn--secondary"
                  disabled={isS105Open || receiptLoading}
                >
                  변경
                </button>
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className="btn btn--sm btn--danger"
                  disabled={isS105Open}
                >
                  삭제
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn--sm btn--secondary"
                disabled={isS105Open || receiptLoading}
                style={{ width: "100%" }}
              >
                {receiptLoading ? "처리중..." : "📷 사진 첨부"}
              </button>
            )}
            {errors.receipt && <p className="text-sm mt-1" style={{ color: "var(--color-error)" }}>{errors.receipt}</p>}
          </div>

          {/* 버튼 */}
          <div className="modal-footer modal-footer--end">
            <button onClick={onClose} disabled={isS105Open} className="btn btn--secondary">
              취소
            </button>
            <button onClick={handleSubmit} disabled={isS105Open || receiptLoading} className="btn btn--primary">
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
