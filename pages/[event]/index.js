import { useState } from "react";
import { useRouter } from "next/router";
import useSiteConfig from "../../lib/useSiteConfig";

export default function GuestEntry() {
        const router = useRouter();
        const { event } = router.query;
        const { site, loading } = useSiteConfig(event);
        const [name, setName] = useState("");
        const [message, setMessage] = useState("");

  const handleContinue = (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            sessionStorage.setItem("guestName", name.trim());
            sessionStorage.setItem("guestMessage", message.trim());
            router.push(`/${event}/template`);
  };

  if (loading) {
            return (
                        <div className="screen">
                          <p>Memuat...</p>
                  </div>
            );
  }

  return (
            <div className="screen" style={{ background: site.theme.secondary, fontFamily: site.fontBody }}>
      <div className="card">
{site.heroImageUrl && <img src={site.heroImageUrl} className="hero-image" alt="" />}
        <p className="kicker" style={{ color: site.theme.primary }}>
{site.kickerText}
</p>
        <h1 className="script" style={{ "--accent": site.theme.primary, fontFamily: site.fontHeading }}>
{site.coupleName}
</h1>
        <p className="subtitle" style={{ marginBottom: 4 }}>
          Tanggal: {site.weddingDate}
</p>
        <p className="subtitle">Tempat: {site.venue}</p>
        <p className="subtitle">{site.welcomeMessage}</p>
        <form onSubmit={handleContinue}>
                <label className="field-label">{site.entryLabel}</label>
          <input
            type="text"
            placeholder="Tulis nama kamu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
                            <label className="field-label">{site.messageLabel}</label>
          <textarea
            placeholder="Tulis ucapan atau kesan kamu untuk kami..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
                            <button type="submit" style={{ background: site.theme.primary }}>
{site.startButtonLabel}
</button>
      </form>
        <p className="footer-note">
{site.kickerText} &middot; {site.coupleName}
</p>
      </div>
      </div>
  );
}
