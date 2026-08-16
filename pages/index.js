import { useEffect } from "react";
import { useRouter } from "next/router";
const config = require("../lib/config");

// Halaman root otomatis redirect ke acara yang aktif (dari config.js).
// Ini yang di-encode jadi QR code di kartu undangan.
export default function Home() {
    const router = useRouter();

  useEffect(() => {
        router.replace(`/${config.eventSlug}`);
  }, [router]);

  return (
        <div className="screen">
          <p>Mengalihkan ke fotobooth...</p>
    </div>
    );
}
