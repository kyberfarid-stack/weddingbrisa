const { getHomepageContent, saveHomepageContent, getSiteConfig } = require("../../../lib/db");
const defaultConfig = require("../../../lib/config");

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

export default async function handler(req, res) {
  try {
    const eventSlug = (req.method === "GET" ? req.query.event : req.body.event) || defaultConfig.eventSlug;
    const key = req.method === "GET" ? req.query.key : req.body.key;

    const site = await getSiteConfig(eventSlug);
    if (key !== site.adminKey) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      const blocks = await getHomepageContent(eventSlug);
      return res.status(200).json({ blocks });
    }

    if (req.method === "POST") {
      const { blocks } = req.body || {};
      if (!Array.isArray(blocks)) {
        return res.status(400).json({ error: "blocks wajib berupa array" });
      }
      const saved = await saveHomepageContent(eventSlug, blocks);
      return res.status(200).json({ ok: true, blocks: saved });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
