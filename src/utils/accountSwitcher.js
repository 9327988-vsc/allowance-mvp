// src/utils/accountSwitcher.js — 다중 계정 전환 관리

import { loadFamilyContext, saveFamilyContext, clearFamilyContext } from "./familyContext";
import { resetKVAdapter } from "./kvAdapter";
import { getDeviceId } from "./deviceId";
import { clearActiveUser } from "./authStore";
import { clearPrefsOverrides } from "./userPrefs";

const ACCOUNTS_KEY = "family_accounts_v1";

/**
 * 저장된 계정 목록 로드
 * @returns {Array<import("./familyContext").FamilyContextData>}
 */
export function loadSavedAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    // 손상된 데이터 백업 후 제거
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (raw) {
        localStorage.setItem(`${ACCOUNTS_KEY}_corrupted_${Date.now()}`, raw);
        localStorage.removeItem(ACCOUNTS_KEY);
      }
    } catch { /* ignored */ }
    return [];
  }
}

/**
 * 현재 활성 계정을 저장 목록에 추가 (중복 방지)
 */
export function saveCurrentAccount() {
  const ctx = loadFamilyContext();
  if (!ctx) return;

  const accounts = loadSavedAccounts();
  const idx = accounts.findIndex(
    (a) => a.family_id === ctx.family_id && a.member_id === ctx.member_id
  );
  if (idx >= 0) {
    accounts[idx] = ctx; // 업데이트
  } else {
    accounts.push(ctx);
  }
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); } catch { /* ignored */ }
}

/**
 * 특정 계정으로 전환
 */
export function switchToAccount(account) {
  // 현재 계정 먼저 저장
  saveCurrentAccount();
  // 새 계정으로 전환
  saveFamilyContext(account);
  // KVAdapter 리셋 (새 familyCode/memberId 반영)
  resetKVAdapter();
}

/**
 * 로그아웃 (현재 계정 저장 후 비활성)
 */
export function logout() {
  saveCurrentAccount();
  clearFamilyContext();
  clearActiveUser();
  clearPrefsOverrides();
  resetKVAdapter();
}

/**
 * 캐시된 계정의 표시 이름 업데이트 (patchMember 후 동기화용)
 */
export function updateAccountDisplayName(memberId, newName) {
  const accounts = loadSavedAccounts();
  const idx = accounts.findIndex(a => a.member_id === memberId);
  if (idx >= 0) {
    accounts[idx].member_display_name = newName;
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); } catch { /* ignored */ }
  }
}

/**
 * 저장된 계정 삭제
 */
export function removeSavedAccount(familyId, memberId) {
  const accounts = loadSavedAccounts();
  const filtered = accounts.filter(
    (a) => !(a.family_id === familyId && a.member_id === memberId)
  );
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered)); } catch { /* ignored */ }
}
