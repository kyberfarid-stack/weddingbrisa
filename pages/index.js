import Head from "next/head";
const config = require("../lib/config");

const FEATURES = [
  {
    icon: "📷",
    title: "Scan & Check-in Instan",
    desc: "Tamu tinggal scan barcode di kartu undangan, isi nama, langsung masuk ke sesi photobooth virtual.",
  },
  {
    icon: "🎨",
    title: "Template Custom",
    desc: "Upload background & bingkai sendiri — tiap acara bisa punya gaya visual yang beda.",
  },
  {
    icon: "📱",
    title: "Siap Upload Sosmed",
    desc: "Hasil foto otomatis pas untuk dibagikan ke Instagram, WhatsApp, dan TikTok.",
  },
  {
    icon: "🖼️",
    title: "Galeri Real-time",
    desc: "Semua momen tamu terkumpul otomatis di satu galeri yang bisa dilihat bersama.",
  },
  {
    icon: "⚙️",
    title: "Dashboard Admin",
    desc: "Atur template, teks, warna, dan font acara kapan saja lewat panel admin — lengkap dengan pratinjau langsung.",
  },
  {
    icon: "🔒",
    title: "Aman & Privat",
    desc: "Data tamu tersimpan aman dan hanya bisa diakses lewat admin key acara kamu.",
  },
];

const ARTICLES = [
  {
    tag: "Update",
    title: "Bingkai custom kini bebas distorsi",
    desc: "Background & overlay sekarang otomatis menyesuaikan tanpa pernah stretch, walau tamu ambil 1–3 foto.",
  },
  {
    tag: "Update",
    title: "Kamera lebih stabil",
    desc: "Sesi foto kini menunggu kamera benar-benar siap sebelum tombol jepret aktif — tidak ada lagi foto gelap/noise.",
  },
  {
    tag: "Tips",
    title: "Cara desain bingkai photobooth",
    desc: "Gunakan rasio potret dan sisakan ruang kosong persegi di tengah untuk hasil terbaik, mengikuti strip klasik.",
  },
];

const PORTFOLIO_COLORS = [
  ["#7a1f2b", "#4a0f18"],
  ["#1a1a1a", "#3a2f10"],
  ["#2b3a55", "#141b28"],
];

export default function Landing() {
  const adminHref = `/${config.eventSlug}/admin`;
  const demoHref = `/${config.eventSlug}`;

  return (
    <div className="landing">
      <Head>
        <title>Virtual Photobooth — Untuk Hari Bahagia Kamu</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
      </Head>

      <nav className="landing-nav">
        <span className="landing-brand">Virtual Photobooth</span>
        <a className="landing-nav-btn" href={adminHref}>
          Login Admin
        </a>
      </nav>

      <header className="landing-hero">
        <span className="landing-kicker">Untuk Hari Bahagia Kamu</span>
        <h1>Photobooth Virtual, Tanpa Antre, Tanpa Ribet</h1>
        <p>
          Tamu scan barcode di kartu undangan, foto langsung dengan bingkai custom acara kamu,
          lalu bagikan ke sosial media dalam sekejap — semua lewat browser, tanpa install apa pun.
        </p>
        <div className="landing-cta-row">
          <a className="landing-btn-primary" href={demoHref}>
            Coba Demo
          </a>
          <a className="landing-btn-ghost" href={adminHref}>
            Login Admin
          </a>
        </div>
      </header>

      <section className="landing-section">
        <h2 className="landing-section-title">Semua yang Kamu Butuh</h2>
        <p className="landing-section-sub">Satu link, semua momen tamu tersimpan rapi</p>
        <div className="landing-features">
          {FEATURES.map((f) => (
            <div className="landing-feature-card" key={f.title}>
              <div className="landing-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Contoh Hasil Photobooth</h2>
        <p className="landing-section-sub">Strip foto otomatis rapi, siap dibagikan ke sosmed</p>
        <div className="landing-portfolio">
          {PORTFOLIO_COLORS.map((colors, idx) => (
            <div className="landing-strip" key={idx}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="landing-strip-photo"
                  style={{ background: `linear-gradient(160deg, ${colors[0]}, ${colors[1]})` }}
                />
              ))}
              <div className="landing-strip-caption">Brisa &amp; Nanta</div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">What&apos;s New</h2>
        <p className="landing-section-sub">Pembaruan &amp; tips terbaru</p>
        <div className="landing-articles">
          {ARTICLES.map((a) => (
            <div className="landing-article-card" key={a.title}>
              <span className="landing-article-tag">{a.tag}</span>
              <h4>{a.title}</h4>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        Virtual Photobooth — dibuat untuk momen pernikahan kamu.
        <br />
        <a href={adminHref} style={{ color: "#d4af37" }}>
          Masuk sebagai admin →
        </a>
      </footer>
    </div>
  );
}
