const { saveGuest, listGuests, getSiteConfig } = require("../../lib/db");
const defaultConfig = require("../../lib/config");

export const config_ = {
        api: {
                  bodyParser: {
                              sizeLimit: "20mb",
                  },
        },
};
export { config_ as config };

export default async function handler(req, res) {
        try {
                  if (req.method === "POST") {
                              const { name, templateId, photoDataUrl, voiceNoteDataUrl, message, event } = req.body || {};
                              const eventSlug = event || defaultConfig.eventSlug;
                              if (!name || !templateId || !photoDataUrl) {
                                            return res.status(400).json({ error: "Data tidak lengkap" });
                              }
                              const entry = await saveGuest({
                                            eventSlug,
                                            name,
                                            templateId,
                                            photoDataUrl,
                                            voiceNoteDataUrl: voiceNoteDataUrl || null,
                                            message: message || null,
                              });
                              return res.status(200).json({ ok: true, entry });
                  }

          if (req.method === "GET") {
                      const { key, event } = req.query;
                      const eventSlug = event || defaultConfig.eventSlug;
                      const site = await getSiteConfig(eventSlug);
                      if (key !== site.adminKey) {
                                    return res.status(401).json({ error: "Unauthorized" });
                      }
                      const guests = await listGuests(eventSlug);
                      return res.status(200).json({ guests });
          }

          res.status(405).json({ error: "Method not allowed" });
        } catch (err) {
                  console.error(err);
                  res.status(500).json({ error: err.message || "Server error" });
        }
}
