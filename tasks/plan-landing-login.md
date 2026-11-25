# Implementation Plan — Revisi Tema Terang Landing Page & Halaman Login (Sloe)

Source spec: `Brief Revisi UI Landing Page & Login - Sloe.pdf` (Downloads, 25 Nov 2026) — Gambar 1–6 sudah diekstrak dan dibaca.

## Overview
Mengembalikan Landing Page (`/`, `src/app/page.tsx`) dan halaman Login (`/login`) ke tema terang dengan latar *soft ambient gradient* (dasar putih + pendaran biru lembut kiri atas, kuning kanan atas, sapuan pink bawah), memakai satu keluarga font yang seragam di kedua halaman, dan mengganti kartu-kartu gelap yang mengambang di area hero dengan tiga kartu resmi Sloe (Card Signature pink, Upcoming Deadlines, CV & Company Match) berisi data dummy fiktif. Desain kartu, sudut, skema warna, dan proporsinya tidak diubah.

## Architecture Decisions
- **CSS sebagai sumber perubahan, bukan JSX baru.** Kartu acuan sudah ada di produk: `iq-icard iq-icard--{tone}` + `iq-icard__top/title/sub/meta/foot` + `iq-chip` (Gambar 4, di `InternshipsClient.tsx`), `iq-dl__*` (Gambar 5, di `dashboard/page.tsx`), `iq-match__score`/`iq-match__bar` (Gambar 6, di `MatchCard.tsx`). Landing memakai **class yang sama** dengan data dummy, jadi desainnya identik tanpa menyalin CSS.
- **Tema terang dikunci di landing.** Brief minta landing selalu terang; token `--lp-*` untuk landing/Auth dipisah dari `:root[data-theme="dark"]` milik aplikasi, sehingga halaman dalam app tetap punya mode gelapnya.
- **Font berskop, bukan global.** Font bulat (acuan Gambar 3) hanya meng-override `--font` / `--font-display` di dalam `.iq-lp` dan `.iq-lg`. Aplikasi di belakang login tidak ikut berubah.
- **Kartu di landing bersifat pratinjau.** Tombol Apply / Recalculate / Calendar dirender non-interaktif (`aria-hidden`, tidak masuk tab order) supaya tidak ada tombol mati yang bisa diklik pengunjung. Bukan bagian dari desain kartu, jadi tidak melanggar aturan "jangan ubah desain kartu".

## Task List

### Phase 1: Tema & tipografi
- [x] **T1 — Latar soft gradient + light mode landing** (S)
  Terima kriteria: `.iq-lp` berlatar putih dengan tiga pendaran gradien (biru kiri atas, kuning kanan atas, pink bawah); `.iq-lp__panel` tidak lagi memakai gradien ungu gelap (baris 659 dan override baris 1547 dihapus/diganti); judul hero, nav, eyebrow, dan teks panel memakai tinta gelap dan tetap terbaca (kontras ≥ 4.5:1 pada teks kecil).
  Verifikasi: build lolos; screenshot landing desktop + mobile.
  Files: `src/app/globals.css`.
- [x] **T2 — Font seragam landing + login** (S)
  Terima kriteria: satu family font bulat (acuan Gambar 3) terpasang lewat `@import` Google Fonts yang sudah ada; `--font-display` dan `--font` di dalam `.iq-lp` dan `.iq-lg` menunjuk ke family itu; wordmark "Sloe" dan tombol memakai gaya yang sama di dua halaman.
  Verifikasi: screenshot, bandingkan dengan Gambar 3.
  Files: `src/app/globals.css`.
- [x] **T3 — Latar soft gradient halaman Login** (S)
  Terima kriteria: `.iq-lg`, `.iq-lg__brand`, dan `.iq-lg__panel` memakai gradien yang sama dengan landing; kartu login tetap putih dan terbaca.
  Verifikasi: screenshot `/login` desktop + mobile.
  Files: `src/app/globals.css`.

