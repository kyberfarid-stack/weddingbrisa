import { useState, useEffect } from "react";
import { useRouter } from "next/router";
const config = require("../../lib/config");

export default function ChooseTemplate() {
      const router = useRouter();
      const { event } = router.query;
      const [selected, setSelected] = useState(null);
      const [photoCount, setPhotoCount] = useState(1);
      const [guestName, setGuestName] = useState("");

  useEffect(() => {
          const n = sessionStorage.getItem("guestName");
          if (!n) {
                    router.replace(`/${event}`);
          } else {
                    setGuestName(n);
          }
  }, [event, router]);

  const handleNext = () => {
          if (!selected) return;
          sessionStorage.setItem("templateId", selected);
          sessionStorage.setItem("photoCount", String(photoCount));
          router.push(`/${event}/capture`);
  };

  return (
          <div className="screen" style={{ background: config.theme.secondary }}>
      <div className="card">
            <h1>Halo, {guestName}!</h1>
        <p className="subtitle" style={{ marginBottom: 4, fontWeight: 600, color: config.theme.primary }}>
          Pernikahan {config.coupleName}
</p>
        <p className="subtitle">Pilih template fotobooth kamu</p>
        <div className="template-grid">
{config.templates.map((t) => (
                <div
                                    key={t.id}
              className={`template-option ${selected === t.id ? "selected" : ""}`}
              style={{ background: t.background, color: t.textColor }}
              onClick={() => setSelected(t.id)}
            >
{t.name}
</div>
          ))}
</div>

        <p className="subtitle" style={{ marginBottom: 12 }}>Mau berapa foto dalam satu frame?</p>
        <div className="count-grid">
{[1, 2, 3].map((n) => (
                <div
                             key={n}
              className={`count-option ${photoCount === n ? "selected" : ""}`}
              onClick={() => setPhotoCount(n)}
            >
{n}
</div>
          ))}
</div>

        <button
          onClick={handleNext}
          disabled={!selected}
          style={{ background: config.theme.primary }}
        >
                        Lanjut ke Kamera
                            </button>
                            </div>
                            </div>
  );
}
