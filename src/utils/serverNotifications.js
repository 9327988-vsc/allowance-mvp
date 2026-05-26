const BASE = import.meta.env.VITE_API_BASE || "";

export async function sendServerNotification(familyCode, memberId, notification) {
  try {
    await fetch(`${BASE}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family_code: familyCode, member_id: memberId, notification }),
    });
  } catch {}
}

export async function fetchServerNotifications(familyCode, memberId) {
  try {
    const res = await fetch(
      `${BASE}/api/notifications?family_code=${encodeURIComponent(familyCode)}&member_id=${encodeURIComponent(memberId)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.notifications || [];
  } catch {
    return [];
  }
}

async function clearServerNotifications(familyCode, memberId) {
  try {
    await fetch(
      `${BASE}/api/notifications?family_code=${encodeURIComponent(familyCode)}&member_id=${encodeURIComponent(memberId)}`,
      { method: "DELETE" }
    );
  } catch {}
}

export async function syncServerNotifications(familyCode, memberId, localUserId) {
  const serverNotifs = await fetchServerNotifications(familyCode, memberId);
  if (!serverNotifs.length) return 0;

  const { mergeServerNotifications } = await import("./notifications.js");
  const count = mergeServerNotifications(localUserId, serverNotifs);
  clearServerNotifications(familyCode, memberId);
  return count;
}
