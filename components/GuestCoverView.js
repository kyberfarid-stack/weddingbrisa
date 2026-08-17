// Komponen halaman "cover" tamu — dipakai di 2 tempat:
//  1. pages/[event]/index.js  -> versi interaktif beneran (tamu isi nama & kesan)
//  2. pages/[event]/admin.js  -> versi pratinjau non-interaktif di tab Pengaturan Situs
// Supaya preview di admin 100% sama persis dengan yang tamu lihat, dua-duanya
// pakai komponen yang sama, cuma beda flag `interactive`.

const COVER_STYLES = [
  { value: "luxury-minimal", label: "Luxury Minimal (gelap & emas)" },
  { value: "elegant-floral", label: "Elegant Floral (krem & bunga)" },
  { value: "photo-hero", label: "Photo Hero (foto pasangan full-bleed)" },
  { value: "vintage-frame", label: "Vintage Frame (sepia & bingkai ukir)" },
  { value: "modern-minimal", label: "Modern Minimal (Gen-Z, warna cerah)" },
];

function getInitials(coupleName) {
  const src = (coupleName || "A & B").trim();
  const parts = src.split(/&|\bdan\b/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return [parts[0][0]?.toUpperCase() || "A", parts[1][0]?.toUpperCase() || "B"];
  }
  const words = src.split(/\s+/).filter(Boolean);
  return [words[0]?.[0]?.toUpperCase() || "A", (words[words.length - 1]?.[0] || "B").toUpperCase()];
}

// PENTING: komponen ini HARUS didefinisikan di luar (top-level), bukan di
// dalam GuestCoverView. Kalau didefinisikan ulang di setiap render (seperti
// versi sebelumnya), React menganggapnya komponen baru tiap kali state
// berubah → input di-mount ulang → autoFocus di kolom nama ke-trigger lagi
// dan menarik fokus balik ke sana tiap kamu ngetik di kolom kesan. Ini yang
// menyebabkan bug "tiap ngisi ucapan teks balik ke nama".
function GuestForm({
  site,
  name,
  message,
  onNameChange,
  onMessageChange,
  onSubmit,
  interactive,
  accent,
  inputClass,
  labelClass,
  btnClass,
}) {
  const fieldsDisabled = !interactive;

  function handleSubmit(e) {
    e.preventDefault();
    if (interactive && onSubmit) onSubmit();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className={labelClass || "field-label"}>{site.entryLabel}</label>
      <input
        type="text"
        className={inputClass}
        placeholder="Tulis nama kamu"
        value={name}
        onChange={(e) => onNameChange && onNameChange(e.target.value)}
        disabled={fieldsDisabled}
        autoFocus={interactive}
      />
      <label className={labelClass || "field-label"}>{site.messageLabel}</label>
      <textarea
        className={inputClass}
        placeholder="Tulis ucapan atau kesan kamu untuk kami..."
        value={message}
        onChange={(e) => onMessageChange && onMessageChange(e.target.value)}
        rows={3}
        disabled={fieldsDisabled}
      />
      <button type="submit" className={btnClass} style={btnClass ? undefined : { background: accent }}>
        {site.startButtonLabel}
      </button>
    </form>
  );
}

