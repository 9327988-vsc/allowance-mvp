// src/hooks/useSwipeToClose.js — 모바일 바텀시트 스와이프 닫기
// Usage: All drawer components should use this hook for consistent close behavior.
// Currently used by: CategoryManager, MonthSelector
import { useRef, useCallback, useEffect } from "react";

const THRESHOLD = 100; // px

/**
 * 바텀시트 아래로 스와이프 시 닫기 (모바일 < 768px만)
 * @param {() => void} onClose
 * @returns {{ onTouchStart, onTouchMove, onTouchEnd }}
 */
export function useSwipeToClose(onClose) {
  const startY = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  const onTouchStart = useCallback((e) => {
    if (window.innerWidth >= 768) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback(() => {
    // 필요 시 드래그 피드백 추가 가능
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (startY.current === null || window.innerWidth >= 768) return;
    const endY = e.changedTouches[0].clientY;
    const diff = endY - startY.current;
    startY.current = null;
    if (diff >= THRESHOLD) {
      onCloseRef.current();
    }
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
