// src/utils/notifications.js — 인앱 알림 관리

import { getActiveUser } from "./authStore";
import { nanoid } from "./idGenerator";

function getNotifKey() {
  const userId = getActiveUser();
  if (!userId) return null;
  return "notifications_v1_u_" + userId;
}
const MAX_NOTIFICATIONS = 50;

/**
 * 알림 데이터 구조:
 * {
 *   id: string,
 *   type: "claim_approved" | "claim_rejected" | "claim_paid" | "grant_received" | "chore_approved" | "chore_rejected" | "auto_grant" | "info",
 *   title: string,
 *   message: string,
 *   icon: string,
 *   read: boolean,
 *   created_at: string (ISO8601),
 * }
 */

export function loadNotifications() {
  const key = getNotifKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("[notifications] loadNotifications parse failed:", e);
    return [];
  }
}

function saveNotifications(notifs) {
  const key = getNotifKey();
  if (!key) return;
  try {
    // 최대 개수 제한
    const trimmed = notifs.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (e) { console.warn("[notifications] saveNotifications failed:", e); }
}

export function addNotification({ type, title, message, icon }) {
  const key = getNotifKey();
  if (!key) return;
  const notifs = loadNotifications();
  notifs.unshift({
    id: `notif_${nanoid(8)}`,
    type: type || "info",
    title,
    message,
    icon: icon || getDefaultIcon(type),
    read: false,
    created_at: new Date().toISOString(),
  });
  saveNotifications(notifs);
}

export function markAsRead(notifId) {
  const key = getNotifKey();
  if (!key) return;
  const notifs = loadNotifications();
  const idx = notifs.findIndex(n => n.id === notifId);
  if (idx === -1) return;
  notifs[idx] = { ...notifs[idx], read: true };
  saveNotifications(notifs);
}

export function markAllAsRead() {
  const key = getNotifKey();
  if (!key) return;
  const notifs = loadNotifications();
  const updated = notifs.map(n => n.read ? n : { ...n, read: true });
  saveNotifications(updated);
}

export function getUnreadCount() {
  const key = getNotifKey();
  if (!key) return 0;
  return loadNotifications().filter(n => !n.read).length;
}

export function clearNotifications() {
  const key = getNotifKey();
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch (e) { console.warn("[notifications] clearNotifications failed:", e); }
}

/**
 * 특정 유저에게 알림 전달 (현재 활성 유저와 무관하게 직접 쓰기)
 * 청구 승인/거절 시 자녀에게 알림을 보낼 때 사용
 */
export function addNotificationForUser(userId, notification) {
  if (!userId) return;
  const key = "notifications_v1_u_" + userId;
  let list;
  try {
    list = JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    console.warn("[notifications] addNotificationForUser parse failed:", e);
    list = [];
  }
  if (!Array.isArray(list)) list = [];
  list.unshift({
    ...notification,
    id: `notif_${nanoid(8)}`,
    created_at: new Date().toISOString(),
    read: false,
    icon: notification.icon || getDefaultIcon(notification.type),
  });
  try { localStorage.setItem(key, JSON.stringify(list.slice(0, MAX_NOTIFICATIONS))); } catch (e) { console.warn("[notifications] addNotificationForUser save failed:", e); }
}

export function mergeServerNotifications(userId, serverNotifs) {
  if (!userId || !serverNotifs?.length) return 0;
  const key = "notifications_v1_u_" + userId;
  let list;
  try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch { list = []; }
  if (!Array.isArray(list)) list = [];
  const existingIds = new Set(list.map(n => n.id));
  const newNotifs = serverNotifs.filter(n => !existingIds.has(n.id));
  if (newNotifs.length === 0) return 0;
  const merged = [...newNotifs, ...list].slice(0, MAX_NOTIFICATIONS);
  try { localStorage.setItem(key, JSON.stringify(merged)); } catch {}
  return newNotifs.length;
}

function getDefaultIcon(type) {
  switch (type) {
    case "claim_approved": return "✅";
    case "claim_rejected": return "❌";
    case "claim_paid": return "💰";
    case "grant_received": return "💝";
    case "chore_approved": return "⭐";
    case "chore_rejected": return "🚫";
    case "auto_grant": return "🔄";
    default: return "🔔";
  }
}
