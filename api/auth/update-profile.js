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
    const { username, family_context } = req.body || {};
    if (!username) return res.status(400).json({ error: "username required" });

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return res.status(500).json({ error: "Server configuration error" });

    const key = `user:${username.toLowerCase()}`;
    const result = await redis(url, token, ["GET", key]);
    if (!result.result) return res.status(404).json({ error: "User not found" });

    const userData = JSON.parse(result.result);
    if (family_context !== undefined) userData.family_context = family_context;

    await redis(url, token, ["SET", key, JSON.stringify(userData)]);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Internal server error", detail: e.message });
  }
}
