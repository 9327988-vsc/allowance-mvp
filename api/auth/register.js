import crypto from "crypto";

const ITERATIONS = 100000;
const KEY_LEN = 32;

function hash(input, salt) {
  return crypto.pbkdf2Sync(input, salt, ITERATIONS, KEY_LEN, "sha256").toString("hex");
}

async function redis(url, token, cmd) {
  const res = await fetch(`${url}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, password, display_name, role, security_question, security_answer } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username and password required" });

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = `user:${username.toLowerCase()}`;

  const existing = await redis(url, token, ["GET", key]);
  if (existing.result) return res.status(409).json({ error: "이미 사용 중인 아이디입니다" });

  const salt = crypto.randomBytes(16).toString("hex");
  const password_hash = hash(password, salt);

  const userData = {
    username: username.toLowerCase(),
    password_hash,
    password_salt: salt,
    display_name: display_name || username,
    role: role || "general",
    security_question: security_question || null,
    security_answer_hash: null,
    security_answer_salt: null,
    created_at: new Date().toISOString(),
  };

  if (security_answer) {
    const aSalt = crypto.randomBytes(16).toString("hex");
    userData.security_answer_hash = hash(security_answer.trim().toLowerCase(), aSalt);
    userData.security_answer_salt = aSalt;
  }

  await redis(url, token, ["SET", key, JSON.stringify(userData)]);
  res.status(201).json({ success: true, username: userData.username });
}
