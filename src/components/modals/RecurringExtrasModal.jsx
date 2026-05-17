// src/components/modals/RecurringExtrasModal.jsx — 정기 추가 용돈 관리
import { useState, useEffect, useCallback } from "react";
import { loadSettingsForUser, saveSettingsForUser } from "../../utils/storage";
import { getActiveUser } from "../../utils/authStore";
import { showToast } from "../../utils/toastManager";
import CurrencyInput from "../inputs/CurrencyInput";

export default function RecurringExtrasModal({ onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = getActiveUser();
    const settings = loadSettingsForUser(userId);
    if (settings?.recurring_extras) {
      setItems(settings.recurring_extras.map(item => ({ ...item })));
    }
  }, []);

  // ESC 닫기
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAdd = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("이름을 입력해주세요");
      return;
    }
    if (trimmed.length > 20) {
      setError("20자 이내로 입력해주세요");
      return;
    }
    if (newAmount < 1) {
      setError("금액을 1원 이상 입력해주세요");
      return;
    }
    if (items.length >= 10) {
      setError("최대 10개까지 추가할 수 있습니다");
      return;
    }
    setError(null);
    setItems(prev => [...prev, { name: trimmed, amount: newAmount }]);
    setNewName("");
    setNewAmount(0);
  }, [newName, newAmount, items.length]);

  const handleRemove = useCallback((index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    const userId = getActiveUser();
    const settings = loadSettingsForUser(userId);
    if (!settings) {
      showToast({ type: "error", message: "설정을 먼저 완료해주세요" });
      return;
    }
    settings.recurring_extras = items;
    const result = saveSettingsForUser(userId, settings);
    if (result.success) {
      showToast({ type: "success", message: "정기 추가 용돈이 저장되었습니다" });
      onSaved?.(settings);
      onClose();
    } else {
      showToast({ type: "error", message: "저장 공간이 부족합니다" });
    }
  }, [items, onSaved, onClose]);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="정기 추가 용돈">
      <div className="modal-content" style={{ maxWidth: 440, width: "90%", padding: 0 }}>
        <div className="modal-header">
          <h2 className="modal-title">💵 정기 추가 용돈</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", overflowY: "auto", maxHeight: "calc(80dvh - 140px)" }}>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            매월 기본 용돈 외에 정기적으로 추가 지급하는 항목을 등록하세요.
          </p>

          {/* 기존 항목 목록 */}
          {items.length > 0 && (
            <div className="recurring-extras-list">
              {items.map((item, i) => (
                <div key={`${item.name}-${item.amount}-${i}`} className="recurring-extras-item">
                  <span className="recurring-extras-item__name">{item.name}</span>
                  <span className="recurring-extras-item__amount">{item.amount.toLocaleString("ko-KR")}원</span>
                  <button
                    className="recurring-extras-item__remove"
                    onClick={() => handleRemove(i)}
                    aria-label={`${item.name} 삭제`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="recurring-extras-total">
                합계: <strong>{total.toLocaleString("ko-KR")}원</strong>
              </div>
            </div>
          )}

          {/* 새 항목 입력 */}
          <div className="recurring-extras-form">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="항목 이름 (예: 간식비)"
              maxLength={20}
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: "var(--color-border)", fontSize: "var(--font-size-sm)" }}
            />
            <CurrencyInput
              id="recurring_amount"
              value={newAmount}
              onChange={setNewAmount}
              max={1000000}
            />
            <button
              onClick={handleAdd}
              className="btn btn--primary"
              style={{ whiteSpace: "nowrap" }}
            >
              추가
            </button>
          </div>
          {error && <p style={{ color: "var(--color-error)", fontSize: "var(--font-size-xs)" }}>{error}</p>}
        </div>

        <div className="modal-footer modal-footer--stretch">
          <button onClick={onClose} className="btn btn--secondary">취소</button>
          <button onClick={handleSave} className="btn btn--primary">저장</button>
        </div>
      </div>
    </div>
  );
}
