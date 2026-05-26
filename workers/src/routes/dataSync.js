// workers/src/routes/dataSync.js — bulk localStorage 동기화

import { kvGetJson, kvPutJson } from "../lib/kv.js";
import { jsonResponse, ValidationError } from "../lib/errors.js";

const MAX_ENTRIES = 500;
const MAX_VALUE_LEN = 200_000;

function validateInput(type, key) {
  if (!type || !key) {
    throw new ValidationError("INVALID_INPUT", "type, key 필수");
  }
  if (type !== "fam" && type !== "usr") {
    throw new ValidationError("INVALID_TYPE", "type은 fam 또는 usr");
  }
  if (typeof key !== "string" || key.length < 1 || key.length > 100) {
    throw new ValidationError("INVALID_KEY", "유효하지 않은 key");
  }
}

export async function handleDataSyncUpload(request, env) {
  const deviceId = request.headers.get("X-Device-Id");
  if (!deviceId) {
    throw new ValidationError("MISSING_DEVICE_ID", "X-Device-Id 헤더 필요");
  }

  const body = await request.json();
  const { type, key, entries } = body;

  validateInput(type, key);

  if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
    throw new ValidationError("INVALID_ENTRIES", "entries는 객체여야 합니다");
  }

  const entryKeys = Object.keys(entries);
  if (entryKeys.length === 0) {
    return jsonResponse({ ok: true, count: 0 });
  }
  if (entryKeys.length > MAX_ENTRIES) {
    throw new ValidationError("TOO_MANY_ENTRIES", `최대 ${MAX_ENTRIES}개 항목`);
  }

  for (const k of entryKeys) {
    if (typeof entries[k] === "string" && entries[k].length > MAX_VALUE_LEN) {
      throw new ValidationError("VALUE_TOO_LARGE", `항목 ${k} 크기 초과 (200KB)`);
    }
  }

  const kvKey = `data_sync/${type}/${key}`;
  const kv = env.ALLOWANCE_KV;

  const existing = (await kvGetJson(kv, kvKey)) || {};
  const merged = { ...existing, ...entries };
  await kvPutJson(kv, kvKey, merged);

  return jsonResponse({ ok: true, count: entryKeys.length });
}

export async function handleDataSyncDownload(request, env) {
  const deviceId = request.headers.get("X-Device-Id");
  if (!deviceId) {
    throw new ValidationError("MISSING_DEVICE_ID", "X-Device-Id 헤더 필요");
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const key = url.searchParams.get("key");

  validateInput(type, key);

  const entries = (await kvGetJson(env.ALLOWANCE_KV, `data_sync/${type}/${key}`)) || {};
  return jsonResponse({ entries });
}
