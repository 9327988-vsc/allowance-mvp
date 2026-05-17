import { createRoot } from "react-dom/client";
import { enableMockBackend } from "./utils/mockBackend";
import { initTheme } from "./utils/theme";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./components/App";
import "./index.css";

// Workers 백엔드 없이 동작하도록 mock 백엔드 활성화
const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8787";
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== "0") {
  enableMockBackend(apiBase);
}

// 저장된 테마 적용 (FOUC 방지)
initTheme();

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// PWA 서비스워커 등록
if ("serviceWorker" in navigator) {
  const swBase = import.meta.env.BASE_URL || "/allowance-mvp/";
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${swBase}sw.js`).catch(() => {
      // 서비스워커 등록 실패 — 무시 (개발 환경 등)
    });
  });
}
