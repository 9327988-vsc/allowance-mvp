import { getDeviceId } from "./deviceId";
import { loadFamilyContext } from "./familyContext";
import { getActiveUser } from "./authStore";

const BASE = import.meta.env.VITE_API_URL || "";
const FAMILY_PREFIXES = [
  "mock_kv:", "chores_v1_f_", "chore_log_v1_f_",
  "auto_grant_schedules_v1_f_", "auto_grant_last_run_v1_f_", "qna_v1_f_",
  "user_accounts_v1", "saved_family_accounts_v1",
];
const USER_PREFIXES = [
  "family_context_v1",
  "calendar_v1_", "settings_v1", "settings_v1_u_", "custom_categories_v1",
  "submitted_claims_v1", "user_prefs_v1", "badges_earned_v1_u_",
  "badges_earned_v1", "notifications_v1_u_",
];

const MERGE_KEYS = new Set(["user_accounts_v1"]);
const LIST_MERGE_SUFFIX = "/claims/list";
const MEMBER_LIST_SUFFIX = "/members/list";

function gatherByPrefix(prefixes) {
  const entries = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (prefixes.some(p => k.startsWith(p) || k === p)) {
      try { entries[k] = localStorage.getItem(k); } catch {}
    }
  }
  return entries;
}

function mergeAccountEntries(key, remoteValue) {
  try {
    const remote = JSON.parse(remoteValue);
    if (!Array.isArray(remote)) { localStorage.setItem(key, remoteValue); return; }
    const localStr = localStorage.getItem(key);
    const local = localStr ? JSON.parse(localStr) : [];
    if (!Array.isArray(local)) { localStorage.setItem(key, remoteValue); return; }
    const localIds = new Set(local.map(u => u.user_id));
    for (const item of remote) {
      if (item.user_id && !localIds.has(item.user_id)) {
        local.push(item);
      }
    }
    localStorage.setItem(key, JSON.stringify(local));
  } catch {
    localStorage.setItem(key, remoteValue);
  }
}

function mergeArrayList(key, remoteValue) {
  try {
    const remote = JSON.parse(remoteValue);
    if (!Array.isArray(remote)) { localStorage.setItem(key, remoteValue); return; }
    const localStr = localStorage.getItem(key);
    const local = localStr ? JSON.parse(localStr) : [];
    if (!Array.isArray(local)) { localStorage.setItem(key, remoteValue); return; }
    const merged = [...new Set([...local, ...remote])];
    localStorage.setItem(key, JSON.stringify(merged));
  } catch {
    localStorage.setItem(key, remoteValue);
  }
}

function isListKey(k) {
  return k.endsWith(LIST_MERGE_SUFFIX) || k.endsWith(MEMBER_LIST_SUFFIX);
}

function restoreEntries(entries) {
  if (!entries) return 0;
  let count = 0;
  for (const [k, v] of Object.entries(entries)) {
    if (v == null) continue;
    try {
      if (MERGE_KEYS.has(k)) {
        mergeAccountEntries(k, v);
      } else if (isListKey(k)) {
        mergeArrayList(k, v);
      } else {
        localStorage.setItem(k, v);
      }
      count++;
    } catch {}
  }
  return count;
}

async function syncPost(type, key, entries) {
  const res = await fetch(`${BASE}/api/data-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, key, entries }),
  });
  if (!res.ok) throw new Error(`서버 응답 ${res.status}`);
}

async function syncGet(type, key) {
  try {
    const res = await fetch(`${BASE}/api/data-sync?type=${encodeURIComponent(type)}&key=${encodeURIComponent(key)}`);
    if (!res.ok) { console.warn("[dataSync] download failed:", res.status); return null; }
    const data = await res.json();
    return data.entries;
  } catch (e) {
    console.warn("[dataSync] download error:", e.message);
    return null;
  }
}

export async function uploadFamilyData(familyCode) {
  const entries = gatherByPrefix(FAMILY_PREFIXES);
  const count = Object.keys(entries).length;
  if (count === 0) return 0;
  console.info("[dataSync] uploading family data:", count, "keys for", familyCode, Object.keys(entries));
  await syncPost("fam", familyCode, entries);
  return count;
}

export async function downloadFamilyData(familyCode) {
  const entries = await syncGet("fam", familyCode);
  const count = restoreEntries(entries);
  console.info("[dataSync] downloaded family data:", count, "keys for", familyCode, entries ? Object.keys(entries) : []);
  if (count > 0) {
    rebindDeviceId();
    window.dispatchEvent(new CustomEvent("sync-downloaded"));
  }
  return count;
}

function rebindDeviceId() {
  const ctx = loadFamilyContext();
  if (!ctx?.family_id) return;
  const currentDeviceId = getDeviceId();
  const prefix = `mock_kv:families/${ctx.family_id}/members/`;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const member = JSON.parse(raw);
      if (member.device_id !== currentDeviceId) {
        member.device_id = currentDeviceId;
        localStorage.setItem(k, JSON.stringify(member));
        console.info("[dataSync] rebound device_id for", k.slice(prefix.length));
      }
    }
  } catch (e) {
    console.warn("[dataSync] rebindDeviceId failed:", e);
  }
}

export async function uploadUserData(username) {
  const entries = gatherByPrefix(USER_PREFIXES);
  const keys = Object.keys(entries);
  const count = keys.length;
  if (count === 0) return 0;
  const calCount = keys.filter(k => k.startsWith("calendar_v1_") && !k.includes("_corrupted_")).length;
  console.info("[dataSync] uploading user data:", count, "keys (cal:", calCount, ") for", username, keys);
  await syncPost("usr", username, entries);
  return { total: count, calendar: calCount };
}

const USER_SCOPED_PREFIXES = ["settings_v1_u_", "badges_earned_v1_u_", "notifications_v1_u_"];

function remapUserScopedKeys(entries) {
  const currentUserId = getActiveUser();
  if (!currentUserId || !entries) return;
  for (const key of Object.keys(entries)) {
    for (const prefix of USER_SCOPED_PREFIXES) {
      if (!key.startsWith(prefix)) continue;
      const oldUserId = key.slice(prefix.length);
      if (oldUserId === currentUserId) break;
      const newKey = prefix + currentUserId;
      if (!localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, entries[key]);
        console.info("[dataSync] remapped", key, "→", newKey);
      }
      break;
    }
  }
  remapUserPrefs(entries, currentUserId);
}

function remapUserPrefs(entries, currentUserId) {
  const raw = entries["user_prefs_v1"];
  if (!raw) return;
  try {
    const prefs = JSON.parse(raw);
    if (prefs[currentUserId]) return;
    const otherIds = Object.keys(prefs).filter(id => id !== currentUserId);
    if (otherIds.length === 0) return;
    prefs[currentUserId] = prefs[otherIds[0]];
    localStorage.setItem("user_prefs_v1", JSON.stringify(prefs));
    console.info("[dataSync] remapped user_prefs_v1 from", otherIds[0], "→", currentUserId);
  } catch {}
}

export async function downloadUserData(username) {
  const entries = await syncGet("usr", username);
  const count = restoreEntries(entries);
  remapUserScopedKeys(entries);
  const keys = entries ? Object.keys(entries) : [];
  const calCount = keys.filter(k => k.startsWith("calendar_v1_") && !k.includes("_corrupted_")).length;
  console.info("[dataSync] downloaded user data:", count, "keys (cal:", calCount, ") for", username, keys);
  if (count > 0) window.dispatchEvent(new CustomEvent("sync-downloaded"));
  return { total: count, calendar: calCount };
}
