import { useState, useEffect } from "react";
import { useRouter } from "next/router";
const config = require("../../lib/config");

export default function ChooseTemplate() {
    const router = useRouter();
    const { event } = router.query;
    const [selected, setSelected] = useState(null);
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
        router.push(`/${event}/capture`);
  };

  return (
        <div className="screen" style={{ background: config.theme.secondary }}>
      <div className="card">
          <h1>Halo, {guestName}!</h1>
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
