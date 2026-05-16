// src/utils/notifications.js — 인앱 알림 관리

const NOTIF_KEY = "notifications_v1";
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
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifs) {
  try {
    // 최대 개수 제한
    const trimmed = notifs.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(trimmed));
  } catch { /* ignored */ }
}

export function addNotification({ type, title, message, icon }) {
  const notifs = loadNotifications();
  notifs.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
  const notifs = loadNotifications();
  const target = notifs.find(n => n.id === notifId);
  if (target) target.read = true;
  saveNotifications(notifs);
}

export function markAllAsRead() {
  const notifs = loadNotifications();
  notifs.forEach(n => { n.read = true; });
  saveNotifications(notifs);
}

export function getUnreadCount() {
  return loadNotifications().filter(n => !n.read).length;
}

export function clearNotifications() {
  try {
    localStorage.removeItem(NOTIF_KEY);
  } catch { /* ignored */ }
}

function getDefaultIcon(type) {
  switch (type) {
    case "claim_approved": return "✅";
    case "claim_rejected": return "❌";
    case "claim_paid": return "💰";
    case "grant_received": return "💝";
    case "chore_approved": return "���";
    case "chore_rejected": return "🚫";
    case "auto_grant": return "🔄";
    default: return "🔔";
  }
}
