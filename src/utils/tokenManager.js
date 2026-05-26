// src/utils/tokenManager.js — JWT 토큰 수명 관리

const ACCESS_KEY = "jwt_access_v1";
const REFRESH_KEY = "jwt_refresh_v1";

const getBase = () => import.meta.env.VITE_API_BASE || "http://localhost:8787";

function decodePayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isExpired(token, marginSec = 60) {
  const payload = decodePayload(token);
  if (!payload?.exp) return true;
  return Date.now() / 1000 > payload.exp - marginSec;
}

export function saveTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function hasTokens() {
  return !!localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

let _refreshPromise = null;

export async function getAccessToken() {
  const token = localStorage.getItem(ACCESS_KEY);

  if (token && !isExpired(token)) return token;

  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken || isExpired(refreshToken, 0)) {
    clearTokens();
    return null;
  }

  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${getBase()}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return null;
      }

      const data = await res.json();
      saveTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch {
      return token && !isExpired(token, 0) ? token : null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}
