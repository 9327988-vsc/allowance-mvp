// src/hooks/useToast.js
import { useCallback } from "react";
import { showToast, dismissToast } from "../utils/toastManager";

/**
 * 토스트 표시 훅 (React 컴포넌트 내부에서 사용)
 * toastManager.js의 imperative API를 래핑
 */
export function useToast() {
  const toast = useCallback((opts) => showToast(opts), []);
  const dismiss = useCallback((id) => dismissToast(id), []);

  return { showToast: toast, dismissToast: dismiss };
}
