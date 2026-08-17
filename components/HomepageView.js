// Komponen render halaman homepage marketing dari data blocks (JSON).
// Dipakai BERSAMA oleh pages/index.js (situs asli) dan panel live preview
// di admin (tab Homepage) — supaya hasil preview 100% sama dengan yang
// akan tayang, tanpa duplikasi kode render.

function resolveHref(href, { adminHref, demoHref }) {
  if (href === "__admin__") return adminHref || "#";
  if (href === "__demo__") return demoHref || "#";
  return href || "#";
}

function NavBlock({ data, ctx }) {
  const items = Array.isArray(data.items) ? data.items : [];
  return (
    <nav className="landing-nav">
      <span className="landing-brand">{data.brand || "Virtual Photobooth"}</span>
      <div className="landing-nav-links">
        {items.map((it, i) => (
          <a className="landing-nav-btn" href={resolveHref(it.href, ctx)} key={i}>
            {it.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function HeroBlock({ data, ctx }) {
  return (
    <header className="landing-hero">
      <span className="landing-kicker">{data.kicker}</span>
      <h1>{data.heading}</h1>
      <p>{data.paragraph}</p>
      <div className="landing-cta-row">
        {data.ctaPrimaryLabel && (
          <a className="landing-btn-primary" href={resolveHref(data.ctaPrimaryHref, ctx)}>
            {data.ctaPrimaryLabel}
          </a>
        )}
        {data.ctaSecondaryLabel && (
          <a className="landing-btn-ghost" href={resolveHref(data.ctaSecondaryHref, ctx)}>
            {data.ctaSecondaryLabel}
          </a>
        )}
      </div>
    </header>
  );
}

function FeaturesBlock({ data }) {
  const items = Array.isArray(data.items) ? data.items : [];
  return (
    <section className="landing-section">
      <h2 className="landing-section-title">{data.title}</h2>
      {data.subtitle && <p className="landing-section-sub">{data.subtitle}</p>}
      <div className="landing-features">
        {items.map((f, i) => (
          <div className="landing-feature-card" key={i}>
            <div className="landing-feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PortfolioBlock({ data }) {
  const items = Array.isArray(data.items) ? data.items : [];
  return (
    <section className="landing-section">
      <h2 className="landing-section-title">{data.title}</h2>
      {data.subtitle && <p className="landing-section-sub">{data.subtitle}</p>}
      <div className="landing-portfolio">
        {items.map((p, idx) => (
          <div className="landing-strip" key={idx}>
            {p.image ? (
              <div className="landing-strip-photo landing-strip-photo-img" style={{ backgroundImage: `url(${p.image})` }} />
            ) : (
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="landing-strip-photo"
                  style={{ background: `linear-gradient(160deg, ${p.color1 || "#7a1f2b"}, ${p.color2 || "#4a0f18"})` }}
                />
              ))
            )}
            <div className="landing-strip-caption">{p.caption}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ArticlesBlock({ data }) {
  const items = Array.isArray(data.items) ? data.items : [];
  return (
    <section className="landing-section">
      <h2 className="landing-section-title">{data.title}</h2>
      {data.subtitle && <p className="landing-section-sub">{data.subtitle}</p>}
      <div className="landing-articles">
        {items.map((a, i) => (
          <div className="landing-article-card" key={i}>
            <span className="landing-article-tag">{a.tag}</span>
            <h4>{a.title}</h4>
            <p>{a.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FooterBlock({ data, ctx }) {
  return (
    <footer className="landing-footer">
      {data.text}
      <br />
      <a href={resolveHref(data.linkHref, ctx)} style={{ color: "#d4af37" }}>
        {data.linkLabel}
      </a>
    </footer>
  );
}

const RENDERERS = {
  nav: NavBlock,
  hero: HeroBlock,
  features: FeaturesBlock,
  portfolio: PortfolioBlock,
  articles: ArticlesBlock,
  footer: FooterBlock,
};

export default function HomepageView({ blocks, adminHref = "#", demoHref = "#", className = "" }) {
  const ctx = { adminHref, demoHref };
  const visible = (blocks || []).filter((b) => b.visible !== false);
  return (
    <div className={`landing ${className}`.trim()}>
      {visible.map((block) => {
        const Renderer = RENDERERS[block.type];
        if (!Renderer) return null;
        return <Renderer key={block.id} data={block.data || {}} ctx={ctx} />;
      })}
    </div>
  );
}
