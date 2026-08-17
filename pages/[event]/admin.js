import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import HomepageView from "../../components/HomepageView";
import GuestCoverView, { COVER_STYLES } from "../../components/GuestCoverView";
import { compressFile } from "../../lib/compressImage";

export default function Admin() {
  const router = useRouter();
  const { event } = router.query;
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("guests");
  const [guestUrl, setGuestUrl] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("adminKey");
    if (saved) {
      setKey(saved);
      tryLogin(saved);
    }
    if (typeof window !== "undefined" && event) {
      setGuestUrl(`${window.location.origin}/${event}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  async function tryLogin(k) {
    setError("");
    if (!event) return;
    try {
      const res = await fetch(`/api/admin/config?event=${event}&key=${encodeURIComponent(k)}`);
      if (!res.ok) {
        setError("Admin key salah.");
        return;
      }
      sessionStorage.setItem("adminKey", k);
      setAuthed(true);
    } catch (e) {
      setError("Gagal terhubung ke server.");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("adminKey");
    setAuthed(false);
    setKey("");
  }

  if (!authed) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card">
          <div className="admin-login-brand">Virtual Photobooth</div>
          <h1>Admin Login</h1>
          <p className="subtitle">Masuk untuk atur template, tamu, dan tampilan acara kamu.</p>
          <input
            type="text"
            placeholder="Masukkan admin key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryLogin(key)}
          />
          <button onClick={() => tryLogin(key)}>Masuk</button>
          {error && <p style={{ color: "#ff8a8a", fontSize: "0.85rem", marginTop: 12 }}>{error}</p>}
          <a className="admin-login-back" href="/">
            ← Kembali ke beranda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-shell-header">
        <div className="admin-shell-header-inner">
          <div>
            <h1>Admin Panel</h1>
            {guestUrl && (
              <p className="footer-note">
                URL tamu: <a href={guestUrl} target="_blank" rel="noreferrer">{guestUrl}</a>
              </p>
            )}
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </div>

      <div className="admin-wrap" style={{ paddingTop: 24 }}>
        <div className="admin-tabs">
          <button className={tab === "guests" ? "tab-active" : ""} onClick={() => setTab("guests")}>
            <span className="admin-tab-icon">👥</span> Daftar Tamu
          </button>
          <button className={tab === "templates" ? "tab-active" : ""} onClick={() => setTab("templates")}>
            <span className="admin-tab-icon">🎨</span> Template
          </button>
          <button className={tab === "homepage" ? "tab-active" : ""} onClick={() => setTab("homepage")}>
            <span className="admin-tab-icon">🏠</span> Homepage
          </button>
          <button className={tab === "settings" ? "tab-active" : ""} onClick={() => setTab("settings")}>
            <span className="admin-tab-icon">⚙️</span> Pengaturan Situs
          </button>
        </div>

        <div className="admin-body">
          {tab === "guests" && <GuestsTab event={event} adminKey={key} />}
          {tab === "templates" && <TemplatesTab event={event} adminKey={key} />}
          {tab === "homepage" && <HomepageTab event={event} adminKey={key} />}
          {tab === "settings" && <SettingsTab event={event} adminKey={key} />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tab: Daftar Tamu
// ---------------------------------------------------------------------

function GuestsTab({ event, adminKey }) {
  const [guests, setGuests] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  async function load() {
    if (!event) return;
    setLoadError("");
    try {
      const res = await fetch(`/api/guests?key=${encodeURIComponent(adminKey)}&event=${event}`);
      if (!res.ok) {
        setLoadError("Gagal memuat daftar tamu.");
        return;
      }
      const data = await res.json();
      setGuests(data.guests);
    } catch (e) {
      setLoadError("Gagal memuat daftar tamu.");
    }
  }

  if (loadError) return <p style={{ color: "#a33" }}>{loadError}</p>;
  if (!guests) return <p>Memuat...</p>;

  return (
    <div>
      <p className="subtitle" style={{ margin: "0 0 12px" }}>
        {guests.length} tamu sudah upload foto
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nama</th>
              <th>Template</th>
              <th>Kesan</th>
              <th>Pesan Suara</th>
              <th>Waktu</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g, i) => (
              <tr key={i}>
                <td>
                  <img src={g.photoUrl} className="guest-photo-thumb" alt={g.name} loading="lazy" decoding="async" />
                </td>
                <td>{g.name}</td>
                <td>{g.templateId}</td>
                <td style={{ maxWidth: 200 }}>{g.message || <span style={{ color: "#bbb" }}>-</span>}</td>
                <td>
                  {g.voiceUrl ? (
                    <audio controls src={g.voiceUrl} style={{ width: 160, height: 32 }} />
                  ) : (
                    <span style={{ color: "#bbb" }}>-</span>
                  )}
                </td>
                <td>{new Date(g.createdAt).toLocaleString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tab: Template
// ---------------------------------------------------------------------

const HEADING_FONTS = [
  { label: "Great Vibes (script elegan)", value: "'Great Vibes', cursive" },
  { label: "Dancing Script (script santai)", value: "'Dancing Script', cursive" },
  { label: "Playfair Display (serif klasik)", value: "'Playfair Display', serif" },
  { label: "Poppins (modern)", value: "'Poppins', sans-serif" },
];

const BODY_FONTS = [
  { label: "Segoe UI (default)", value: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Lora", value: "'Lora', serif" },
];

const emptyTemplate = {
  id: null,
  name: "",
  templateKey: "",
  backgroundUrl: "",
  overlayUrl: "",
  backgroundColor: "#ffffff",
  textColor: "#333333",
  accent: "#d4af37",
  sortOrder: 0,
  // bgFitMode "auto" = perilaku lama, canvas ikut tinggi gambar background
  // apa adanya (tidak pernah di-crop). "crop" = canvas dibatasi setinggi
  // jumlah foto yang dipilih tamu, background di-crop vertikal mengikuti
  // cropAnchor — supaya 1 gambar background tinggi (misal desain 1x3) bisa
  // dipakai ulang buat hasil 1 foto tanpa background jadi gepeng/stretch.
  bgFitMode: "auto",
  cropAnchor: "bottom",
  filmRail: false,
};

function TemplatesTab({ event, adminKey }) {
  const [templates, setTemplates] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  async function load() {
    if (!event) return;
    const res = await fetch(`/api/admin/templates?event=${event}&key=${encodeURIComponent(adminKey)}`);
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates);
    }
  }

  async function uploadImage(file, onDone) {
    setStatus("Mengompres & mengupload gambar...");
    try {
      const dataUrl = await compressFile(file, { maxDim: 2200, quality: 0.85 });
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, event, dataUrl, folder: "templates" }),
      });
      const data = await res.json();
      if (res.ok) {
        onDone(data.url);
        setStatus("");
      } else {
        setStatus("Gagal upload: " + (data.error || ""));
      }
    } catch (e) {
      setStatus("Gagal upload gambar.");
    }
  }

  async function handleSave() {
    if (!editing.name) {
      setStatus("Nama template wajib diisi.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, event, ...editing }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditing(null);
        load();
      } else {
        setStatus("Gagal simpan: " + (data.error || ""));
      }
    } catch (e) {
      setStatus("Gagal simpan template.");
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm("Hapus template ini?")) return;
    await fetch("/api/admin/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: adminKey, event, id }),
    });
    load();
  }

  if (!templates) return <p>Memuat...</p>;

  if (editing) {
    return (
      <div>
        <h2 style={{ fontSize: "1.1rem" }}>{editing.id ? "Edit Template" : "Template Baru"}</h2>

        <label className="field-label">Nama Template</label>
        <input
          type="text"
          value={editing.name}
          onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          placeholder="Contoh: Maroon Elegan"
        />

        <label className="field-label">Warna Aksen</label>
        <input
          type="text"
          value={editing.accent}
          onChange={(e) => setEditing({ ...editing, accent: e.target.value })}
          placeholder="#d4af37"
        />

        <label className="field-label">Background (gambar penuh di belakang foto)</label>
        {editing.backgroundUrl && (
          <img src={editing.backgroundUrl} className="admin-preview-img" alt="background" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0], (url) => setEditing((cur) => ({ ...cur, backgroundUrl: url })))}
        />

        <label className="field-label" style={{ marginTop: 16 }}>
          Overlay / Bingkai PNG (transparan, digambar di atas foto tamu)
        </label>
        {editing.overlayUrl && <img src={editing.overlayUrl} className="admin-preview-img" alt="overlay" />}
        <input
          type="file"
          accept="image/png"
          onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0], (url) => setEditing((cur) => ({ ...cur, overlayUrl: url })))}
        />

        <label className="field-label" style={{ marginTop: 16 }}>
          Mode Background/Overlay
        </label>
        <select
          value={editing.bgFitMode || "auto"}
          onChange={(e) => setEditing({ ...editing, bgFitMode: e.target.value })}
          style={{ marginBottom: 4, width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #e5ddd0" }}
        >
          <option value="auto">Auto (tinggi canvas ikut gambar, tidak pernah dipotong)</option>
          <option value="crop">Crop (tinggi canvas ikut jumlah foto, gambar dipotong biar tidak stretch)</option>
        </select>
        <p className="hp-tip">
          Pakai "Crop" kalau mau 1 gambar background tinggi (desain 3 foto) dipakai ulang buat hasil 1 foto — bagian yang kelihatan diatur di bawah.
        </p>

        {editing.bgFitMode === "crop" && (
          <>
            <label className="field-label">Titik Potong Gambar</label>
            <select
              value={editing.cropAnchor || "bottom"}
              onChange={(e) => setEditing({ ...editing, cropAnchor: e.target.value })}
              style={{ marginBottom: 16, width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #e5ddd0" }}
            >
              <option value="top">Atas (potong dari bawah, bagian atas gambar tetap kelihatan)</option>
              <option value="center">Tengah</option>
              <option value="bottom">Bawah (potong dari atas, bagian bawah/kredit tetap kelihatan)</option>
            </select>
          </>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={!!editing.filmRail}
            onChange={(e) => setEditing({ ...editing, filmRail: e.target.checked })}
            style={{ width: "auto", marginBottom: 0 }}
          />
          <span>Aksen roll film di pinggir kiri-kanan (otomatis digambar, bikin potongan tidak kelihatan janggal)</span>
        </label>

        {status && <p className="footer-note">{status}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
          <button className="btn-secondary" onClick={() => setEditing(null)}>
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setEditing({ ...emptyTemplate })} style={{ marginBottom: 16 }}>
        + Tambah Template
      </button>
      <div className="admin-template-list">
        {templates.map((t) => (
          <div className="admin-template-card" key={t.id}>
            <div className="admin-template-thumb" style={{ background: t.backgroundColor || "#eee" }}>
              {t.backgroundUrl && <img src={t.backgroundUrl} alt={t.name} loading="lazy" decoding="async" />}
              {t.overlayUrl && <img src={t.overlayUrl} alt="" className="admin-template-overlay" loading="lazy" decoding="async" />}
            </div>
            <div style={{ flex: 1 }}>
              <strong>{t.name}</strong>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ width: "auto", padding: "8px 14px" }} onClick={() => setEditing(t)}>
                Edit
              </button>
              <button
                className="btn-secondary"
                style={{ width: "auto", padding: "8px 14px", color: "#a33", borderColor: "#a33" }}
                onClick={() => handleDelete(t.id)}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tab: Pengaturan Situs
// ---------------------------------------------------------------------

function SettingsTab({ event, adminKey }) {
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  async function load() {
    if (!event) return;
    const res = await fetch(`/api/admin/config?event=${event}&key=${encodeURIComponent(adminKey)}`);
    if (res.ok) {
      const data = await res.json();
      setForm(data.site);
    }
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function uploadHeroImage(file) {
    setStatus("Mengompres & mengupload gambar...");
    try {
      const dataUrl = await compressFile(file, { maxDim: 1800, quality: 0.85 });
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, event, dataUrl, folder: "hero" }),
      });
      const data = await res.json();
      if (res.ok) {
        set("heroImageUrl", data.url);
        setStatus("");
      } else {
        setStatus("Gagal upload: " + (data.error || ""));
      }
    } catch (e) {
      setStatus("Gagal upload gambar.");
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, event, ...form }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Tersimpan ✓");
      } else {
        setStatus("Gagal simpan: " + (data.error || ""));
      }
    } catch (e) {
      setStatus("Gagal simpan pengaturan.");
    }
    setSaving(false);
  }

  if (!form) return <p>Memuat...</p>;

  return (
    <div className="settings-layout">
      <div>
      <label className="field-label">Gaya Halaman Tamu</label>
      <select
        value={form.coverStyle || "luxury-minimal"}
        onChange={(e) => set("coverStyle", e.target.value)}
        style={{ marginBottom: 6, width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #e5ddd0" }}
      >
        {COVER_STYLES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <p className="hp-tip">Ini gaya tampilan halaman pertama yang dilihat tamu saat scan barcode undangan. Lihat pratinjaunya di kanan, update langsung tiap ganti pilihan.</p>

      <label className="field-label" style={{ marginTop: 16 }}>
        Nama Pasangan
      </label>
      <input type="text" value={form.coupleName || ""} onChange={(e) => set("coupleName", e.target.value)} />

      <label className="field-label">Tanggal</label>
      <input type="text" value={form.weddingDate || ""} onChange={(e) => set("weddingDate", e.target.value)} />

      <label className="field-label">Tempat</label>
      <input type="text" value={form.venue || ""} onChange={(e) => set("venue", e.target.value)} />

      <label className="field-label">Pesan Sambutan</label>
      <input type="text" value={form.welcomeMessage || ""} onChange={(e) => set("welcomeMessage", e.target.value)} />

      <label className="field-label">Pesan Terima Kasih (di hasil foto)</label>
      <input type="text" value={form.thankYouMessage || ""} onChange={(e) => set("thankYouMessage", e.target.value)} />

      <label className="field-label">Teks Kicker (di atas nama pasangan)</label>
      <input type="text" value={form.kickerText || ""} onChange={(e) => set("kickerText", e.target.value)} />

      <label className="field-label">Label Kolom Nama Tamu</label>
      <input type="text" value={form.entryLabel || ""} onChange={(e) => set("entryLabel", e.target.value)} />

      <label className="field-label">Label Kolom Kesan</label>
      <input type="text" value={form.messageLabel || ""} onChange={(e) => set("messageLabel", e.target.value)} />

      <label className="field-label">Teks Tombol Mulai</label>
      <input type="text" value={form.startButtonLabel || ""} onChange={(e) => set("startButtonLabel", e.target.value)} />

      <label className="field-label">Gambar Hero / Sampul Halaman Tamu (opsional)</label>
      {form.heroImageUrl && <img src={form.heroImageUrl} className="admin-preview-img" alt="hero" />}
      <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadHeroImage(e.target.files[0])} />

      <label className="field-label" style={{ marginTop: 16 }}>
        Font Judul / Nama Pasangan
      </label>
      <select
        value={form.fontHeading || HEADING_FONTS[0].value}
        onChange={(e) => set("fontHeading", e.target.value)}
        style={{ marginBottom: 16, width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #e5ddd0" }}
      >
        {HEADING_FONTS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <label className="field-label">Font Teks Biasa</label>
      <select
        value={form.fontBody || BODY_FONTS[0].value}
        onChange={(e) => set("fontBody", e.target.value)}
        style={{ marginBottom: 16, width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #e5ddd0" }}
      >
        {BODY_FONTS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={form.galleryEnabled !== false}
          onChange={(e) => set("galleryEnabled", e.target.checked)}
          style={{ width: "auto", marginBottom: 0 }}
        />
        <span>Tampilkan galeri semua tamu (foto + voice note) di halaman hasil foto</span>
      </label>

      <label className="field-label" style={{ marginTop: 16 }}>
        Admin Key (dipakai untuk login ke halaman ini)
      </label>
      <input type="text" value={form.adminKey || ""} onChange={(e) => set("adminKey", e.target.value)} />

      {status && <p className="footer-note">{status}</p>}

      <button onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
      </div>

      <div className="settings-preview">
        <div className="settings-preview-label">Pratinjau Halaman Tamu</div>
        <div className="settings-preview-inner" style={{ padding: 0, overflow: "hidden" }}>
          <GuestCoverView site={form} interactive={false} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tab: Homepage (editor drag & drop buat halaman marketing utama)
// ---------------------------------------------------------------------

const SECTION_META = {
  nav: { icon: "🧭", label: "Navigasi" },
  hero: { icon: "🏠", label: "Hero / Judul Utama" },
  features: { icon: "✨", label: "Fitur" },
  portfolio: { icon: "🖼️", label: "Portofolio" },
  articles: { icon: "📰", label: "What's New" },
  footer: { icon: "📎", label: "Footer" },
};

function ItemDragList({ items, onMove, onRemove, renderItem }) {
  const dragIdx = useRef(null);
  const [overIdx, setOverIdx] = useState(null);

  return (
    <div className="hp-item-list">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`hp-item-row ${overIdx === idx ? "hp-item-row-over" : ""}`}
          draggable
          onDragStart={() => (dragIdx.current = idx)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverIdx(idx);
          }}
          onDragLeave={() => setOverIdx((cur) => (cur === idx ? null : cur))}
          onDrop={() => {
            if (dragIdx.current !== null && dragIdx.current !== idx) onMove(dragIdx.current, idx);
            dragIdx.current = null;
            setOverIdx(null);
          }}
          onDragEnd={() => setOverIdx(null)}
        >
          <span className="hp-drag-handle-sm" title="Geser buat urutin">⠿</span>
          <div className="hp-item-row-content">{renderItem(item, idx)}</div>
          <button type="button" className="hp-remove-btn" onClick={() => onRemove(idx)} title="Hapus item">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function BlockEditor({ block, onUpdateData, onMoveItem, onAddItem, onRemoveItem, onUpdateItem, onUploadImage }) {
  const data = block.data || {};

  if (block.type === "nav") {
    return (
      <div>
        <label className="field-label">Nama Brand</label>
        <input type="text" value={data.brand || ""} onChange={(e) => onUpdateData({ brand: e.target.value })} />
        <p className="hp-tip">Href bisa diisi <code>__admin__</code> (ke login admin), <code>__demo__</code> (ke demo tamu), atau URL bebas.</p>
        <label className="field-label">Menu / Tombol Navigasi</label>
        <ItemDragList
          items={data.items || []}
          onMove={onMoveItem}
          onRemove={onRemoveItem}
          renderItem={(item, idx) => (
            <div className="hp-row-2col">
              <input type="text" placeholder="Label tombol" value={item.label || ""} onChange={(e) => onUpdateItem(idx, { label: e.target.value })} />
              <input type="text" placeholder="__admin__" value={item.href || ""} onChange={(e) => onUpdateItem(idx, { href: e.target.value })} />
            </div>
          )}
        />
        <button type="button" className="hp-add-btn" onClick={() => onAddItem({ label: "Menu Baru", href: "__admin__" })}>
          + Tambah Menu
        </button>
      </div>
    );
  }

  if (block.type === "hero") {
    return (
      <div>
        <label className="field-label">Kicker (teks kecil di atas judul)</label>
        <input type="text" value={data.kicker || ""} onChange={(e) => onUpdateData({ kicker: e.target.value })} />
        <label className="field-label">Judul Utama</label>
        <textarea rows={2} value={data.heading || ""} onChange={(e) => onUpdateData({ heading: e.target.value })} />
        <label className="field-label">Paragraf</label>
        <textarea rows={3} value={data.paragraph || ""} onChange={(e) => onUpdateData({ paragraph: e.target.value })} />
        <div className="hp-row-2col" style={{ marginTop: 8 }}>
          <div>
            <label className="field-label">Tombol Utama</label>
            <input type="text" placeholder="Label" value={data.ctaPrimaryLabel || ""} onChange={(e) => onUpdateData({ ctaPrimaryLabel: e.target.value })} />
            <input type="text" placeholder="__demo__" value={data.ctaPrimaryHref || ""} onChange={(e) => onUpdateData({ ctaPrimaryHref: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Tombol Kedua</label>
            <input type="text" placeholder="Label" value={data.ctaSecondaryLabel || ""} onChange={(e) => onUpdateData({ ctaSecondaryLabel: e.target.value })} />
            <input type="text" placeholder="__admin__" value={data.ctaSecondaryHref || ""} onChange={(e) => onUpdateData({ ctaSecondaryHref: e.target.value })} />
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "features") {
    return (
      <div>
        <label className="field-label">Judul Section</label>
        <input type="text" value={data.title || ""} onChange={(e) => onUpdateData({ title: e.target.value })} />
        <label className="field-label">Subjudul</label>
        <input type="text" value={data.subtitle || ""} onChange={(e) => onUpdateData({ subtitle: e.target.value })} />
        <label className="field-label" style={{ marginTop: 14 }}>Daftar Fitur</label>
        <ItemDragList
          items={data.items || []}
          onMove={onMoveItem}
          onRemove={onRemoveItem}
          renderItem={(item, idx) => (
            <div className="hp-feature-fields">
              <input
                type="text"
                className="hp-emoji-input"
                placeholder="🎯"
                value={item.icon || ""}
                onChange={(e) => onUpdateItem(idx, { icon: e.target.value })}
              />
              <div style={{ flex: 1 }}>
                <input type="text" placeholder="Judul fitur" value={item.title || ""} onChange={(e) => onUpdateItem(idx, { title: e.target.value })} />
                <input type="text" placeholder="Deskripsi" value={item.desc || ""} onChange={(e) => onUpdateItem(idx, { desc: e.target.value })} />
              </div>
            </div>
          )}
        />
        <button type="button" className="hp-add-btn" onClick={() => onAddItem({ icon: "✨", title: "Fitur Baru", desc: "Deskripsi fitur" })}>
          + Tambah Fitur
        </button>
      </div>
    );
  }

  if (block.type === "portfolio") {
    return (
      <div>
        <label className="field-label">Judul Section</label>
        <input type="text" value={data.title || ""} onChange={(e) => onUpdateData({ title: e.target.value })} />
        <label className="field-label">Subjudul</label>
        <input type="text" value={data.subtitle || ""} onChange={(e) => onUpdateData({ subtitle: e.target.value })} />
        <label className="field-label" style={{ marginTop: 14 }}>Contoh Strip Foto</label>
        <ItemDragList
          items={data.items || []}
          onMove={onMoveItem}
          onRemove={onRemoveItem}
          renderItem={(item, idx) => (
            <div className="hp-portfolio-fields">
              {item.image ? (
                <div className="hp-portfolio-thumb-wrap">
                  <img src={item.image} className="hp-portfolio-thumb" alt="" />
                  <button type="button" className="hp-remove-btn-sm" onClick={() => onUpdateItem(idx, { image: null })}>
                    Hapus gambar
                  </button>
                </div>
              ) : (
                <div
                  className="hp-portfolio-thumb hp-portfolio-thumb-empty"
                  style={{ background: `linear-gradient(160deg, ${item.color1 || "#7a1f2b"}, ${item.color2 || "#4a0f18"})` }}
                />
              )}
              <div style={{ flex: 1 }}>
                <label className="hp-file-btn">
                  Upload Gambar
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files[0] && onUploadImage(e.target.files[0], (url) => onUpdateItem(idx, { image: url }))}
                  />
                </label>
                <input type="text" placeholder="Caption" value={item.caption || ""} onChange={(e) => onUpdateItem(idx, { caption: e.target.value })} />
              </div>
            </div>
          )}
        />
        <button
          type="button"
          className="hp-add-btn"
          onClick={() => onAddItem({ image: null, color1: "#7a1f2b", color2: "#4a0f18", caption: "Nama Pasangan" })}
        >
          + Tambah Strip
        </button>
      </div>
    );
  }

  if (block.type === "articles") {
    return (
      <div>
        <label className="field-label">Judul Section</label>
        <input type="text" value={data.title || ""} onChange={(e) => onUpdateData({ title: e.target.value })} />
        <label className="field-label">Subjudul</label>
        <input type="text" value={data.subtitle || ""} onChange={(e) => onUpdateData({ subtitle: e.target.value })} />
        <label className="field-label" style={{ marginTop: 14 }}>Daftar Artikel</label>
        <ItemDragList
          items={data.items || []}
          onMove={onMoveItem}
          onRemove={onRemoveItem}
          renderItem={(item, idx) => (
            <div>
              <input type="text" placeholder="Tag (Update/Tips)" value={item.tag || ""} onChange={(e) => onUpdateItem(idx, { tag: e.target.value })} />
              <input type="text" placeholder="Judul artikel" value={item.title || ""} onChange={(e) => onUpdateItem(idx, { title: e.target.value })} />
              <input type="text" placeholder="Deskripsi" value={item.desc || ""} onChange={(e) => onUpdateItem(idx, { desc: e.target.value })} />
            </div>
          )}
        />
        <button type="button" className="hp-add-btn" onClick={() => onAddItem({ tag: "Update", title: "Artikel Baru", desc: "Deskripsi artikel" })}>
          + Tambah Artikel
        </button>
      </div>
    );
  }

  if (block.type === "footer") {
    return (
      <div>
        <label className="field-label">Teks Footer</label>
        <input type="text" value={data.text || ""} onChange={(e) => onUpdateData({ text: e.target.value })} />
        <label className="field-label">Label Link</label>
        <input type="text" value={data.linkLabel || ""} onChange={(e) => onUpdateData({ linkLabel: e.target.value })} />
        <label className="field-label">Href Link</label>
        <input type="text" placeholder="__admin__" value={data.linkHref || ""} onChange={(e) => onUpdateData({ linkHref: e.target.value })} />
      </div>
    );
  }

  return null;
}

function SectionCard({ block, expanded, onToggleExpand, onToggleVisible, onDragStart, onDragOver, onDrop, onDragEnd, isOver, children }) {
  const meta = SECTION_META[block.type] || { icon: "📄", label: block.type };
  return (
    <div
      className={`hp-card ${block.visible === false ? "hp-card-hidden" : ""} ${isOver ? "hp-card-over" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="hp-card-header" onClick={onToggleExpand}>
        <span className="hp-drag-handle" title="Geser buat urutin section">⠿</span>
        <span className="hp-card-icon">{meta.icon}</span>
        <span className="hp-card-title">{meta.label}</span>
        <label className="hp-toggle" onClick={(e) => e.stopPropagation()} title="Tampilkan/sembunyikan section">
          <input type="checkbox" checked={block.visible !== false} onChange={onToggleVisible} />
          <span className="hp-toggle-slider" />
        </label>
        <span className={`hp-chevron ${expanded ? "hp-chevron-open" : ""}`}>›</span>
      </div>
      {expanded && <div className="hp-card-body">{children}</div>}
    </div>
  );
}

function HomepageTab({ event, adminKey }) {
  const [blocks, setBlocks] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({ hero: true });
  const [overSection, setOverSection] = useState(null);
  const dragSection = useRef(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  async function load() {
    if (!event) return;
    const res = await fetch(`/api/admin/homepage?event=${event}&key=${encodeURIComponent(adminKey)}`);
    if (res.ok) {
      const data = await res.json();
      setBlocks(data.blocks);
    }
  }

  function updateBlockData(id, patch) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...patch } } : b)));
  }
  function toggleVisible(id) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, visible: b.visible === false ? true : false } : b)));
  }
  function toggleExpand(id) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }
  function moveSection(from, to) {
    setBlocks((bs) => {
      const copy = [...bs];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }
  function moveItem(blockId, from, to) {
    setBlocks((bs) =>
      bs.map((b) => {
        if (b.id !== blockId) return b;
        const items = [...(b.data.items || [])];
        const [item] = items.splice(from, 1);
        items.splice(to, 0, item);
        return { ...b, data: { ...b.data, items } };
      })
    );
  }
  function addItem(blockId, tpl) {
    setBlocks((bs) => bs.map((b) => (b.id === blockId ? { ...b, data: { ...b.data, items: [...(b.data.items || []), tpl] } } : b)));
  }
  function removeItem(blockId, index) {
    setBlocks((bs) =>
      bs.map((b) => {
        if (b.id !== blockId) return b;
        const items = [...(b.data.items || [])];
        items.splice(index, 1);
        return { ...b, data: { ...b.data, items } };
      })
    );
  }
  function updateItem(blockId, index, patch) {
    setBlocks((bs) =>
      bs.map((b) => {
        if (b.id !== blockId) return b;
        const items = [...(b.data.items || [])];
        items[index] = { ...items[index], ...patch };
        return { ...b, data: { ...b.data, items } };
      })
    );
  }

  async function uploadImage(file, onDone) {
    setStatus("Mengompres & mengupload gambar...");
    try {
      const dataUrl = await compressFile(file, { maxDim: 1800, quality: 0.85 });
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, event, dataUrl, folder: "homepage" }),
      });
      const data = await res.json();
      if (res.ok) {
        onDone(data.url);
        setStatus("");
      } else {
        setStatus("Gagal upload: " + (data.error || ""));
      }
    } catch (e) {
      setStatus("Gagal upload gambar.");
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, event, blocks }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Tersimpan ✓ — homepage langsung terupdate.");
      } else {
        setStatus("Gagal simpan: " + (data.error || ""));
      }
    } catch (e) {
      setStatus("Gagal simpan homepage.");
    }
    setSaving(false);
  }

  if (!blocks) return <p>Memuat...</p>;

  return (
    <div className="hp-layout">
      <div className="hp-editor">
        <p className="hp-hint">Geser ikon ⠿ buat urutin section atau item di dalamnya. Klik judul section buat expand & edit.</p>
        {blocks.map((block, i) => (
          <SectionCard
            key={block.id}
            block={block}
            expanded={!!expanded[block.id]}
            isOver={overSection === i}
            onToggleExpand={() => toggleExpand(block.id)}
            onToggleVisible={() => toggleVisible(block.id)}
            onDragStart={() => (dragSection.current = i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverSection(i);
            }}
            onDrop={() => {
              if (dragSection.current !== null && dragSection.current !== i) moveSection(dragSection.current, i);
              dragSection.current = null;
              setOverSection(null);
            }}
            onDragEnd={() => setOverSection(null)}
          >
            <BlockEditor
              block={block}
              onUpdateData={(patch) => updateBlockData(block.id, patch)}
              onMoveItem={(from, to) => moveItem(block.id, from, to)}
              onAddItem={(tpl) => addItem(block.id, tpl)}
              onRemoveItem={(idx) => removeItem(block.id, idx)}
              onUpdateItem={(idx, patch) => updateItem(block.id, idx, patch)}
              onUploadImage={uploadImage}
            />
          </SectionCard>
        ))}

        {status && <p className="footer-note">{status}</p>}
        <button onClick={handleSave} disabled={saving} className="hp-save-btn">
          {saving ? "Menyimpan..." : "Simpan & Publish Homepage"}
        </button>
      </div>

      <div className="hp-preview">
        <div className="hp-preview-label">Live Preview</div>
        <div className="hp-preview-frame">
          <div className="hp-preview-chrome">
            <span className="hp-dot" style={{ background: "#ff5f57" }} />
            <span className="hp-dot" style={{ background: "#febc2e" }} />
            <span className="hp-dot" style={{ background: "#28c840" }} />
          </div>
          <div className="hp-preview-viewport">
            <div className="hp-preview-inner">
              <HomepageView blocks={blocks} adminHref="#" demoHref="#" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
