// workers/src/middleware/rateLimit.js — KV 기반 Rate Limiter

const LIMITS = {
  "auth:login":    { max: 5,  windowSec: 60 },
  "auth:register": { max: 3,  windowSec: 3600 },
  "write":         { max: 30, windowSec: 60 },
  "read":          { max: 60, windowSec: 60 },
};

function getClientIP(request) {
  return request.headers.get("cf-connecting-ip") || "unknown";
}

export async function checkRateLimit(env, request, action) {
  const limit = LIMITS[action];
  if (!limit) return;

  const ip = getClientIP(request);
  const key = `rl:${action}:${ip}`;

  try {
    const raw = await env.ALLOWANCE_KV.get(key);
    const count = raw ? parseInt(raw, 10) : 0;

    if (count >= limit.max) {
      const err = new Error("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
      err.status = 429;
      err.code = "RATE_LIMITED";
      throw err;
    }

    await env.ALLOWANCE_KV.put(key, String(count + 1), {
      expirationTtl: limit.windowSec,
    });
  } catch (e) {
    if (e.status === 429) throw e;
  }
}
