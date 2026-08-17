// Abstraksi penyimpanan data (tamu, template, pengaturan situs).
// - Kalau env SUPABASE_URL & SUPABASE_SERVICE_KEY di-set -> pakai Supabase (persisten, gratis, cocok untuk publish).
// - Kalau tidak -> fallback simpan ke file lokal data/*.json (HANYA untuk testing lokal / dev,
//   TIDAK persisten kalau di-deploy ke Vercel karena filesystem serverless bersifat sementara).

const fs = require("fs");
const path = require("path");
const defaultConfig = require("./config");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  const { createClient } = require("@supabase/supabase-js");
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = path.join(DATA_DIR, "guests.json");
const LOCAL_TEMPLATES_PATH = path.join(DATA_DIR, "templates.json");
const LOCAL_CONFIG_PATH = path.join(DATA_DIR, "site_config.json");
const LOCAL_HOMEPAGE_PATH = path.join(DATA_DIR, "homepage_content.json");

function ensureLocalFile(filePath, defaultContent) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
}

function readLocalJson(filePath, defaultContent) {
  ensureLocalFile(filePath, defaultContent);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeLocalJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------
// Guests
// ---------------------------------------------------------------------

async function saveGuest({ eventSlug, name, templateId, photoDataUrl, voiceNoteDataUrl, message }) {
  const createdAt = new Date().toISOString();

  if (supabase) {
    const base64Data = photoDataUrl.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `${eventSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("photobooth")
      .upload(fileName, buffer, { contentType: "image/jpeg" });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from("photobooth").getPublicUrl(fileName);

    let voiceUrl = null;
    if (voiceNoteDataUrl) {
      const voiceBase64 = voiceNoteDataUrl.split(",")[1];
      const voiceBuffer = Buffer.from(voiceBase64, "base64");
      const voiceFileName = `${eventSlug}/voice/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webm`;
      const { error: voiceUploadError } = await supabase.storage
        .from("photobooth")
        .upload(voiceFileName, voiceBuffer, { contentType: "audio/webm" });
      if (!voiceUploadError) {
        const { data: voicePublicUrlData } = supabase.storage.from("photobooth").getPublicUrl(voiceFileName);
        voiceUrl = voicePublicUrlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from("guests").insert({
      event_slug: eventSlug,
      name,
      template_id: templateId,
      photo_url: publicUrlData.publicUrl,
      voice_url: voiceUrl,
      message: message || null,
      created_at: createdAt,
    });
    if (insertError) throw insertError;

    return { name, templateId, photoUrl: publicUrlData.publicUrl, voiceUrl, message: message || null, createdAt };
  }

  const all = readLocalJson(LOCAL_DB_PATH, []);
  const entry = {
    eventSlug,
    name,
    templateId,
    photoDataUrl,
    voiceNoteDataUrl: voiceNoteDataUrl || null,
    message: message || null,
    createdAt,
  };
  all.push(entry);
  writeLocalJson(LOCAL_DB_PATH, all);
  return entry;
}

async function listGuests(eventSlug) {
  if (supabase) {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("event_slug", eventSlug)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((d) => ({
      name: d.name,
      templateId: d.template_id,
      photoUrl: d.photo_url,
      voiceUrl: d.voice_url || null,
      message: d.message || null,
      createdAt: d.created_at,
    }));
  }

  const all = readLocalJson(LOCAL_DB_PATH, []);
  return all
    .filter((g) => g.eventSlug === eventSlug)
    .reverse()
    .map((g) => ({
      name: g.name,
      templateId: g.templateId,
      photoUrl: g.photoDataUrl,
      voiceUrl: g.voiceNoteDataUrl || null,
      message: g.message || null,
      createdAt: g.createdAt,
    }));
}

// ---------------------------------------------------------------------
// Asset upload (dipakai admin untuk upload background/overlay/hero image)
// ---------------------------------------------------------------------

async function uploadAsset(eventSlug, dataUrl, folder) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl);
  const contentType = match ? match[1] : "image/png";
  const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
  const base64Data = dataUrl.split(",")[1];
  const buffer = Buffer.from(base64Data, "base64");
  const fileName = `${eventSlug}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  if (supabase) {
    const { error: uploadError } = await supabase.storage
      .from("photobooth")
      .upload(fileName, buffer, { contentType, upsert: true });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage.from("photobooth").getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  }

  const localAssetsDir = path.join(process.cwd(), "public", "uploads", eventSlug, folder);
  if (!fs.existsSync(localAssetsDir)) fs.mkdirSync(localAssetsDir, { recursive: true });
  const localFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(localAssetsDir, localFileName), buffer);
  return `/uploads/${eventSlug}/${folder}/${localFileName}`;
}

// ---------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------

function defaultTemplates() {
  return defaultConfig.templates.map((t, i) => ({
    id: t.id,
    templateKey: t.id,
    name: t.name,
    backgroundUrl: null,
    overlayUrl: null,
    backgroundColor: t.background,
    textColor: t.textColor,
    accent: t.accent,
    sortOrder: i,
    // bgFitMode "auto" = canvas ikut rasio asli background (perilaku lama, tidak
    // pernah crop). "crop" = canvas tetap sesuai jumlah foto, background di-crop
    // vertikal mengikuti cropAnchor — dipakai kalau 1 background didesain tinggi
    // (misal buat strip 1x3) tapi mau dipakai juga buat 1x1/1x2.
    bgFitMode: "auto",
    cropAnchor: "bottom",
    // Aksen dekoratif "roll film" (rel gelap + lubang perforasi) di sisi kiri-kanan.
    filmRail: false,
  }));
}

async function listTemplates(eventSlug) {
  // Template bawaan (default) hanya dipakai sebagai "pengganti sementara" untuk
  // template yang BELUM pernah disimpan sebagai baris database. Begitu salah satu
  // template bawaan diedit & disimpan (jadi baris asli), template bawaan LAIN yang
  // belum pernah disentuh tetap harus muncul juga — bukan cuma sampai tabel masih
  // kosong sepenuhnya. Makanya di sini kita gabung: baris asli dari database + sisa
  // template bawaan yang template_key-nya belum ada baris aslinya.
  if (supabase) {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("event_slug", eventSlug)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const dbRows = (data || []).map((t) => ({
      id: String(t.id),
      templateKey: t.template_key,
      name: t.name,
      backgroundUrl: t.background_url || null,
      overlayUrl: t.overlay_url || null,
      backgroundColor: t.background_color || "#ffffff",
      textColor: t.text_color || "#333333",
      accent: t.accent || "#d4af37",
      sortOrder: t.sort_order || 0,
      bgFitMode: t.bg_fit_mode || "auto",
      cropAnchor: t.crop_anchor || "bottom",
      filmRail: !!t.film_rail,
    }));
    const dbKeys = new Set(dbRows.map((t) => t.templateKey));
    const missingDefaults = defaultTemplates().filter((t) => !dbKeys.has(t.templateKey));
    return [...dbRows, ...missingDefaults].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const all = readLocalJson(LOCAL_TEMPLATES_PATH, []);
  const forEvent = all.filter((t) => t.eventSlug === eventSlug);
  const localKeys = new Set(forEvent.map((t) => t.templateKey));
  const missingDefaults = defaultTemplates().filter((t) => !localKeys.has(t.templateKey));
  return [...forEvent, ...missingDefaults].sort((a, b) => a.sortOrder - b.sortOrder);
}

async function saveTemplate(eventSlug, template) {
  // Template bawaan (default) punya id string seperti "polaroid-putih" yang TIDAK
  // pernah benar-benar tersimpan sebagai baris di database — itu cuma fallback saat
  // tabel masih kosong. Kalau admin edit template bawaan itu, id-nya bukan id baris
  // asli, jadi harus di-INSERT (baris baru), bukan di-UPDATE (yang akan silently
  // no-op karena tidak ada baris dengan id itu, membuat perubahan terlihat "tersimpan"
  // padahal tidak pernah masuk database).
  const isRealDbId = supabase
    ? template.id != null && /^\d+$/.test(String(template.id))
    : template.id != null && String(template.id).startsWith("local-");

  if (supabase) {
    const row = {
      event_slug: eventSlug,
      template_key: template.templateKey || template.name.toLowerCase().replace(/\s+/g, "-"),
      name: template.name,
      background_url: template.backgroundUrl || null,
      overlay_url: template.overlayUrl || null,
      background_color: template.backgroundColor || "#ffffff",
      text_color: template.textColor || "#333333",
      accent: template.accent || "#d4af37",
      sort_order: template.sortOrder || 0,
      bg_fit_mode: template.bgFitMode || "auto",
      crop_anchor: template.cropAnchor || "bottom",
      film_rail: !!template.filmRail,
    };
    if (isRealDbId) {
      const { error } = await supabase.from("templates").update(row).eq("id", template.id);
      if (error) throw error;
      return { ...template, id: template.id };
    }
    const { data, error } = await supabase.from("templates").insert(row).select().single();
    if (error) throw error;
    return { ...template, id: String(data.id) };
  }

  const all = readLocalJson(LOCAL_TEMPLATES_PATH, []);
  if (isRealDbId) {
    const idx = all.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...template, eventSlug };
      writeLocalJson(LOCAL_TEMPLATES_PATH, all);
      return all[idx];
    }
  }
  const newTemplate = { ...template, id: `local-${Date.now()}`, eventSlug };
  all.push(newTemplate);
  writeLocalJson(LOCAL_TEMPLATES_PATH, all);
  return newTemplate;
}

