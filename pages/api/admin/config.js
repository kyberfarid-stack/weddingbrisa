const { getSiteConfig, saveSiteConfig } = require("../../../lib/db");
const defaultConfig = require("../../../lib/config");

export default async function handler(req, res) {
    try {
          const eventSlug = (req.method === "GET" ? req.query.event : req.body.event) || defaultConfig.eventSlug;
          const key = req.method === "GET" ? req.query.key : req.body.key;

      const current = await getSiteConfig(eventSlug);
          if (key !== current.adminKey) {
                  return res.status(401).json({ error: "Unauthorized" });
          }

      if (req.method === "GET") {
              return res.status(200).json({ site: current });
      }

      if (req.method === "POST") {
              const { key: _key, event: _event, ...patch } = req.body || {};
              const updated = await saveSiteConfig(eventSlug, patch);
              return res.status(200).json({ ok: true, site: updated });
      }

      return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
          console.error(err);
          return res.status(500).json({ error: err.message || "Server error" });
    }
}
