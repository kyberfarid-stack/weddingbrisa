// Endpoint publik (read-only, terbatas) untuk galeri tamu di halaman hasil foto.
// Hanya expose foto + nama + voice note -- TIDAK ada data sensitif -- dan bisa
// dimatikan oleh admin lewat toggle "Tampilkan galeri tamu".
const { listGuests, getSiteConfig } = require("../../lib/db");
const defaultConfig = require("../../lib/config");

export default async function handler(req, res) {
    if (req.method !== "GET") {
          return res.status(405).json({ error: "Method not allowed" });
    }
    try {
          const eventSlug = req.query.event || defaultConfig.eventSlug;
          const site = await getSiteConfig(eventSlug);
          if (!site.galleryEnabled) {
                  return res.status(200).json({ guests: [] });
          }
          const guests = await listGuests(eventSlug);
          const publicGuests = guests.map((g) => ({
                  name: g.name,
                  photoUrl: g.photoUrl,
                  voiceUrl: g.voiceUrl || null,
          }));
          return res.status(200).json({ guests: publicGuests });
    } catch (err) {
          console.error(err);
          return res.status(500).json({ error: err.message || "Server error" });
    }
}