async function deleteTemplate(eventSlug, id) {
  if (supabase) {
    const { error } = await supabase.from("templates").delete().eq("id", id).eq("event_slug", eventSlug);
    if (error) throw error;
    return;
  }
  const all = readLocalJson(LOCAL_TEMPLATES_PATH, []);
  writeLocalJson(
    LOCAL_TEMPLATES_PATH,
    all.filter((t) => t.id !== id)
  );
}

// ---------------------------------------------------------------------
// Site config
// ---------------------------------------------------------------------

function defaultSiteConfig() {
  return {
    coupleName: defaultConfig.coupleName,
    weddingDate: defaultConfig.weddingDate,
    venue: defaultConfig.venue,
    welcomeMessage: defaultConfig.welcomeMessage,
    thankYouMessage: defaultConfig.thankYouMessage,
    heroImageUrl: null,
    kickerText: "Virtual Photobooth",
    entryLabel: "Untuk Sdr/Sdi",
    messageLabel: "Tinggalkan kesanmu di sini (opsional)",
    startButtonLabel: "Mulai Photobooth",
    fontHeading: "'Great Vibes', cursive",
    fontBody: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    galleryEnabled: true,
    adminKey: defaultConfig.adminKey,
    theme: defaultConfig.theme,
    // Gaya visual halaman pembuka tamu — lihat components/GuestCoverView.js
    // untuk daftar lengkap & tampilan tiap gaya.
    coverStyle: "luxury-minimal",
  };
}

