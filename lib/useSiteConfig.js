import { useState, useEffect } from "react";

// Hook client-side untuk ambil pengaturan situs + daftar template
// dari /api/config, supaya perubahan admin langsung kepakai tanpa redeploy.
export default function useSiteConfig(eventSlug) {
    const [site, setSite] = useState(null);
    const [templates, setTemplates] = useState(null);

  useEffect(() => {
        if (!eventSlug) return;
        let cancelled = false;
        fetch(`/api/config?event=${eventSlug}`)
          .then((res) => res.json())
          .then((data) => {
                    if (cancelled) return;
                    setSite(data.site);
                    setTemplates(data.templates);
          })
          .catch(() => {});
        return () => {
                cancelled = true;
        };
  }, [eventSlug]);

  return { site, templates, loading: !site || !templates };
}
