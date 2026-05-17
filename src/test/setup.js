// src/test/setup.js — Vitest 테스트 환경 설정
// jsdom 환경에서 localStorage가 제대로 제공되지 않을 경우 폴백

// TODO: Add integration tests for core claim workflow:
// - submit → approve → pay → receive
// - concurrent parent operations
// - LWW conflict resolution
// - carryover detection across months

if (typeof globalThis.localStorage === "undefined" || typeof globalThis.localStorage.clear !== "function") {
  const store = {};
  globalThis.localStorage = {
    getItem(key) { return key in store ? store[key] : null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key(i) { return Object.keys(store)[i] ?? null; },
  };
}
