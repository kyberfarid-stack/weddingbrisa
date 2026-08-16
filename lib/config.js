// =====================================================================
// GANTI FILE INI SETIAP ADA PERNIKAHAN BARU / CLIENT BARU.
// Ini satu-satunya file yang perlu diubah untuk "ganti page" ke acara lain.
// =====================================================================

const config = {
    eventSlug: "selma-rafi",

    coupleName: "Selma & Rafi",
    weddingDate: "16 Agustus 2026",
    welcomeMessage: "Selamat datang di pernikahan kami!",
    thankYouMessage: "Terima kasih telah hadir & merayakan hari bahagia kami",

    theme: {
          primary: "#7a1f2b",
          secondary: "#f4ede4",
          accent: "#d4af37",
          text: "#ffffff",
    },

    templates: [
      {
              id: "polaroid-putih",
              name: "Polaroid Putih",
              style: "polaroid",
              background: "#ffffff",
              textColor: "#333333",
              accent: "#7a1f2b",
      },
      {
              id: "maroon-elegan",
              name: "Maroon Elegan",
              style: "elegant",
              background: "#7a1f2b",
              textColor: "#ffffff",
              accent: "#d4af37",
      },
      {
              id: "gold-mewah",
              name: "Gold Mewah",
              style: "elegant",
              background: "#1a1a1a",
              textColor: "#d4af37",
              accent: "#d4af37",
      },
        ],

    adminKey: "selma-rafi-2026",
};

module.exports = config;
