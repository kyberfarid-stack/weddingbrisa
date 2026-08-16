const { uploadAsset, getSiteConfig } = require("../../../lib/db");
const defaultConfig = require("../../../lib/config");

export const config = {
    api: {
          bodyParser: {
                  sizeLimit: "15mb",
          },
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
    }
    try {
          const { key, dataUrl, folder, event } = req.body || {};
          const eventSlug = event || defaultConfig.eventSlug;
          const site = await getSiteConfig(eventSlug);
          if (key !== site.adminKey) {
                  return res.status(401).json({ error: "Unauthorized" });
          }
          if (!dataUrl) {
                  return res.status(400).json({ error: "dataUrl wajib diisi" });
          }
          const url = await uploadAsset(eventSlug, dataUrl, folder || "assets");
          return res.status(200).json({ ok: true, url });
    } catch (err) {
          console.error(err);
          return res.status(500).json({ error: err.message || "Server error" });
    }
}