async function getSiteConfig(eventSlug) {
  if (supabase) {
    const { data, error } = await supabase.from("site_config").select("*").eq("event_slug", eventSlug).maybeSingle();
    if (error) throw error;
    if (!data) return { eventSlug, ...defaultSiteConfig() };
    return {
      eventSlug,
      coupleName: data.couple_name || defaultConfig.coupleName,
      weddingDate: data.wedding_date || defaultConfig.weddingDate,
      venue: data.venue || defaultConfig.venue,
      welcomeMessage: data.welcome_message || defaultConfig.welcomeMessage,
      thankYouMessage: data.thank_you_message || defaultConfig.thankYouMessage,
      heroImageUrl: data.hero_image_url || null,
      kickerText: data.kicker_text || "Virtual Photobooth",
      entryLabel: data.entry_label || "Untuk Sdr/Sdi",
      messageLabel: data.message_label || "Tinggalkan kesanmu di sini (opsional)",
      startButtonLabel: data.start_button_label || "Mulai Photobooth",
      fontHeading: data.font_heading || "'Great Vibes', cursive",
      fontBody: data.font_body || "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      galleryEnabled: data.gallery_enabled === false ? false : true,
      adminKey: data.admin_key || defaultConfig.adminKey,
      theme: data.theme || defaultConfig.theme,
      coverStyle: data.cover_style || "luxury-minimal",
    };
  }

  const stored = readLocalJson(LOCAL_CONFIG_PATH, {});
  const cfg = stored[eventSlug];
  if (!cfg) return { eventSlug, ...defaultSiteConfig() };
  return { eventSlug, ...defaultSiteConfig(), ...cfg };
}

