import { useState, useEffect } from "react";
import { useRouter } from "next/router";
const config = require("../../lib/config");

export default function Admin() {
      const router = useRouter();
      const { event } = router.query;
      const [key, setKey] = useState("");
      const [guests, setGuests] = useState(null);
      const [error, setError] = useState("");

  async function load(k) {
          setError("");
          try {
                    const res = await fetch(`/api/guests?key=${encodeURIComponent(k)}`);
                    if (!res.ok) {
                                setError("Key salah atau terjadi kesalahan.");
                                return;
                    }
                    const data = await res.json();
                    setGuests(data.guests);
                    sessionStorage.setItem("adminKey", k);
          } catch (e) {
                    setError("Gagal memuat data.");
          }
  }

  useEffect(() => {
          const saved = sessionStorage.getItem("adminKey");
          if (saved) {
                    setKey(saved);
                    load(saved);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!guests) {
          return (
                    <div className="screen" style={{ background: config.theme.secondary }}>
            <div className="card">
                <h1>Admin — Daftar Tamu</h1>
              <input
                type="text"
                placeholder="Masukkan admin key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
                              <button onClick={() => load(key)} style={{ background: config.theme.primary }}>
            Masuk
                </button>
{error && <p style={{ color: "#a33" }}>{error}</p>}
    </div>
    </div>
    );
}

  return (
          <div className="screen" style={{ alignItems: "flex-start", background: config.theme.secondary }}>
      <div className="card" style={{ maxWidth: 700, textAlign: "left" }}>
        <h1>Daftar Tamu — {config.coupleName}</h1>
        <p className="subtitle">{guests.length} tamu sudah upload foto</p>
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
