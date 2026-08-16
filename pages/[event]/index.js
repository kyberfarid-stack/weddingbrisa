import { useState } from "react";
import { useRouter } from "next/router";
const config = require("../../lib/config");

export default function GuestEntry() {
      const router = useRouter();
      const { event } = router.query;
      const [name, setName] = useState("");
      const [message, setMessage] = useState("");

  const handleContinue = (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          sessionStorage.setItem("guestName", name.trim());
          sessionStorage.setItem("guestMessage", message.trim());
          router.push(`/${event}/template`);
  };

  return (
          <div className="screen" style={{ background: config.theme.secondary }}>
      <div className="card">
            <p className="kicker" style={{ color: config.theme.primary }}>
          Virtual Photobooth
              </p>
        <h1 className="script" style={{ "--accent": config.theme.primary }}>
{config.coupleName}
</h1>
        <p className="subtitle" style={{ marginBottom: 4 }}>
          Tanggal: {config.weddingDate}
</p>
        <p className="subtitle">Tempat: {config.venue}</p>
        <p className="subtitle">{config.welcomeMessage}</p>
        <form onSubmit={handleContinue}>
              <label className="field-label">Untuk Sdr/Sdi</label>
          <input
            type="text"
            placeholder="Tulis nama kamu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
                          <label className="field-label">Tinggalkan kesanmu di sini (opsional)</label>
          <textarea
            placeholder="Tulis ucapan atau kesan kamu untuk kami..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
                          <button type="submit" style={{ background: config.theme.primary }}>
            Mulai Photobooth
                </button>
                </form>
        <p className="footer-note">Virtual Photobooth &middot; {config.coupleName}</p>
                </div>
                </div>
  );
}
