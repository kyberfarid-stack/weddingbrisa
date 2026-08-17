import { useState, useEffect } from "react";
import { useRouter } from "next/router";

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
            Daftar Tamu
          </button>
          <button className={tab === "templates" ? "tab-active" : ""} onClick={() => setTab("templates")}>
            Template
          </button>
          <button className={tab === "settings" ? "tab-active" : ""} onClick={() => setTab("settings")}>
            Pengaturan Situs
          </button>
        </div>

        <div className="admin-body">
          {tab === "guests" && <GuestsTab event={event} adminKey={key} />}
          {tab === "templates" && <TemplatesTab event={event} adminKey={key} />}
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
                  <img src={g.photoUrl} className="guest-photo-thumb" alt={g.name} />
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
    const reader = new FileReader();
    reader.onload = async () => {
      setStatus("Mengupload gambar...");
      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: adminKey, event, dataUrl: reader.result, folder: "templates" }),
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
    };
    reader.readAsDataURL(file);
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
              {t.backgroundUrl && <img src={t.backgroundUrl} alt={t.name} />}
              {t.overlayUrl && <img src={t.overlayUrl} alt="" className="admin-template-overlay" />}
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
    const reader = new FileReader();
    reader.onload = async () => {
      setStatus("Mengupload gambar...");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, event, dataUrl: reader.result, folder: "hero" }),
      });
      const data = await res.json();
      if (res.ok) {
        set("heroImageUrl", data.url);
        setStatus("");
      } else {
        setStatus("Gagal upload: " + (data.error || ""));
      }
    };
    reader.readAsDataURL(file);
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

  const theme = form.theme || {};
  const previewBg = theme.secondary || "#f4ede4";
  const previewText = theme.text || "#2b2b2b";
  const previewAccent = theme.accent || "#d4af37";
  const previewPrimary = theme.primary || "#7a1f2b";

  return (
    <div className="settings-layout">
      <div>
      <label className="field-label">Nama Pasangan</label>
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
        <div
          className="settings-preview-inner"
          style={{ background: previewBg, color: previewText, fontFamily: form.fontBody || BODY_FONTS[0].value }}
        >
          {form.heroImageUrl && (
            <img src={form.heroImageUrl} className="settings-preview-hero" alt="hero preview" />
          )}
          <div className="settings-preview-kicker" style={{ color: previewAccent }}>
            {form.kickerText || "Virtual Photobooth"}
          </div>
          <h2
            className="settings-preview-name"
            style={{ fontFamily: form.fontHeading || HEADING_FONTS[0].value, color: previewPrimary }}
          >
            {form.coupleName || "Nama Pasangan"}
          </h2>
          <p className="settings-preview-date">{form.weddingDate || "Tanggal Pernikahan"}</p>
          <p className="settings-preview-msg">{form.welcomeMessage || "Pesan sambutan untuk tamu"}</p>
          <span className="settings-preview-btn" style={{ background: previewPrimary, color: "#fff" }}>
            {form.startButtonLabel || "Mulai Photobooth"}
          </span>
        </div>
      </div>
    </div>
  );
}