async function saveSiteConfig(eventSlug, patch) {
  if (supabase) {
    const row = {
      event_slug: eventSlug,
      couple_name: patch.coupleName,
      wedding_date: patch.weddingDate,
      venue: patch.venue,
      welcome_message: patch.welcomeMessage,
      thank_you_message: patch.thankYouMessage,
      hero_image_url: patch.heroImageUrl,
      kicker_text: patch.kickerText,
      entry_label: patch.entryLabel,
      message_label: patch.messageLabel,
      start_button_label: patch.startButtonLabel,
      font_heading: patch.fontHeading,
      font_body: patch.fontBody,
      gallery_enabled: patch.galleryEnabled,
      admin_key: patch.adminKey,
      theme: patch.theme,
      cover_style: patch.coverStyle,
    };
    Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
    const { error } = await supabase.from("site_config").upsert(row, { onConflict: "event_slug" });
    if (error) throw error;
    return getSiteConfig(eventSlug);
  }

  const stored = readLocalJson(LOCAL_CONFIG_PATH, {});
  stored[eventSlug] = { ...(stored[eventSlug] || {}), ...patch };
  writeLocalJson(LOCAL_CONFIG_PATH, stored);
  return getSiteConfig(eventSlug);
}

// ---------------------------------------------------------------------
// Homepage marketing (landing page) content — full block editor dari admin
// ---------------------------------------------------------------------

function defaultHomepageBlocks() {
  return [
    {
      id: "nav",
      type: "nav",
      visible: true,
      data: {
        brand: "Virtual Photobooth",
        items: [{ label: "Login Admin", href: "__admin__" }],
      },
    },
    {
      id: "hero",
      type: "hero",
      visible: true,
      data: {
        kicker: "Untuk Hari Bahagia Kamu",
        heading: "Photobooth Virtual, Tanpa Antre, Tanpa Ribet",
        paragraph:
          "Tamu scan barcode di kartu undangan, foto langsung dengan bingkai custom acara kamu, lalu bagikan ke sosial media dalam sekejap — semua lewat browser, tanpa install apa pun.",
        ctaPrimaryLabel: "Coba Demo",
        ctaPrimaryHref: "__demo__",
        ctaSecondaryLabel: "Login Admin",
        ctaSecondaryHref: "__admin__",
      },
    },
    {
      id: "features",
      type: "features",
      visible: true,
      data: {
        title: "Semua yang Kamu Butuh",
        subtitle: "Satu link, semua momen tamu tersimpan rapi",
        items: [
          { icon: "📷", title: "Scan & Check-in Instan", desc: "Tamu tinggal scan barcode di kartu undangan, isi nama, langsung masuk ke sesi photobooth virtual." },
          { icon: "🎨", title: "Template Custom", desc: "Upload background & bingkai sendiri — tiap acara bisa punya gaya visual yang beda." },
          { icon: "📱", title: "Siap Upload Sosmed", desc: "Hasil foto otomatis pas untuk dibagikan ke Instagram, WhatsApp, dan TikTok." },
          { icon: "🖼️", title: "Galeri Real-time", desc: "Semua momen tamu terkumpul otomatis di satu galeri yang bisa dilihat bersama." },
          { icon: "⚙️", title: "Dashboard Admin", desc: "Atur template, teks, warna, dan font acara kapan saja lewat panel admin — lengkap dengan pratinjau langsung." },
          { icon: "🔒", title: "Aman & Privat", desc: "Data tamu tersimpan aman dan hanya bisa diakses lewat admin key acara kamu." },
        ],
      },
    },
    {
      id: "portfolio",
      type: "portfolio",
      visible: true,
      data: {
        title: "Contoh Hasil Photobooth",
        subtitle: "Strip foto otomatis rapi, siap dibagikan ke sosmed",
        items: [
          { image: null, color1: "#7a1f2b", color2: "#4a0f18", caption: "Brisa & Nanta" },
          { image: null, color1: "#1a1a1a", color2: "#3a2f10", caption: "Brisa & Nanta" },
          { image: null, color1: "#2b3a55", color2: "#141b28", caption: "Brisa & Nanta" },
        ],
      },
    },
    {
      id: "articles",
      type: "articles",
      visible: true,
      data: {
        title: "What's New",
        subtitle: "Pembaruan & tips terbaru",
        items: [
          { tag: "Update", title: "Bingkai custom kini bebas distorsi", desc: "Background & overlay sekarang otomatis menyesuaikan tanpa pernah stretch, walau tamu ambil 1–3 foto." },
          { tag: "Update", title: "Kamera lebih stabil", desc: "Sesi foto kini menunggu kamera benar-benar siap sebelum tombol jepret aktif — tidak ada lagi foto gelap/noise." },
          { tag: "Tips", title: "Cara desain bingkai photobooth", desc: "Gunakan rasio potret dan sisakan ruang kosong persegi di tengah untuk hasil terbaik, mengikuti strip klasik." },
        ],
      },
    },
    {
      id: "footer",
      type: "footer",
      visible: true,
      data: {
        text: "Virtual Photobooth — dibuat untuk momen pernikahan kamu.",
        linkLabel: "Masuk sebagai admin →",
        linkHref: "__admin__",
      },
    },
  ];
}

