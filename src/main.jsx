import React from "react";
import { createRoot } from "react-dom/client";
import { initTheme } from "./utils/theme";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./components/App";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/summaryTable.css";
import "./styles/features.css";
import "./styles/tabLayout.css";
import "./styles/darkMode.css";
import "./styles/auth.css";
import "./styles/tutorial.css";
import "./styles/qna.css";
import "./styles/settings.css";
import "./styles/modals.css";
import "./styles/accountSelect.css";
import "./styles/yearlyStats.css";
import "./styles/charts.css";
import "./styles/parentLayout.css";
import "./styles/calendar.css";
import "./styles/widgets.css";

// Workers 백엔드 설정: VITE_API_BASE가 없으면 mock 백엔드 자동 활성화
const hasRealBackend = !!import.meta.env.VITE_API_BASE;
const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8787";
const useMock = !hasRealBackend || import.meta.env.VITE_USE_MOCK === "true";
let mockReady = Promise.resolve();
if (useMock) {
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
}).catch(console.error);

// PWA 서비스워커 등록
if ("serviceWorker" in navigator) {
  const swBase = import.meta.env.BASE_URL || "/allowance-mvp/";
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${swBase}sw.js`).catch(() => {
      // 서비스워커 등록 실패 — 무시 (개발 환경 등)
    });
  });
}
