const { listTemplates, saveTemplate, deleteTemplate, getSiteConfig } = require("../../../lib/db");
const defaultConfig = require("../../../lib/config");

export default async function handler(req, res) {
    try {
          const eventSlug = (req.method === "GET" ? req.query.event : req.body.event) || defaultConfig.eventSlug;
          const key = req.method === "GET" ? req.query.key : req.body.key;

      const site = await getSiteConfig(eventSlug);
          if (key !== site.adminKey) {
                  return res.status(401).json({ error: "Unauthorized" });
          }

      if (req.method === "GET") {
              const templates = await listTemplates(eventSlug);
              return res.status(200).json({ templates });
      }

      if (req.method === "POST" || req.method === "PUT") {
              const { key: _key, event: _event, ...template } = req.body || {};
              if (!template.name) {
                        return res.status(400).json({ error: "Nama template wajib diisi" });
              }
              const saved = await saveTemplate(eventSlug, template);
              return res.status(200).json({ ok: true, template: saved });
      }

      if (req.method === "DELETE") {
              const { id } = req.body || {};
              if (!id) return res.status(400).json({ error: "id wajib diisi" });
              await deleteTemplate(eventSlug, id);
              return res.status(200).json({ ok: true });
      }

      return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
          console.error(err);
          return res.status(500).json({ error: err.message || "Server error" });
    }
}
