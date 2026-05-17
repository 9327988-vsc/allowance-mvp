// src/utils/toastManager.js

/**
 * 토스트 imperative API (v3.5 CR3-02 신규)
 *
 * 사용 패턴:
 * - React 컴포넌트 안: useToast() 훅 사용 권장 (하지만 showToast()도 동일하게 동작)
 * - utils (storage.js 등) 안: showToast() 직접 호출
 *
 * 마운트 정책:
 * - App.jsx 최상위에 <ToastContainer />를 단 한 번만 마운트
 * - 마운트 즉시 _setState 등록됨, unmount 시 null로 리셋
 */

let _setState = null;          // ToastContainer가 등록한 setState
let _idCounter = Date.now();
let _pendingQueue = [];        // ToastContainer 마운트 전 큐
const _flushedIds = new Set(); // HMR 중복 방지

/**
 * 외부에서 호출하는 imperative API
 *
 * @param {object} opts
 * @param {"success"|"error"|"warning"} opts.type - 7.10 매트릭스 ID와 매핑 (success=S-301, error=S-302, warning=S-303)
 * @param {string} opts.message - 표시 텍스트
 * @param {number} [opts.duration] - 자동 닫힘 ms (0 = 수동 닫기). 미지정 시 7.10 기본값 (S-301=3000, S-302=5000, S-303=4000)
 * @param {{label: string, onClick: () => void}} [opts.action] - 액션 버튼 (HI3-08: calendar 손상 토스트의 [관리자 모드 열기] 등)
 * @returns {number|null} 토스트 ID (수동 닫기에 사용) — 등록 전이면 큐에 저장 후 ID 반환
 */
export function showToast(opts) {
  const id = ++_idCounter;
  const defaultDuration = opts.type === "success" ? 3000 : opts.type === "error" ? 5000 : 4000;
  const toast = {
    id,
    type: opts.type,
    message: opts.message,
    duration: opts.duration ?? defaultDuration,
    action: opts.action ?? null
  };

  if (!_setState) {
    // ToastContainer 마운트 전 호출 — 큐에 저장
    _pendingQueue.push(toast);
    return id;
  }

  _dispatchToast(toast);
  return id;
}

function _dispatchToast(toast) {
  _setState(prev => [...prev, toast]);

  // duration > 0이면 자동 닫힘 (액션 토스트는 duration=0으로 수동 닫기 권장)
  if (toast.duration > 0) {
    setTimeout(() => dismissToast(toast.id), toast.duration);
  }
}

export function dismissToast(id) {
  if (!_setState) return;
  _setState(prev => prev.filter(t => t.id !== id));
}

/**
 * ToastContainer 마운트 시 호출 (내부용)
 * 큐에 쌓인 토스트를 flush한다.
 */
export function _registerToastContainer(setState) {
  _setState = setState;
  _flushPendingQueue();
}

function _flushPendingQueue() {
  if (_pendingQueue.length === 0) return;
  const queued = _pendingQueue.filter(t => !_flushedIds.has(t.id));
  _pendingQueue = [];
  for (const toast of queued) {
    _flushedIds.add(toast.id);
    _dispatchToast(toast);
  }
}

export function _unregisterToastContainer() {
  _setState = null;
}
