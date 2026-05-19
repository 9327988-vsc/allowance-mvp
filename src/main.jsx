import React from "react";
import { createRoot } from "react-dom/client";
import { initTheme } from "./utils/theme";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./components/App";
import "./index.css";
import "./styles/darkMode.css";
import "./styles/auth.css";
import "./styles/tutorial.css";
import "./styles/qna.css";
import "./styles/monthSelector.css";
import "./styles/accountSelect.css";
import "./styles/yearlyStats.css";
import "./styles/charts.css";
import "./styles/parentLayout.css";
import "./styles/calendar.css";
import "./styles/widgets.css";

// Workers 백엔드 없이 동작하도록 mock 백엔드 활성화 (동적 import로 프로덕션 번들 제외)
const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8787";
let mockReady = Promise.resolve();
if (import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === "true") {
  mockReady = import("./utils/mockBackend").then(({ enableMockBackend }) => {
    enableMockBackend(apiBase);
  }).catch((err) => {
    console.warn("[main] mock backend 로드 실패:", err);
  });
}

// 저장된 테마 적용 (FOUC 방지)
initTheme();

mockReady.then(() => {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
});

// PWA 서비스워커 등록
if ("serviceWorker" in navigator) {
  const swBase = import.meta.env.BASE_URL || "/allowance-mvp/";
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${swBase}sw.js`).catch(() => {
      // 서비스워커 등록 실패 — 무시 (개발 환경 등)
    });
  });
}
