async function redis(url, token, cmd) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  return res.json();
}

export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(500).json({ error: "Server configuration error" });

  try {
    if (req.method === "POST") {
      const { type, key, entries } = req.body || {};
      if (!type || !key || !entries) {
        return res.status(400).json({ error: "type, key, entries required" });
      }
      const redisKey = `sync:${type}:${key}`;
      await redis(url, token, ["SET", redisKey, JSON.stringify(entries), "EX", 7776000]);
      return res.status(200).json({ success: true, count: Object.keys(entries).length });
    }

    if (req.method === "GET") {
      const { type, key } = req.query || {};
      if (!type || !key) {
        return res.status(400).json({ error: "type and key required" });
      }
      const redisKey = `sync:${type}:${key}`;
      const result = await redis(url, token, ["GET", redisKey]);
      const entries = result.result ? JSON.parse(result.result) : null;
      return res.status(200).json({ entries });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error", detail: e.message });
  }
}
