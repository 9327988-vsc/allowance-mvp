// workers/src/middleware/cors.js — CORS 처리

// Production: set ALLOWED_ORIGINS env var in wrangler.toml (comma-separated)
// Development: falls back to "*"

function getAllowedOrigins(env) {
  if (env?.ALLOWED_ORIGINS) {
    return env.ALLOWED_ORIGINS.split(",").map(o => o.trim());
  }
  return ["*"];
}

function getCorsOrigin(request, env) {
  const allowedOrigins = getAllowedOrigins(env);
  const origin = request.headers.get("Origin") || "*";
  if (allowedOrigins.includes("*")) return "*";
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
}

function getCorsHeaders(request, env) {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(request, env),
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Device-Id, X-Family-Code, X-Member-Id",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCors(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
  }
  return null;
}

export function withCorsHeaders(response, request, env) {
  const res = new Response(response.body, response);
  for (const [k, v] of Object.entries(getCorsHeaders(request, env))) {
    res.headers.set(k, v);
  }
  return res;
}