### Checkpoint A (setelah T1–T3)
- [x] Build lolos (`npx next build --webpack`).
- [x] Screenshot terang di dua tema (`light` dan `dark`) — landing harus tetap terang di keduanya.
- [x] Review manusia sebelum lanjut ke kartu.

### Phase 2: Kartu asli dengan data dummy
- [x] **T4 — Card Signature Sloe (Gambar 4)** (S)
  Terima kriteria: kartu pink memakai `iq-icard iq-icard--pink` dengan label waktu, logo/ikon, nama perusahaan dummy, posisi, lokasi · durasi, progress bar, "Checklist n/4", chip status, tombol Apply; tidak ada satu pun nama perusahaan asli dari tangkapan layar (PT SMART Tbk, DHL Group, Samsung Electronics Latinoamerica SELA Panama).
  Verifikasi: grep nama terlarang di `src/app/page.tsx` → nol hasil.
  Files: `src/app/page.tsx`, `src/app/globals.css` (penempatan kartu).
- [x] **T5 — Kartu Upcoming Deadlines (Gambar 5) dan CV & Company Match (Gambar 6)** (M)
  Terima kriteria: kartu putih memakai markup `iq-dl__*` dan `iq-match__*`; titik biru, label "x days", dan tombol "Calendar" dipertahankan; skor persen + progress bar + paragraf analisis + tombol Recalculate dipertahankan, teks analisis menyebut perusahaan dummy; ketiga kartu menggantikan kartu mini gelap dan tabel "This week" yang sekarang mengambang di hero.
  Verifikasi: screenshot bandingkan dengan Gambar 5 & 6.
  Files: `src/app/page.tsx`, `src/app/globals.css`.
- [x] **T6 — Data dummy terpusat** (XS)
  Terima kriteria: seluruh teks dummy (perusahaan, posisi, lokasi, tenggat, paragraf CV) berada di satu konstanta di `src/app/page.tsx` sehingga mudah diganti.
  Verifikasi: satu blok `const DUMMY = {...}` di file itu.

### Checkpoint B (selesai)
- [x] Checklist verifikasi di halaman 5 PDF terpenuhi satu per satu.
- [x] Build lolos, push ke `main` + `ai-development`, deployment hijau.
- [x] Halaman `/`, `/login`, `/pricing` merespons 200 setelah deploy.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Asset maskot (`/mascot-hero.png`) punya latar gelap sehingga terlihat sebagai kotak gelap di atas gradien terang | Med | Periksa dulu dengan screenshot; kalau gelap, pakai `HeroMascot`/`Momo` yang ada atau PNG latar transparan; jangan mengubah aset tanpa konfirmasi |
| Landing gelap sengaja dipilih sebelumnya; mengunci terang menghapus mode gelap landing | Low | Brief eksplisit meminta terang; tetap simpan token `--lp-*` agar mudah dibalik |
| Tombol mati di kartu pratinjau membingungkan | Low | Non-interaktif + tidak masuk tab order |
| Ganti `--font` bisa mengubah metrik teks dan merusak tata letak yang sudah pas | Med | Skop hanya `.iq-lp`/`.iq-lg`, screenshot desktop+mobile setelah perubahan |
| Font yang dipilih tidak persis sama dengan Gambar 3 | Med | Ajukan Baloo 2 + Poppins; kalau kamu punya file font acuan, kirim namanya |

## Open Questions
1. **Font acuan Gambar 3** — dari bentuk hurufnya: *rounded geometric sans*. Usulan: **Baloo 2** untuk judul/wordmark dan **Poppins** untuk teks isi. Kamu punya nama font yang pasti, atau setuju usulan ini?
2. **Font aplikasi di belakang login** — brief hanya menyebut Landing + Login. Usulan: ubah hanya dua halaman itu, aplikasi tetap Bricolage Grotesque + Instrument Sans. Setuju?
3. **Perlu tidaknya file font lokal** (self-host) alih-alih Google Fonts — sekarang proyek memakai `@import` Google Fonts; usulan: tetap begitu, tambah satu family di impor yang sama.
