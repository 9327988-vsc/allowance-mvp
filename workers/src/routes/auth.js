// workers/src/routes/auth.js — JWT 인증 라우트 (register/login/refresh/logout/me)

import jwt from "@tsndr/cloudflare-worker-jwt";
import { jsonResponse } from "../lib/errors.js";
import { ValidationError, AuthError, ConflictError } from "../lib/errors.js";
import { checkRateLimit } from "../middleware/rateLimit.js";

const ACCESS_TTL = 15 * 60;
const REFRESH_TTL = 30 * 24 * 60 * 60;

// --- PBKDF2 (Web Crypto API) ---

async function hashPassword(password, salt, iterations) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBuffer(salt), iterations, hash: "SHA-256" },
    keyMaterial, 256
  );
  return bufferToHex(bits);
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

function generateId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

function getIterations(env) {
  return parseInt(env.PBKDF2_ITERATIONS || "100000", 10);
}

// --- JWT 발급 ---

async function issueTokens(env, user) {
  const now = Math.floor(Date.now() / 1000);
  const jti = generateId();

  const accessToken = await jwt.sign({
    sub: user.user_id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
    iat: now,
    exp: now + ACCESS_TTL,
  }, env.JWT_SECRET);

  const refreshToken = await jwt.sign({
    sub: user.user_id,
    jti,
    type: "refresh",
    iat: now,
    exp: now + REFRESH_TTL,
  }, env.REFRESH_SECRET);

  await env.ALLOWANCE_KV.put(`refresh:${jti}`, user.user_id, {
    expirationTtl: REFRESH_TTL,
  });

  return { accessToken, refreshToken };
}

// --- register ---