async function getHomepageContent(eventSlug) {
  if (supabase) {
    const { data, error } = await supabase
      .from("homepage_content")
      .select("*")
      .eq("event_slug", eventSlug)
      .maybeSingle();
    if (error) throw error;
    if (!data || !Array.isArray(data.blocks) || data.blocks.length === 0) return defaultHomepageBlocks();
    return data.blocks;
  }

  const stored = readLocalJson(LOCAL_HOMEPAGE_PATH, {});
  const blocks = stored[eventSlug];
  if (!Array.isArray(blocks) || blocks.length === 0) return defaultHomepageBlocks();
  return blocks;
}

async function saveHomepageContent(eventSlug, blocks) {
  if (supabase) {
    const { error } = await supabase
      .from("homepage_content")
      .upsert({ event_slug: eventSlug, blocks, updated_at: new Date().toISOString() }, { onConflict: "event_slug" });
    if (error) throw error;
    return blocks;
  }

  const stored = readLocalJson(LOCAL_HOMEPAGE_PATH, {});
  stored[eventSlug] = blocks;
  writeLocalJson(LOCAL_HOMEPAGE_PATH, stored);
  return blocks;
}

// ---------------------------------------------------------------------
// Master events (dashboard "semua pengantin") — dipakai di /master-admin
// untuk lihat semua acara yang pernah dibuat + link-nya, dan buat acara baru.
// ---------------------------------------------------------------------

async function listEvents() {
  if (supabase) {
    const { data, error } = await supabase
      .from("site_config")
      .select("event_slug, couple_name, wedding_date, venue, cover_style, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((d) => ({
      eventSlug: d.event_slug,
      coupleName: d.couple_name || d.event_slug,
      weddingDate: d.wedding_date || "",
      venue: d.venue || "",
      coverStyle: d.cover_style || "luxury-minimal",
      createdAt: d.created_at || null,
    }));
  }

  const stored = readLocalJson(LOCAL_CONFIG_PATH, {});
  return Object.keys(stored).map((eventSlug) => ({
    eventSlug,
    coupleName: stored[eventSlug].coupleName || eventSlug,
    weddingDate: stored[eventSlug].weddingDate || "",
    venue: stored[eventSlug].venue || "",
    coverStyle: stored[eventSlug].coverStyle || "luxury-minimal",
    createdAt: null,
  }));
}

// Bikin acara (pengantin) baru: slug harus unik & belum pernah dipakai.
// Isi awal-nya sama seperti defaultSiteConfig, ditimpa dengan yang diisi di form.
async function createEvent(eventSlug, { coupleName, weddingDate, venue }) {
  const existing = await getSiteConfig(eventSlug);
  const alreadyExists = supabase
    ? await (async () => {
        const { data } = await supabase.from("site_config").select("event_slug").eq("event_slug", eventSlug).maybeSingle();
        return !!data;
      })()
    : (() => {
        const stored = readLocalJson(LOCAL_CONFIG_PATH, {});
        return !!stored[eventSlug];
      })();

  if (alreadyExists) {
    const err = new Error("Slug ini sudah dipakai acara lain, coba slug lain.");
    err.code = "SLUG_TAKEN";
    throw err;
  }

  return saveSiteConfig(eventSlug, {
    coupleName: coupleName || existing.coupleName,
    weddingDate: weddingDate || existing.weddingDate,
    venue: venue || existing.venue,
  });
}

module.exports = {
  saveGuest,
  listGuests,
  uploadAsset,
  listTemplates,
  saveTemplate,
  deleteTemplate,
  getSiteConfig,
  saveSiteConfig,
  defaultHomepageBlocks,
  getHomepageContent,
  saveHomepageContent,
  listEvents,
  createEvent,
  usingSupabase: !!supabase,
};
