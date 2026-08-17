// Dashboard master — buat kamu (pemilik platform) lihat SEMUA pengantin/acara
// yang pernah dibuat + link masing-masing dalam satu tempat, dan gampang bikin
// acara baru tanpa harus utak-atik kode/URL manual.
//
// Beda dengan /[event]/admin (itu login per-acara pakai admin key acara itu),
// halaman ini login pakai "master key" terpisah (lihat pages/api/master/events.js).

import { useState, useEffect } from "react";

export default function MasterAdmin() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("masterKey");
    if (saved) {
      setKey(saved);
      tryLogin(saved);
    }
    if (typeof window !== "undefined") setOrigin(window.location.origin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function tryLogin(k) {
    setError("");
    try {
      const res = await fetch(`/api/master/events?key=${encodeURIComponent(k)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Master key salah.");
        return;
      }
      const body = await res.json();
      sessionStorage.setItem("masterKey", k);
      setAuthed(true);
      setEvents(body.events || []);
    } catch (e) {
      setError("Gagal terhubung ke server.");
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/master/events?key=${encodeURIComponent(key)}`);
      const body = await res.json();
      setEvents(body.events || []);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("masterKey");
    setAuthed(false);
    setKey("");
  }

  if (!authed) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card">
          <div className="admin-login-brand">Virtual Photobooth</div>
          <h1>Dashboard Master</h1>
          <p className="subtitle">Login khusus pemilik platform untuk kelola semua pengantin/acara.</p>
          <input
            type="text"
            placeholder="Masukkan master key"
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
            <h1>Dashboard Master</h1>
            <p className="footer-note">Semua pengantin/acara yang pernah dibuat ({events.length})</p>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </div>

      <div className="admin-wrap" style={{ paddingTop: 24 }}>
        <div className="admin-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0 }}>Daftar Pengantin</h2>
            <button className="btn" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Batal" : "+ Tambah Pengantin Baru"}
            </button>
          </div>

          {showForm && (
            <NewEventForm
              masterKey={key}
              origin={origin}
              onCreated={() => {
                setShowForm(false);
                refresh();
              }}
            />
          )}

          {loading ? (
            <p>Memuat...</p>
          ) : events.length === 0 ? (
            <p className="hp-tip">Belum ada acara. Klik "+ Tambah Pengantin Baru" untuk mulai.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              {events.map((ev) => (
                <EventCard key={ev.eventSlug} event={ev} origin={origin} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, origin }) {
  const [copied, setCopied] = useState("");
  const guestLink = `${origin}/${event.eventSlug}`;
  const adminLink = `${origin}/${event.eventSlug}/admin`;

  function copy(label, url) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  return (
    <div
      style={{
        border: "2px solid #e5ddd0",
        borderRadius: 14,
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{event.coupleName}</div>
        <div style={{ fontSize: "0.85rem", color: "#8a8478" }}>
          {event.weddingDate || "—"} {event.venue ? `· ${event.venue}` : ""}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#b0a996", marginTop: 4 }}>slug: {event.eventSlug}</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn-secondary" onClick={() => copy("guest", guestLink)}>
          {copied === "guest" ? "Tersalin ✓" : "Salin Link Tamu"}
        </button>
        <button className="btn-secondary" onClick={() => copy("admin", adminLink)}>
          {copied === "admin" ? "Tersalin ✓" : "Salin Link Admin"}
        </button>
        <a className="btn" href={adminLink} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          Buka Admin →
        </a>
      </div>
    </div>
  );
}

function NewEventForm({ masterKey, origin, onCreated }) {
  const [coupleName, setCoupleName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [weddingDate, setWeddingDate] = useState("");
  const [venue, setVenue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function autoSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(v) {
    setCoupleName(v);
    if (!slugTouched) setSlug(autoSlug(v));
  }

  async function submit() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/master/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: masterKey, coupleName, slug, weddingDate, venue }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Gagal membuat acara.");
        return;
      }
      setResult(body.eventSlug);
    } catch (e) {
      setError("Gagal terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    const guestLink = `${origin}/${result}`;
    const adminLink = `${origin}/${result}/admin`;
    return (
      <div style={{ border: "2px solid #7a1f2b", borderRadius: 14, padding: 20, marginBottom: 20, background: "#fbf6ee" }}>
        <p style={{ fontWeight: 700, marginTop: 0 }}>Acara baru berhasil dibuat 🎉</p>
        <p className="hp-tip" style={{ margin: "4px 0" }}>
          Link tamu: <a href={guestLink} target="_blank" rel="noreferrer">{guestLink}</a>
        </p>
        <p className="hp-tip" style={{ margin: "4px 0" }}>
          Link admin: <a href={adminLink} target="_blank" rel="noreferrer">{adminLink}</a>
        </p>
        <p className="hp-tip" style={{ marginTop: 10 }}>
          Admin key acara ini masih pakai default (lihat file lib/config.js -&gt; adminKey). Login ke admin lalu ganti "Admin Key" di tab Pengaturan Situs supaya aman.
        </p>
        <button className="btn" onClick={onCreated} style={{ marginTop: 10 }}>
          Selesai, kembali ke daftar
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: "2px solid #e5ddd0", borderRadius: 14, padding: 20, marginBottom: 20 }}>
      <label className="field-label">Nama Pasangan</label>
      <input type="text" value={coupleName} onChange={(e) => handleNameChange(e.target.value)} placeholder="Contoh: Rina & Eka" />

      <label className="field-label" style={{ marginTop: 12 }}>Slug URL (otomatis dari nama, bisa diedit)</label>
      <input
        type="text"
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(autoSlug(e.target.value));
        }}
        placeholder="rina-eka"
      />
      <p className="hp-tip">Link tamu nanti jadi: {origin || "https://domainkamu.com"}/{slug || "slug-acara"}</p>

      <label className="field-label" style={{ marginTop: 12 }}>Tanggal Pernikahan (opsional)</label>
      <input type="text" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} placeholder="16 Agustus 2026" />

      <label className="field-label" style={{ marginTop: 12 }}>Lokasi (opsional)</label>
      <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Gedung Resepsi, Jakarta" />

      {error && <p style={{ color: "#c0392b", fontSize: "0.85rem", marginTop: 10 }}>{error}</p>}

      <button className="btn" onClick={submit} disabled={saving || !coupleName.trim() || !slug.trim()} style={{ marginTop: 16 }}>
        {saving ? "Membuat..." : "Buat Acara"}
      </button>
    </div>
  );
}