export default function GuestCoverView({
  site,
  name = "",
  message = "",
  onNameChange,
  onMessageChange,
  onSubmit,
  interactive = true,
}) {
  const style = site.coverStyle || "luxury-minimal";
  const [initialA, initialB] = getInitials(site.coupleName);
  const accent = site.theme?.primary || "#7a1f2b";
  const accentSoft = site.theme?.accent || "#d4af37";

  const formProps = {
    site,
    name,
    message,
    onNameChange,
    onMessageChange,
    onSubmit,
    interactive,
    accent,
  };

  // ---------------------------------------------------------------
  // 1. Luxury Minimal — gelap, emas, elegan (gaya default lama)
  // ---------------------------------------------------------------
  if (style === "luxury-minimal") {
    return (
      <div className="gc-wrap gc-luxury" style={{ fontFamily: site.fontBody }}>
        <div className="gc-luxury-card">
          {site.heroImageUrl && <img src={site.heroImageUrl} className="gc-luxury-hero" alt="" />}
          <p className="gc-luxury-kicker" style={{ color: accentSoft }}>
            {site.kickerText}
          </p>
          <h1 className="gc-luxury-name" style={{ fontFamily: site.fontHeading, color: accentSoft }}>
            {site.coupleName}
          </h1>
          <div className="gc-luxury-divider" style={{ background: accentSoft }} />
          <p className="gc-luxury-meta">{site.weddingDate}</p>
          <p className="gc-luxury-meta">{site.venue}</p>
          <p className="gc-luxury-msg">{site.welcomeMessage}</p>
          <GuestForm {...formProps} inputClass="gc-luxury-input" btnClass="gc-luxury-btn" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // 2. Elegant Floral — krem, monogram, aksen bunga di pojok
  // ---------------------------------------------------------------
  if (style === "elegant-floral") {
    return (
      <div className="gc-wrap gc-floral" style={{ fontFamily: site.fontBody }}>
        <div className="gc-floral-card">
          <span className="gc-floral-corner gc-floral-corner-tl">🌿</span>
          <span className="gc-floral-corner gc-floral-corner-tr">🌸</span>
          {site.heroImageUrl && <img src={site.heroImageUrl} className="gc-floral-photo" alt="" />}
          <p className="gc-floral-kicker">{site.kickerText}</p>
          <div className="gc-floral-monogram" style={{ color: accent }}>
            <span style={{ fontFamily: site.fontHeading }}>{initialA}</span>
            <span className="gc-floral-monogram-sep">🌾</span>
            <span style={{ fontFamily: site.fontHeading }}>{initialB}</span>
          </div>
          <h1 className="gc-floral-name" style={{ fontFamily: site.fontHeading, color: accent }}>
            {site.coupleName}
          </h1>
          <p className="gc-floral-meta">
            {site.weddingDate} &middot; {site.venue}
          </p>
          <p className="gc-floral-msg">{site.welcomeMessage}</p>
          <GuestForm {...formProps} inputClass="gc-floral-input" btnClass="gc-floral-btn" />
          <span className="gc-floral-corner gc-floral-corner-bl">🌸</span>
          <span className="gc-floral-corner gc-floral-corner-br">🌿</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // 3. Photo Hero — foto pasangan full-bleed, teks putih di atasnya
  // ---------------------------------------------------------------
  if (style === "photo-hero") {
    const bg = site.heroImageUrl
      ? `linear-gradient(180deg, rgba(10,10,12,0.25) 0%, rgba(10,10,12,0.55) 55%, rgba(10,10,12,0.9) 100%), url(${site.heroImageUrl})`
      : `linear-gradient(160deg, ${accent}, #241016)`;
    return (
      <div className="gc-wrap gc-photo" style={{ fontFamily: site.fontBody }}>
        <div className="gc-photo-card" style={{ backgroundImage: bg }}>
          <div className="gc-photo-top">
            <p className="gc-photo-kicker">{site.kickerText}</p>
          </div>
          <div className="gc-photo-bottom">
            <h1 className="gc-photo-name" style={{ fontFamily: site.fontHeading }}>
              {site.coupleName}
            </h1>
            <p className="gc-photo-meta">
              {site.weddingDate} &middot; {site.venue}
            </p>
            <p className="gc-photo-msg">{site.welcomeMessage}</p>
            <GuestForm {...formProps} inputClass="gc-photo-input" btnClass="gc-photo-btn" />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // 4. Vintage Frame — sepia, bingkai ukir ganda, huruf kapital
  // ---------------------------------------------------------------
  if (style === "vintage-frame") {
    return (
      <div className="gc-wrap gc-vintage" style={{ fontFamily: site.fontBody }}>
        <div className="gc-vintage-outer">
          <div className="gc-vintage-inner">
            {site.heroImageUrl && (
              <div className="gc-vintage-photo-wrap">
                <img src={site.heroImageUrl} className="gc-vintage-photo" alt="" />
              </div>
            )}
            <p className="gc-vintage-kicker">{site.kickerText}</p>
            <h1 className="gc-vintage-name" style={{ color: accent }}>
              {site.coupleName}
            </h1>
            <p className="gc-vintage-tagline">You are invited to our wedding</p>
            <p className="gc-vintage-meta">
              {site.weddingDate} &middot; {site.venue}
            </p>
            <p className="gc-vintage-msg">{site.welcomeMessage}</p>
            <GuestForm {...formProps} inputClass="gc-vintage-input" btnClass="gc-vintage-btn" />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // 5. Modern Minimal — Gen-Z, blob warna, sans-serif tebal
  // ---------------------------------------------------------------
  return (
    <div className="gc-wrap gc-modern" style={{ fontFamily: site.fontBody }}>
      <span className="gc-modern-blob gc-modern-blob-1" style={{ background: accentSoft }} />
      <span className="gc-modern-blob gc-modern-blob-2" style={{ background: accent }} />
      <div className="gc-modern-card">
        {site.heroImageUrl && <img src={site.heroImageUrl} className="gc-modern-hero" alt="" />}
        <p className="gc-modern-kicker" style={{ color: accent }}>
          {site.kickerText}
        </p>
        <h1 className="gc-modern-name" style={{ fontFamily: site.fontHeading }}>
          {site.coupleName}
        </h1>
        <p className="gc-modern-meta">
          {site.weddingDate} &middot; {site.venue}
        </p>
        <p className="gc-modern-msg">{site.welcomeMessage}</p>
        <GuestForm {...formProps} inputClass="gc-modern-input" btnClass="gc-modern-btn" />
      </div>
    </div>
  );
}

export { COVER_STYLES };
