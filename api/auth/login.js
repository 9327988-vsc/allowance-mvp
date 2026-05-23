import { pbkdf2Sync } from "node:crypto";

const ITERATIONS = 100000;
const KEY_LEN = 32;

function hash(input, salt) {
  return pbkdf2Sync(input, salt, ITERATIONS, KEY_LEN, "sha256").toString("hex");
}

async function redis(url, token, cmd) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return res.status(500).json({ error: "Server configuration error" });

    const key = `user:${username.toLowerCase()}`;
    const result = await redis(url, token, ["GET", key]);
    if (!result.result) return res.status(401).json({ error: "존재하지 않는 아이디입니다" });

    const userData = JSON.parse(result.result);
    const inputHash = hash(password, userData.password_salt);

    if (inputHash !== userData.password_hash) {
      return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
    }

    res.status(200).json({
      success: true,
      user: {
        username: userData.username,
        display_name: userData.display_name,
        role: userData.role,
        security_question: userData.security_question,
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Internal server error", detail: e.message });
  }
}
