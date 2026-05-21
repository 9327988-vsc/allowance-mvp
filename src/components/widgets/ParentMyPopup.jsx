import { useEffect, useRef } from "react";
import { logout } from "../../utils/accountSwitcher";

const MY_POPUP_STYLE = { maxWidth: 400, width: "92%", padding: 0 };

export default function ParentMyPopup({ familyContext, onClose, onNavigate, onLogout }) {
  const popupRef = useRef(null);
  useEffect(() => {
    if (popupRef.current) popupRef.current.focus();
  }, []);

  const nav = (key) => { onClose(); onNavigate(key); };

  return (
    <div className="modal-backdrop" ref={popupRef} onClick={onClose} onKeyDown={e => { if (e.key === "Escape") onClose(); }} tabIndex={-1}>
      <div className="modal-content" style={MY_POPUP_STYLE} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="마이 메뉴">
        <div className="modal-header">
          <h2 className="modal-title">👤 마이</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>
        <div className="my-tab">
          <button className="my-tab__profile" onClick={() => nav("familyInfo")} type="button">
            <div className="my-tab__avatar">👨‍👩‍👧</div>
            <div className="my-tab__info">
              <span className="my-tab__name">{familyContext.member_display_name || "보호자"}</span>
              <span className="my-tab__role">부모 · {familyContext.family_code || "우리 가족"}</span>
            </div>
            <span className="my-tab__arrow">›</span>
          </button>

          <div className="my-tab__menu">
            <button className="my-tab__menu-item" onClick={() => nav("familyInfo")}>
              <span className="my-tab__menu-icon">👨‍👩‍👧</span>
              <span className="my-tab__menu-label">가족 정보</span>
              <span className="my-tab__arrow">›</span>
            </button>
            <button className="my-tab__menu-item" onClick={() => nav("settings")}>
              <span className="my-tab__menu-icon">⚙️</span>
              <span className="my-tab__menu-label">설정</span>
              <span className="my-tab__arrow">›</span>
            </button>
            <button className="my-tab__menu-item" onClick={() => nav("chores")}>
              <span className="my-tab__menu-icon">🎯</span>
              <span className="my-tab__menu-label">미션 관리</span>
              <span className="my-tab__arrow">›</span>
            </button>
            <button className="my-tab__menu-item" onClick={() => nav("autoGrant")}>
              <span className="my-tab__menu-icon">🔄</span>
              <span className="my-tab__menu-label">자동 지급</span>
              <span className="my-tab__arrow">›</span>
            </button>
            <button className="my-tab__menu-item" onClick={() => nav("qna")}>
              <span className="my-tab__menu-icon">❓</span>
              <span className="my-tab__menu-label">Q&A</span>
              <span className="my-tab__arrow">›</span>
            </button>
          </div>

          {onLogout && (
            <div className="my-tab__menu my-tab__menu--bottom">
              <button className="my-tab__menu-item" onClick={() => { onClose(); logout(); onLogout(); }}>
                <span className="my-tab__menu-icon">🔀</span>
                <span className="my-tab__menu-label">계정 전환</span>
                <span className="my-tab__arrow">›</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
