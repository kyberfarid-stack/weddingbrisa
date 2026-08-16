# Virtual Photobooth Pernikahan

Alur: scan QR di kartu undangan → tulis nama tamu → pilih template → foto (kamera/upload) → hasil bisa didownload & di-share manual ke sosmed (bukan auto-upload, sesuai etika privasi tamu).

Data tamu (nama + foto) tersimpan per acara, dan untuk acara/klien lain tinggal duplikat project ini lalu edit `lib/config.js`.

## 1. Coba dulu di laptop kamu (paling cepat, 2 menit)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di browser laptop — alurnya sudah bisa dicoba (nama → template → kamera → hasil). Data tamu tersimpan sementara di `data/guests.json` (mode dev, tanpa Supabase).

## 2. Test langsung dari HP kamu, lewat WiFi yang sama (tanpa perlu publish)

Kamera browser **butuh koneksi aman (HTTPS)** — kecuali kalau diakses via `localhost` atau IP lokal jaringan sendiri, itu masih diizinkan oleh browser.

1. Pastikan laptop & HP nyambung ke WiFi yang sama.
2. Cari IP lokal laptop kamu: `ipconfig` (Windows) atau `ifconfig`/`ip a` (Mac/Linux) → cari yang formatnya `192.168.x.x`.
3. Jalankan `npm run dev` (sudah otomatis listen di semua network interface).
4. Di HP, buka browser ke `http://192.168.x.x:3000` (ganti dengan IP kamu).
5. Kamera & upload foto sudah bisa dicoba langsung dari HP.

Ini bagus untuk uji alur cepat, tapi belum bisa diakses tamu dari luar rumah/venue kamu.

## 3. Publish gratis biar bisa dites dari HP + internet biasa (bukan cuma WiFi rumah)

Supaya bisa diakses dari mana saja (dan nanti dari QR code di kartu undangan), publish ke **Vercel** (hosting gratis, otomatis HTTPS, subdomain gratis seperti `nama-acara.vercel.app`).

### Langkah singkat:

1. Push project ini ke GitHub (repo baru, bisa private).
2. Daftar/login ke [vercel.com](https://vercel.com) pakai akun GitHub — gratis.
3. Klik **New Project** → pilih repo ini → klik **Deploy**. Tunggu ~1 menit.
4. Kamu akan dapat URL publik seperti `https://wedding-photobooth-xxxx.vercel.app` — buka ini dari HP kamu (pakai data seluler, bukan WiFi rumah) untuk memastikan bisa diakses dari mana saja.
5. Domain ini sudah HTTPS otomatis, jadi kamera browser akan berfungsi normal.

### Supaya data tamu tersimpan permanen (sangat disarankan sebelum acara asli)

Tanpa langkah ini, foto tamu **akan hilang** setiap Vercel redeploy project (karena server serverless tidak punya penyimpanan permanen).

1. Daftar gratis di [supabase.com](https://supabase.com), buat **New Project**.
2. Di **SQL Editor**, jalankan:
   ```sql
   create table guests (
     id bigint generated always as identity primary key,
     event_slug text not null,
     name text not null,
     template_id text not null,
     photo_url text not null,
     created_at timestamptz not null default now()
   );
   ```
3. Di **Storage**, buat bucket baru bernama `photobooth`, set **Public bucket** = ON (supaya foto bisa ditampilkan/didownload).
4. Di **Project Settings > API**, salin `Project URL` dan `service_role key` (bukan yang `anon`).
5. Di Vercel: buka project kamu → **Settings > Environment Variables** → tambahkan:
   - `SUPABASE_URL` = Project URL tadi
   - `SUPABASE_SERVICE_KEY` = service_role key tadi
6. Redeploy project (Vercel akan otomatis redeploy setelah env variable ditambahkan, atau klik **Redeploy** manual).

Setelah ini, semua foto & nama tamu tersimpan permanen dan bisa dilihat di `https://domain-kamu.vercel.app/selma-rafi/admin` (masukkan `adminKey` dari `lib/config.js`).

## 4. Bikin QR code untuk kartu undangan

Setelah punya URL publik (`https://xxxx.vercel.app/selma-rafi`), generate QR code-nya gratis di [qr-code-generator.com](https://www.qr-code-generator.com) atau tool sejenis, lalu cetak di kartu undangan/photobooth fisik seperti di video referensi.

## 5. Ganti untuk acara/klien lain

Cukup edit satu file: `lib/config.js` — ganti nama pasangan, tanggal, warna tema, dan `eventSlug` (dipakai di URL). Kalau mau data tamu tiap acara terpisah, buat project/deploy Vercel baru untuk tiap klien (paling simpel), atau kalau mau serius jadi produk multi-klien dalam satu deploy, itu pengembangan lanjutan (bisa dibantu kalau sudah sampai tahap situ).

## Batasan yang perlu kamu tahu

- Upload ke sosmed **tidak otomatis** — tamu tetap yang pilih & konfirmasi mau share ke mana lewat tombol share bawaan HP (Instagram/WhatsApp/TikTok dll muncul di situ). Ini sengaja, supaya tidak ada foto tamu yang ke-upload tanpa mereka sadari/setujui.
- Tanpa Supabase, project ini masih bisa dites penuh tapi data tidak permanen begitu di-deploy ke Vercel.
- Free tier Vercel & Supabase cukup lebih dari cukup untuk skala satu acara pernikahan (ratusan tamu).
