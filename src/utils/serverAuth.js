const BASE = import.meta.env.VITE_API_URL || "";

export async function serverRegister({ username, password, display_name, role, security_question, security_answer }) {
  try {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, display_name, role, security_question, security_answer }),
    });
    return await res.json();
  } catch {
    return { error: "NETWORK_ERROR" };
  }
}

export async function serverLogin(username, password) {
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return { success: false, error: (await res.json()).error };
    return await res.json();
  } catch {
    return { success: false, error: "NETWORK_ERROR" };
  }
}
