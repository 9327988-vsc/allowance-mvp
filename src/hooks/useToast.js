// src/hooks/useToast.js
import { showToast, dismissToast } from "../utils/toastManager";

/**
 * 토스트 표시 훅 (React 컴포넌트 내부에서 사용)
 * toastManager.js의 imperative API를 래핑
 */
export function useToast() {
  return { showToast, dismissToast };
}