export async function handleRegister(request, env) {
  await checkRateLimit(env, request, "auth:register");

  const body = await request.json();
  const { username, password, display_name, role, security_question, security_answer } = body;

  if (!username || !password) {
    throw new ValidationError("MISSING_FIELDS", "username과 password는 필수입니다");
  }
  if (password.length < 4) {
    throw new ValidationError("WEAK_PASSWORD", "비밀번호는 4자 이상이어야 합니다");
  }

  const normalizedUsername = username.toLowerCase().trim();
  const userKey = `user:${normalizedUsername}`;
  const existing = await env.ALLOWANCE_KV.get(userKey);
  const iterations = getIterations(env);
  const familyContext = body.family_context;

  if (existing) {
    const existingUser = JSON.parse(existing);
    const inputHash = await hashPassword(password, existingUser.password_salt, iterations);
    if (inputHash !== existingUser.password_hash) {
      throw new ConflictError("USERNAME_TAKEN", "이미 사용 중인 아이디입니다");
    }
    if (familyContext?.family_id && familyContext?.member_id) {
      await syncUserFamily(env, existingUser.user_id, familyContext);
    }
    const { accessToken, refreshToken } = await issueTokens(env, existingUser);
    return jsonResponse({
      success: true,
      user: { user_id: existingUser.user_id, username: existingUser.username, display_name: existingUser.display_name, role: existingUser.role },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt, iterations);

  const user = {
    user_id: `u_${generateId()}`,
    username: normalizedUsername,
    password_hash: passwordHash,
    password_salt: salt,
    display_name: display_name || username,
    role: role || "general",
    security_question: security_question || null,
    security_answer_hash: null,
    security_answer_salt: null,
    created_at: new Date().toISOString(),
  };

  if (security_answer) {
    const aSalt = generateSalt();
    user.security_answer_hash = await hashPassword(
      security_answer.trim().toLowerCase(), aSalt, iterations
    );
    user.security_answer_salt = aSalt;
  }

  await env.ALLOWANCE_KV.put(userKey, JSON.stringify(user));
  await env.ALLOWANCE_KV.put(`userid:${user.user_id}`, normalizedUsername);

  if (familyContext?.family_id && familyContext?.member_id) {
    await syncUserFamily(env, user.user_id, familyContext);
  }

  const { accessToken, refreshToken } = await issueTokens(env, user);

  return jsonResponse({
    success: true,
    user: { user_id: user.user_id, username: user.username, display_name: user.display_name, role: user.role },
    access_token: accessToken,
    refresh_token: refreshToken,
  }, 201);
}

async function syncUserFamily(env, userId, familyContext) {
  try {
    const kv = env.ALLOWANCE_KV;
    const existing = await kv.get(`user_families/${userId}`);
    const families = existing ? JSON.parse(existing) : [];
    const already = families.some(f => f.family_id === familyContext.family_id);
    if (!already) {
      families.push({
        family_id: familyContext.family_id,
        member_id: familyContext.member_id,
      });
      await kv.put(`user_families/${userId}`, JSON.stringify(families));
    }
  } catch {}
}

// --- login ---

export async function handleLogin(request, env) {
  await checkRateLimit(env, request, "auth:login");

  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    throw new ValidationError("MISSING_FIELDS", "username과 password는 필수입니다");
  }

  const normalizedUsername = username.toLowerCase().trim();
  const raw = await env.ALLOWANCE_KV.get(`user:${normalizedUsername}`);

  if (!raw) {
    throw new AuthError("INVALID_CREDENTIALS", "아이디 또는 비밀번호가 올바르지 않습니다");
  }

  const user = JSON.parse(raw);
  const iterations = getIterations(env);
  const inputHash = await hashPassword(password, user.password_salt, iterations);

  if (inputHash !== user.password_hash) {
    throw new AuthError("INVALID_CREDENTIALS", "아이디 또는 비밀번호가 올바르지 않습니다");
  }

  const { accessToken, refreshToken } = await issueTokens(env, user);

  return jsonResponse({
    success: true,
    user: { user_id: user.user_id, username: user.username, display_name: user.display_name, role: user.role },
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}

// --- refresh ---

export async function handleRefresh(request, env) {
  const body = await request.json();
  const { refresh_token } = body;

  if (!refresh_token) {
    throw new ValidationError("MISSING_TOKEN", "refresh_token이 필요합니다");
  }

  const valid = await jwt.verify(refresh_token, env.REFRESH_SECRET);
  if (!valid) {
    throw new AuthError("INVALID_TOKEN", "유효하지 않은 리프레시 토큰입니다");
  }

  const { payload } = jwt.decode(refresh_token);
  if (payload.type !== "refresh" || !payload.jti) {
    throw new AuthError("INVALID_TOKEN", "유효하지 않은 리프레시 토큰입니다");
  }

  const storedUserId = await env.ALLOWANCE_KV.get(`refresh:${payload.jti}`);
  if (!storedUserId || storedUserId !== payload.sub) {
    throw new AuthError("TOKEN_REVOKED", "토큰이 무효화되었습니다");
  }

  // 기존 refresh 토큰 무효화 (rotation)
  await env.ALLOWANCE_KV.delete(`refresh:${payload.jti}`);

  // 사용자 최신 정보 조회
  const raw = await getUserById(env, payload.sub);
  const user = raw ? JSON.parse(raw) : null;
  if (!user) {
    throw new AuthError("USER_NOT_FOUND", "사용자를 찾을 수 없습니다");
  }

  const { accessToken, refreshToken: newRefreshToken } = await issueTokens(env, user);

  return jsonResponse({
    access_token: accessToken,
    refresh_token: newRefreshToken,
  });
}

async function getUserById(env, userId) {
  const username = await env.ALLOWANCE_KV.get(`userid:${userId}`);
  if (!username) return null;
  return env.ALLOWANCE_KV.get(`user:${username}`);
}

// --- logout ---

export async function handleLogout(request, env) {
  const body = await request.json();
  const { refresh_token } = body;

  if (refresh_token) {
    try {
      const { payload } = jwt.decode(refresh_token);
      if (payload?.jti) {
        await env.ALLOWANCE_KV.delete(`refresh:${payload.jti}`);
      }
    } catch { /* 무효한 토큰이어도 로그아웃은 성공 */ }
  }

  return jsonResponse({ success: true });
}

// --- me (현재 사용자 정보) ---

export async function handleMe(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("MISSING_TOKEN", "인증이 필요합니다");
  }

  const token = authHeader.slice(7);
  const valid = await jwt.verify(token, env.JWT_SECRET);
  if (!valid) {
    throw new AuthError("INVALID_TOKEN", "유효하지 않은 토큰입니다");
  }

  const { payload } = jwt.decode(token);

  return jsonResponse({
    user_id: payload.sub,
    username: payload.username,
    display_name: payload.display_name,
    role: payload.role,
  });
}
