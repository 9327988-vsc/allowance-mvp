const BASE = import.meta.env.VITE_API_URL || "";
const MOCK_PREFIX = "mock_kv:";
const USER_PREFIXES = ["calendar_v1_", "settings_v1_u_", "submitted_claims_v1", "custom_categories_v1"];

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

function restoreEntries(entries) {
  if (!entries) return 0;
  let count = 0;
  for (const [k, v] of Object.entries(entries)) {
    if (v == null) continue;
    try { localStorage.setItem(k, v); count++; } catch {}
  }
  return count;
}

async function syncPost(type, key, entries) {
  try {
    await fetch(`${BASE}/api/data-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, key, entries }),
    });
  } catch {}
}

async function syncGet(type, key) {
  try {
    const res = await fetch(`${BASE}/api/data-sync?type=${encodeURIComponent(type)}&key=${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.entries;
  } catch {
    return null;
  }
}

export async function uploadFamilyData(familyCode) {
  const entries = gatherByPrefix([MOCK_PREFIX]);
  if (Object.keys(entries).length === 0) return;
  await syncPost("fam", familyCode, entries);
}

export async function downloadFamilyData(familyCode) {
  const entries = await syncGet("fam", familyCode);
  return restoreEntries(entries);
}

export async function uploadUserData(username) {
  const entries = gatherByPrefix(USER_PREFIXES);
  if (Object.keys(entries).length === 0) return;
  await syncPost("usr", username, entries);
}

export async function downloadUserData(username) {
  const entries = await syncGet("usr", username);
  return restoreEntries(entries);
}
