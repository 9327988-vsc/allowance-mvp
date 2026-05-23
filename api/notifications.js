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
      const { family_code, member_id, notification } = req.body || {};
      if (!family_code || !member_id || !notification) {
        return res.status(400).json({ error: "family_code, member_id, notification required" });
      }
      const key = `notif:${family_code}:${member_id}`;
      const existing = await redis(url, token, ["GET", key]);
      const list = existing.result ? JSON.parse(existing.result) : [];
      list.unshift({ ...notification, id: `sn_${Date.now()}`, created_at: new Date().toISOString(), read: false });
      const trimmed = list.slice(0, 50);
      await redis(url, token, ["SET", key, JSON.stringify(trimmed), "EX", 2592000]);
      return res.status(201).json({ success: true });
    }

    if (req.method === "GET") {
      const { family_code, member_id } = req.query || {};
      if (!family_code || !member_id) {
        return res.status(400).json({ error: "family_code and member_id required" });
      }
      const key = `notif:${family_code}:${member_id}`;
      const result = await redis(url, token, ["GET", key]);
      const list = result.result ? JSON.parse(result.result) : [];
      return res.status(200).json({ notifications: list });
    }

    if (req.method === "DELETE") {
      const { family_code, member_id } = req.query || {};
      if (!family_code || !member_id) {
        return res.status(400).json({ error: "family_code and member_id required" });
      }
      const key = `notif:${family_code}:${member_id}`;
      await redis(url, token, ["DEL", key]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error", detail: e.message });
  }
}
