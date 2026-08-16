// Endpoint publik (read-only) yang dipakai halaman tamu untuk mengambil
// pengaturan situs + daftar template terbaru dari database.
const { getSiteConfig, listTemplates } = require("../../lib/db");
const defaultConfig = require("../../lib/config");

export default async function handler(req, res) {
    if (req.method !== "GET") {
          return res.status(405).json({ error: "Method not allowed" });
    }
    try {
          const eventSlug = req.query.event || defaultConfig.eventSlug;
          const [site, templates] = await Promise.all([getSiteConfig(eventSlug), listTemplates(eventSlug)]);
          const { adminKey, ...publicSite } = site;
          return res.status(200).json({ site: publicSite, templates });
    } catch (err) {
          console.error(err);
          return res.status(500).json({ error: err.message || "Server error" });
    }
}
