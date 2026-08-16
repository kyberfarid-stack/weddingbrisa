const { saveGuest, listGuests } = require("../../lib/db");
const config = require("../../lib/config");

export const config_ = {
    api: {
          bodyParser: {
                  sizeLimit: "8mb",
          },
    },
};
export { config_ as config };

export default async function handler(req, res) {
    try {
          if (req.method === "POST") {
                  const { name, templateId, photoDataUrl } = req.body || {};
                  if (!name || !templateId || !photoDataUrl) {
                            return res.status(400).json({ error: "Data tidak lengkap" });
                  }
                  const entry = await saveGuest({
                            eventSlug: config.eventSlug,
                            name,
                            templateId,
                            photoDataUrl,
                  });
                  return res.status(200).json({ ok: true, entry });
          }

      if (req.method === "GET") {
              const { key } = req.query;
              if (key !== config.adminKey) {
                        return res.status(401).json({ error: "Unauthorized" });
              }
              const guests = await listGuests(config.eventSlug);
              return res.status(200).json({ guests });
      }

      res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
          console.error(err);
          res.status(500).json({ error: err.message || "Server error" });
    }
}
