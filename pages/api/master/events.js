// API dashboard master — daftar semua pengantin (event) + bikin pengantin baru.
// Dipakai oleh pages/master-admin.js. Terpisah dari adminKey per-acara karena ini
// level "pemilik platform", bukan level satu acara.

const { listEvents, createEvent } = require("../../../lib/db");

// GANTI key ini via env var MASTER_ADMIN_KEY di Vercel sebelum publish beneran!
// Kalau env var tidak di-set, fallback ke default ini (hanya untuk testing).
const MASTER_KEY = process.env.MASTER_ADMIN_KEY || "master-photobooth-2026";

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default async function handler(req, res) {
  try {
    const key = req.method === "GET" ? req.query.key : req.body.key;
    if (key !== MASTER_KEY) {
      return res.status(401).json({ error: "Master key salah." });
    }

    if (req.method === "GET") {
      const events = await listEvents();
      return res.status(200).json({ events });
    }

    if (req.method === "POST") {
      const { coupleName, weddingDate, venue } = req.body || {};
      let { slug } = req.body || {};
      slug = slug ? slugify(slug) : slugify(coupleName);
      if (!slug) {
        return res.status(400).json({ error: "Nama pasangan atau slug wajib diisi." });
      }
      if (!coupleName || !String(coupleName).trim()) {
        return res.status(400).json({ error: "Nama pasangan wajib diisi." });
      }
      const created = await createEvent(slug, { coupleName, weddingDate, venue });
      return res.status(200).json({ ok: true, eventSlug: slug, site: created });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    if (err.code === "SLUG_TAKEN") {
      return res.status(409).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
