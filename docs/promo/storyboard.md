# Storyboard — Sloe promo (9:16, ~56 detik)

Status: **draft untuk disetujui**. Belum ada render. Semua render di laptop sendiri.

---

## 1. Hasil bedah video referensi

Ketiga video: 576×1024 (9:16), 30 fps, durasi 45–54 detik. Gayanya identik, dan itu yang kita tiru:

| Aspek | Temuan | Cara kita tiru |
|---|---|---|
| Jenis gambar | 3D low-poly, bukan 2D/vektor. Terasa seperti clay/papercraft | Blender, model primitif, tanpa subdivision |
| Proporsi | Kepala besar (chibi), badan kecil, tangan blok | Head ±1,4× lebar bahu |
| Wajah | Dua titik mata, garis mulut, hidung segitiga kecil. Tanpa alis detail | Mata = UV sphere kecil, mulut = cube tipis |
| Rambut | Bongkahan poligon tajam, `shade flat`, tanpa helai | 6–9 mesh terpisah, shade flat |
| Material | Matte, tanpa kilau. Roughness tinggi | Principled BSDF roughness 0,75, metallic 0 |
| Cahaya | Satu area light hangat dari atas-kiri + ambient occlusion, latar gelap | Area light 2×2 m, world biru gelap |
| Kamera | Sedikit low-angle, depth of field dangkal, latar blur | 50 mm, f/2.0, fokus di wajah |
| Animasi karakter | **Minimal**: diam, idle napas, kedip, kepala miring. Cerita dibawa kamera & pose | Idle loop 4 detik, blink acak 24–60 frame |
| Palet | Malam redup: biru desaturasi, coklat kayu hangat, aksen terang hanya di layar | Lihat tabel palet di §6 |

Yang **tidak** kita bawa: teks besar ber-outline hijau neon dan gaya caption meme. Teks dan suara jadi milik kita.

---

## 2. Alur cerita (gabungan ide kamu + ide saya)

Satu perempuan 22 tahun, malam, kamar. Masalahnya bukan "tidak ada lowongan" — masalahnya lowongannya berserakan dan tidak ada yang memberi tahu mana yang layak dikejar. Sloe masuk sebagai satu tautan dari teman, lalu mengubah kekacauan jadi urutan kerja.

Durasi total **56 detik**, 9 adegan.

| # | Waktu | Adegan | Visual | Kamera | Teks di layar | Voice over |
|---|---|---|---|---|---|---|
| 1 | 0:00–0:06 | Kamar malam | Jendela terbuka, bulan, tirai bergoyang pelan. Meja: laptop, HP, sticky notes, cangkir. Karakter duduk membungkuk, dagu di tangan, mata setengah tutup | Medium, push-in 5% | A job hunt shouldn't feel like a second job | "Cari kerja itu nggak seharusnya jadi kerjaan kedua." |
| 2 | 0:06–0:12 | Kekacauan | Tiga potongan cepat: galeri penuh screenshot poster, DM berisi link mentah, lalu spreadsheet: teks 9 pt, kolom deadline kosong, `#REF!`, baris ganda. Mata karakter menyipit, kepala makin dekat layar | Over-shoulder → makro layar | 14 tabs. 3 apps. 0 clarity | "Screenshot di galeri. Link di DM. Semua disalin ke spreadsheet, dan tetap nggak kelihatan mana yang harus dikejar dulu." |
| 3 | 0:12–0:17 | Notif teman | HP tergeletak di meja, layar menyala. Notif: "coba sloe.my.id, aku udah pakai". Zoom ke layar, jari menekan. Kamera turun ke level meja | Close-up, fokus rakitan | — | "Sampai temanmu kirim satu link." |
| 4 | 0:17–0:26 | Scan poster | Layar HP memenuhi frame; karakter keluar dari frame, fokus pindah ke UI. Modal Add job → pilih poster → garis scan biru menyapu atas ke bawah → field terisi satu per satu: Company, Role, Location, Deadline | Full-screen UI, parallax halus | Scan a poster. Get the details | "Upload posternya. Sloe baca sendiri: perusahaan, posisi, lokasi, deadline." |
| 5 | 0:26–0:32 | Dari kacau ke jelas | Match cut: grid spreadsheet memudar → kartu lowongan berwarna (biru, kuning, hijau) dengan status pill, chip deadline, progress. Counter lowongan naik | Pull-back, kartu melayang seperti papan | From mess to a plan | "Satu tempat, rapi, dan kelihatan mana yang mendesak." |
| 6 | 0:32–0:39 | Match score | Klik "Check match" → cincin 87% terisi, tiga alasan muncul, lalu saran "what to improve" | UI | 87% match · 3 ways to improve | "Cek kecocokan sebelum kirim. Delapan puluh tujuh persen, plus tiga hal yang bisa kamu perbaiki." |
| 7 | 0:39–0:46 | Email ke HR | Panel AI writer: pilih "Email to HR", pilih nada, Generate → teks mengetik cepat. Chip "from your CV" dan "portfolio". Tombol Send | UI, sedikit tilt | Written from your CV | "Lalu surat yang benar-benar nyambung sama CV dan portofoliomu. Tinggal kirim." |
| 8 | 0:46–0:52 | Grup | Daftar lowongan makin panjang. Create group → nama "Finance Interns 2026" → kode 6 huruf muncul → kartu grup menyebar ke tiga avatar teman | UI + sedikit pull-back | One code, whole class | "Dan kalau lowonganmu banyak, bagi ke grup. Satu kode, seisi kelas dapat." |
| 9 | 0:52–0:58 | Penutup | Kembali ke kamar. Karakter bersandar, senyum tipis, tirai masih bergoyang. UI mengecil ke sudut | Static, cahaya lampu | sloe.my.id — free to start · 10 AI actions a month | "Sloe. Biar kamu fokus melamar, bukan merapikan." |

