// src/utils/offlineStore.js — IndexedDB 오프라인 캐시 + 쓰기 큐

const DB_NAME = "allowance_offline_v1";
const DB_VERSION = 1;
const CACHE_STORE = "api_cache";
const QUEUE_STORE = "offline_queue";
const CACHE_TTL = 5 * 60 * 1000; // 5분

let _db = null;
let _dbPromise = null;
const _queueListeners = new Set();

function openDB() {
  if (_db) return Promise.resolve(_db);
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: "path" });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  }).catch((err) => {
    _dbPromise = null;
    throw err;
  });

  return _dbPromise;
}

// --- 읽기 캐시 ---

export async function cacheGet(path) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(CACHE_STORE, "readonly");
      const req = tx.objectStore(CACHE_STORE).get(path);
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) { resolve(null); return; }
        if (Date.now() - entry.cachedAt > CACHE_TTL) { resolve(null); return; }
        resolve(entry.data);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cacheSet(path, data) {
  try {
    const db = await openDB();
    const tx = db.transaction(CACHE_STORE, "readwrite");
    tx.objectStore(CACHE_STORE).put({ path, data, cachedAt: Date.now() });
  } catch { /* IndexedDB 미지원 시 무시 */ }
}

// --- 쓰기 큐 ---

export async function enqueueOffline(op) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      const req = tx.objectStore(QUEUE_STORE).add({
        method: op.method,
        path: op.path,
        body: op.body,
        headers: op.headers || {},
        createdAt: Date.now(),
      });
      req.onsuccess = () => { _notifyQueueListeners(); resolve(req.result); };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    throw new Error("오프라인 큐 저장 실패: " + err.message);
  }
}

export async function dequeueAll() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(QUEUE_STORE, "readonly");
      const req = tx.objectStore(QUEUE_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removeFromQueue(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).delete(id);
    _notifyQueueListeners();
  } catch { /* 무시 */ }
}

export async function getQueueCount() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(QUEUE_STORE, "readonly");
      const req = tx.objectStore(QUEUE_STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

export async function clearQueue() {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).clear();
    _notifyQueueListeners();
  } catch { /* 무시 */ }
}

// --- 큐 replay ---

let _replaying = false;

export async function replayQueue(fetchFn) {
  if (_replaying) return { success: 0, failed: 0 };
  _replaying = true;

  const items = await dequeueAll();
  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await fetchFn(item.method, item.path, item.body);
      await removeFromQueue(item.id);
      success++;
    } catch (err) {
      if (err.code === "CONFLICT" || err.code === "DUPLICATE_CLAIM" || err.code === "DUPLICATE_EXTRA_CLAIM" || err.code === "DUPLICATE_CLAIM_ID") {
        await removeFromQueue(item.id);
        failed++;
      } else {
        break;
      }
    }
  }

  _replaying = false;
  return { success, failed };
}

// --- 큐 변경 구독 ---

function _notifyQueueListeners() {
  getQueueCount().then((count) => {
    for (const cb of _queueListeners) {
      try { cb(count); } catch { /* 무시 */ }
    }
  });
}

export function subscribeQueueCount(cb) {
  _queueListeners.add(cb);
  getQueueCount().then(cb).catch(() => cb(0));
  return () => _queueListeners.delete(cb);
}

// 테스트용 리셋
export function _resetOfflineStore() {
  _db = null;
  _dbPromise = null;
}
