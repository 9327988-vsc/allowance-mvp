// workers/src/lib/kv.js — KV 헬퍼 함수
// NOTE: Cloudflare KV is eventually consistent.
// Reads after writes may return stale data for up to 60 seconds.
// For strong consistency requirements, consider migrating to Durable Objects or D1.

export async function kvGetJson(kv, key) {
  try {
    const raw = await kv.get(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function kvPutJson(kv, key, value) {
  await kv.put(key, JSON.stringify(value));
}

export async function kvDelete(kv, key) {
  await kv.delete(key);
}

// Prepends id to the list (newest first)
export async function kvAppendToList(kv, listKey, id) {
  const list = (await kvGetJson(kv, listKey)) || [];
  if (!list.includes(id)) {
    list.unshift(id);
    await kvPutJson(kv, listKey, list);
  }
}

export async function kvRemoveFromList(kv, listKey, id) {
  const list = (await kvGetJson(kv, listKey)) || [];
  const filtered = list.filter((x) => x !== id);
  await kvPutJson(kv, listKey, filtered);
}
