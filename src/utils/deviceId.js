// src/utils/deviceId.js — 디바이스 UUID 관리 (4.6)

import { nanoid } from "./idGenerator";

const STORAGE_KEY = "device_id_v1";

/**
 * 디바이스 ID 조회 (없으면 생성 + 저장)
 * @returns {string} "dev_" + UUID
 */
export function getDeviceId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (id) {
    // 레거시: JSON으로 감싸진 경우 언래핑 (이후 raw string 반환)
    if (id.startsWith('"')) {
      try { id = JSON.parse(id); } catch { /* raw string, use as-is */ }
    }
    return id;
  }
  id = `dev_${nanoid(16)}`;
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignored */ }
  return id;
}

/**
 * 디바이스 ID 재발급 (관리자 모드 전용)
 */
export function resetDeviceId() {
  localStorage.removeItem(STORAGE_KEY);
}
