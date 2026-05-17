// src/utils/onlineStatus.js — 오프라인 탐지 (4.12.3)

let _isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
const _listeners = new Set();

function _notifyListeners() {
  for (const cb of _listeners) {
    try { cb(_isOnline); } catch (e) { console.error("[onlineStatus] listener error", e); }
  }
}

function handleOnline() {
  _isOnline = true;
  _notifyListeners();
}

function handleOffline() {
  _isOnline = false;
  _notifyListeners();
}

if (typeof window !== "undefined") {
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
}

export function isOnline() {
  return _isOnline;
}

/**
 * 온라인/오프라인 상태 변경 구독
 * @param {(online: boolean) => void} cb
 * @returns {() => void} unsubscribe
 */
export function subscribeOnlineStatus(cb) {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

/**
 * 온라인 상태 변경 구독 (별칭)
 * @param {(online: boolean) => void} cb
 * @returns {() => void} unsubscribe
 */
export function onOnlineChange(cb) {
  return subscribeOnlineStatus(cb);
}

// HMR cleanup — 개발 중 핫 리로드 시 이벤트 리스너 중복 방지
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  });
}
