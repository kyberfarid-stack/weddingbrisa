import { useState } from "react";
import { useRouter } from "next/router";
const config = require("../../lib/config");

export default function GuestEntry() {
    const router = useRouter();
    const { event } = router.query;
    const [name, setName] = useState("");

  const handleContinue = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        sessionStorage.setItem("guestName", name.trim());
        router.push(`/${event}/template`);
  };

  return (
        <div className="screen" style={{ background: config.theme.secondary }}>
      <div className="card">
          <h1 className="script" style={{ "--accent": config.theme.primary }}>
{config.coupleName}
</h1>
        <p className="subtitle">{config.weddingDate}</p>
        <p className="subtitle">{config.welcomeMessage}</p>
        <form onSubmit={handleContinue}>
            <input
            type="text"
            placeholder="Tulis nama kamu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
                        <button type="submit" style={{ background: config.theme.primary }}>
            Mulai Fotobooth
              </button>
              </form>
        <p className="footer-note">Virtual Photobooth &middot; {config.coupleName}</p>
              </div>
              </div>
  );
}
