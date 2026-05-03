// src/components/widgets/ToastContainer.jsx
//   - S-301/S-302/S-303 렌더링 (단일 파일, Toast.jsx 별도 없음 — v3.6 HI4-04)
//   - toastManager.js의 imperative API와 연결
import { useEffect, useState } from "react";
import { _registerToastContainer, _unregisterToastContainer, dismissToast } from "../../utils/toastManager";

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _registerToastContainer(setToasts);
    return () => _unregisterToastContainer();
  }, []);

  return (
    <div className="toast-container" role="region" aria-label="알림">
      {toasts.map(t => (
        <div key={t.id} role="status" aria-live="polite" className={`toast toast-${t.type}`}>
          <span>{t.message}</span>
          {t.action && (
            <button onClick={() => { t.action.onClick(); dismissToast(t.id); }}>
              {t.action.label}
            </button>
          )}
          <button aria-label="닫기" onClick={() => dismissToast(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