Catatan transisi: perpindahan dari 3D ke UI memakai **bubble bulat** di kanan bawah sebagai jembatan — sama seperti yang kamu minta, karakter tidak hilang saat layar jadi penuh.

---

## 3. Data lowongan (fiktif, jangan pakai yang asli)

| Perusahaan | Posisi | Lokasi | Deadline | Status |
|---|---|---|---|---|
| Lumino Studio | Social Media Intern | Jakarta · Hybrid | 12 Dec | Applied |
| Kopi Senja | Community & Barista Intern | Bandung · On-site | 30 Dec | Interview |
| PT Nusakarsa Data | Data Analyst Intern | Surabaya · Remote | 5 Jan | To apply |
| Bumi Retail | Supply Chain Intern | Jakarta · On-site | 20 Dec | To apply |
| Rasa Raya | Marketing Intern | Yogyakarta · Hybrid | 8 Jan | Screening |

Semua nama perusahaan karangan. Sebelum rilis, cek cepat di mesin pencari supaya tidak kebetulan sama nama perusahaan nyata.

---

## 4. Suara

**Status: kunci ElevenLabs belum ada.** Saya cari di `.env.example`, `.env.local`, dan berkas env lain di folder proyek — tidak ada `ELEVENLABS_API_KEY`. `.env.example` yang sekarang juga tidak memuatnya. Tolong taruh di `.env.local` (jangan di `.env.example`, karena berkas itu sekarang ikut ter-commit ke GitHub).

Profil suara yang saya pilih untuk cerita ini: perempuan 24–30, hangat dan tenang, tempo lambat (≈145 kata/menit), tanpa nada iklan, seperti bercerita ke teman. Bahasa: Indonesia, karena penontonnya mahasiswa Indonesia, sementara UI di layar tetap Inggris.

Kandidat dari pustaka ElevenLabs yang akan saya coba begitu kuncinya ada: **Jessica** (percakapan, muda), **Sarah** (narasi lembut), **Matilda** (hangat, sedikit berat). Saya akan hasilkan satu kalimat uji dari masing-masing, lalu kamu pilih satu. Kalau tidak ada yang cocok, saya buat voice design sendiri.

---

## 5. Pembagian kerja

Saya yang menulis semua kode; kamu yang menjalankan render.

1. **`promo/build_scene.py`** — skrip Blender: membangun kamar, karakter low-poly, cahaya, kamera, dan animasi per adegan (1, 2, 3, 9), lalu render PNG sequence.
2. **`promo/ui/index.html` + `promo/ui/capture.js`** — adegan UI (4–8) sebagai halaman HTML dengan timeline berbasis waktu, lalu Puppeteer mengambil 30 frame per detik supaya teks tajam.
3. **`promo/assemble.sh`** — ffmpeg: gabung frame 3D + UI, tempel bubble, masukin VO + musik, keluarkan MP4 1080×1920.
4. **`promo/voice.sh`** — panggil ElevenLabs untuk tiap baris VO, simpan per adegan supaya mudah diganti.

Yang kamu butuhkan di laptop: Blender 4.2+, Node 20+, ffmpeg. Semua gratis.

---

## 6. Spesifikasi teknis

- Resolusi final 1080×1920, 30 fps, H.264, audio AAC 192 kbps.
- Render 3D: EEVEE Next, 64 sample TAA, motion blur tipis. Perkiraan 1–2 detik per frame di GPU laptop → 15–30 menit untuk ±1.100 frame 3D.
- Palet: dinding `#2E3A52`, kayu `#6B4B36`, seprai `#F4F1EA`, kulit `#F2D3C2`, kaus `#1F2A44`, rambut `#15161C`, lampu `#FFC98A`, aksen UI `#3B76FF` dan `#7C5CFF`.
- Font: Bricolage Grotesque untuk judul, Instrument Sans untuk teks kecil (sama dengan situs).
- Musik: lo-fi piano 70 bpm, tanpa drum tajam; ducking −12 dB saat VO.

---

## 7. Keputusan yang sudah diambil

1. **VO Indonesia**, natural, emosinya terdengar, tidak datar. Arah per adegan ada di tabel dan di footer papan visual.
2. **Durasi 58 detik** (masih di rentang 40–60+ yang kamu minta). Kalau nanti mau versi 30 detik untuk iklan berbayar, adegan 2 dan 8 yang dipotong.
3. **Portrait 9:16**, tanpa bubble karakter. Konsekuensinya: karakter hanya hadir di adegan 1–3 dan 9, dan perpindahan ke UI memakai "layar mengambil alih" (HP terangkat mengisi frame), bukan bubble.

Papan visualnya: `docs/promo/storyboard.png` (hasil render `storyboard.html`).
