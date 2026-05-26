// src/utils/serverAuth.js — Workers JWT 인증 API 클라이언트

import { saveTokens, clearTokens, getRefreshToken } from "./tokenManager";

const getBase = () => import.meta.env.VITE_API_BASE || "http://localhost:8787";

export async function serverRegister({ username, password, display_name, role, security_question, security_answer }) {
  try {
    const res = await fetch(`${getBase()}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, display_name, role, security_question, security_answer }),
    });
    const data = await res.json();
    if (data.access_token) {
      saveTokens(data.access_token, data.refresh_token);
    }
    return data;
  } catch {
    return { error: "NETWORK_ERROR" };
  }
}

export async function serverLogin(username, password) {
  try {
    const res = await fetch(`${getBase()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error };
    }
    const data = await res.json();
    if (data.access_token) {
      saveTokens(data.access_token, data.refresh_token);
    }
    return data;
  } catch {
    return { success: false, error: "NETWORK_ERROR" };
  }
}

export async function serverLogout() {
  const refreshToken = getRefreshToken();
  try {
    await fetch(`${getBase()}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch { /* best-effort */ }
  clearTokens();
}

export async function serverUpdateProfile(username, { family_context }) {
  try {
    await fetch(`${getBase()}/api/auth/update-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, family_context }),
    });
  } catch { /* best-effort, endpoint not yet on Workers */ }
}
