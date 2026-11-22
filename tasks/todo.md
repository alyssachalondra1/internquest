# TODO — Billing & AI (Sloe)

Urutan dikunci. Jangan acak. AGENTS.md = mutlak; plan-before-building + approval sebelum menyentuh kode.

## T1 — Migrasi skema (SELESAI)
- [x] `supabase/migrations/0001_init.sql` dibuat (Jalur A, ekspor produksi).
- [x] Verifikasi kecocokan dengan `src/app/actions/*` + `src/app/api/*`.
- [x] Buat `tasks/plan.md` + `tasks/todo.md`.
- [x] Hapus `supabase_schema.sql` (0 byte).

### T1 follow-ups (SELESAI)
- [x] **T1-F1** `ai_generations` diselaraskan ke kode (`answer_type/tone/length/content`); `saveGeneration` kini cek error + throw (tak gagal senyap).
- [x] **T1-F2** `CREATE TRIGGER handle_new_user` ditambahkan ke `0001_init.sql`.
- [x] **T1-F3** Storage bucket `posters/cvs/avatars` + RLS ditambahkan ke `0001_init.sql`.

### Checkpoint T1
- [ ] `db diff` bersih / `db reset` sukses. (belum dijalankan — CLI/Docker tak tersedia)
- [x] `npm run build` hijau.

## Task terpisah (setelah T1)
- [ ] **Hardening `add_xp`**: ganti argumen `p_user` dari client → `auth.uid()` di SQL; sesuaikan `src/app/actions/gamification.ts`.

## T2 — Kuota AI server-side (SELESAI)
- [x] Kolom `profiles.plan/ai_credits/credits_reset_at/ai_shot_credits` (`supabase/migrations/0002_ai_quota.sql`).
- [x] RPC atomik `consume_ai_credit(p_kind)` pakai `auth.uid()` (lock baris + reset bulanan).
- [x] Gate di `extract`, `cv-extract`, `generate`, `match` via helper `src/lib/quota.ts`; potong **setelah** sukses.
- [x] Kuota habis → 402 + pesan upgrade (Free: 10 aksi, 5 screenshot).
- [x] `/api/generate` kini pakai aksi AI (biaya 3 gems lama dihapus) — bagian dari T3.

## T3 — Pangkas ekonomi gratis (SELESAI)
- [x] welcome 20→5 gems, harian +5→+1, achievement 25→0 (`gamification.ts`).
- [x] Hapus biaya 3 gems di `/api/generate` (diganti aksi AI) — done di T2.

## T4 — OpenRouter (SELESAI; runtime uji manual)
- [x] `src/lib/ai.ts` → OpenRouter `/chat/completions` (teks + vision base64), retry + fallback chain.
- [x] Tier routing: Free=`deepseek-v4.1-flash-1017`(vision)/`deepseek-v4-flash-0731`(teks); Plus/Pro=`gemini-3.1-flash-lite`.
- [x] Resize gambar client-side ≤768px (`compressImage` di AddInternshipModal & GroupAddModal).
- [x] Log token + estimasi biaya Rupiah ke tabel `ai_usage` (`supabase/migrations/0003_ai_usage.sql`, helper `src/lib/usage.ts`).
- [x] **Uji nyata** panggilan AI di produksi dengan OpenRouter (key standar); biaya tercatat di `ai_usage` (~Rp6,7–44,6/aksi).

## T5 — Batas grup + kunci Portfolio (SELESAI)
- [x] `create_group`: free 2 / plus 10 / pro unlimited (`0004_group_limits.sql`).
- [x] `join_group_by_code`: free 10 / plus 30 / pro unlimited; keluar grup membebaskan slot; sudah anggota tak memakai slot.
- [x] **Portfolio dikunci untuk Free**: UI Profile tampil terkunci + ajakan upgrade; server `savePortfolio` menolak bila paket Free. Upload CV tetap gratis.

## T6 — Billing Midtrans
- [x] Tabel `passes` + `/api/midtrans/webhook` (verifikasi signature) + halaman harga (0005, P5).
- [x] 0005 dijalankan di produksi (user, 22 Nov).
- [ ] Env Vercel: `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `NEXT_PUBLIC_APP_URL` + notification URL Midtrans. (`SUPABASE_SERVICE_ROLE_KEY` sudah ada.)
- [x] Katalog **top-up 10 aksi AI / Rp10.000** (`0006_gems.sql` + `PlanId` topup + kartu di `/pricing`).
- [x] `enabled_payments` = qris/gopay/shopeepay (VA & kartu disembunyikan).
- [x] `0006_gems.sql` dijalankan di produksi (user, 22 Nov) — 3 gems/aksi, top-up 30 gems, gems lama dipangkas ke 30.
- [x] Jalur internasional: **Paddle** (bukan Lemon Squeezy — LS tutup 31 Mar 2027). Harga USD dikunci: Plus $4.99 / Pro $9.99 / top-up $2.99.
- [ ] Paddle: buat 3 produk + client token + webhook `/api/paddle/webhook`, lalu isi env di Vercel (lihat `docs/payments/paddle-setup.md`).

## T7 — UI
- [ ] Meter "x/10 aksi AI bulan ini" (sekarang hanya di `/pricing`).
- [x] CTA "See plans" saat 402 `needUpgrade` — `UpgradeNotice` dipakai di Groups + gate portfolio.
- [x] CTA "See plans" saat 402 `needUpgrade`: Groups, portfolio, dan hasil Asisten AI.
- [x] Halaman harga 3 kolom; gate portfolio Free (T5).

## T9 — Perbaikan & pembersihan (22 Nov 2026)
- [ ] **A1/A2** Bug buat grup: `createGroup`/`joinGroup` lempar `Error` → di produksi Next mask jadi "Server Components render". Ubah ke hasil bertipe + pesan limit yang jelas + CTA upgrade.
- [ ] **C1** `0007_gems_cap.sql`: reset gems user lama ke 30 (`where gems > 30`).
- [ ] Verifikasi ulang: batas gratis (10 aksi, 5 screenshot, 2 grup/10 join) konsisten di server + UI.


## T8 — UI/UX Polish (unslop) + Dark Mode
Arah desain: "meja belajar" (kertas, sticky note, pena koreksi) · karakter hangat/rapi/jenaka · aksen biru brand · detail khas = sticky note kuning.
Yang dilindungi: tata letak & palet sidebar, isi kartu daftar lowongan (hanya teksnya berubah).

### P0 — Penyeragaman istilah (SELESAI)
- [x] Semua teks UI "Internship" → "Job / Role / Opportunity"; nav jadi "Jobs"; judul level "Applicant, Level X".
- [x] Meta title/description, Terms §7, Privacy diselaraskan. URL `/internships`, tabel, tipe, dan nama komponen tetap.

### P1 — Emoji → ikon vektor (SELESAI)
- [x] ~30 emoji (🏅 ✨ 🦥 👋 ✉️ 🎉 💌 💜 🔒 ✕ ★) diganti ikon SVG set yang sama; 7 glyph baru ditambah (mail, lock, close, sun, moon).
- [x] Rating bintang testimoni jadi ikon isi/garis, bukan karakter teks.

### P2 — Token warna + Dark Mode (SELESAI)
- [x] Satu lapisan token tema; dark mode mengikuti OS (`prefers-color-scheme`) + toggle manual di topbar & Settings (System/Light/Dark, tersimpan).
- [x] Skrip anti-kedip sebelum paint; tema gelap diverifikasi lewat render nyata (landing & login, desktop & mobile, tanpa error konsol).

### P3a — Sistem maskot tunggal (FONDASI, SELESAI)
- [x] Registry aset: satu peta untuk `mascot-*.png`, `momoface1–6`, `welcomee.png`, `signature-pose.json`, `momo.png.png`.
- [x] Kotak konten terukur per file (cropdetect) → slot mengikuti gambar, bukan kanvas transparan.
- [x] Satu komponen renderer: `contain`/`cover`, alignment, ukuran eksplisit, preload, crossfade (tanpa jeda kosong).
- [x] `Momo`, `HeroMascot`, `MomoFace`, poster Lottie diarahkan ke renderer yang sama; SVG inline generik dibuang.
- [x] Login: keempat slide dipreload, garis kosong 0 dari 40 sampel saat rotasi.
- [ ] Sapu semua titik pakai: ukuran & crop per konteks dinaikkan bertahap di M1 (landing), M2 (login), M3 (achievements/profile).

### P3b — Landing page (unslop penuh) — SELESAI
- [x] 8 kartu gradient-tile dibuang → 4 kelompok fitur (hairline, tanpa kartu) + 1 hero momen.
- [x] Gradient text judul & badge ungu dihapus; latar pucat `#F4F7FE` → kertas hangat `#F7F4EE` (kartu `#FDFBF7`); aksen tunggal biru `#2F6BFF`.
- [x] Hero: split asimetris (teks kiri) + pratinjau produk "desk" (kartu lowongan + status, mono) + sticky note kuning miring berisi satu angka.
- [x] Copy ditulis ulang: "quest" 0×, tanda seru 0×, label uppercase-tracking dihapus; testimoni asli dipertahankan.
- [x] Maskot hero lewat sistem tunggal (`Mascot`), ukuran/crop dari registry; kartu pratinjau & note diproporsikan.
- [x] Dark mode landing punya ramp kertas-gelap sendiri (bukan `--canvas`), kontras teks kecil dinaikkan.
- [x] Verifikasi: `npm run build` hijau; render 1440/390 light+dark, 0 overflow horizontal, 0 teks "Internship".

### P3b2 — Lavender pastel + elemen referensi Aeline (SELESAI)
- [x] Light mode jadi lavender pastel (`#F5F1FE`), token global ikut (`#F5F2FC`); dark mode jadi plum gelap.
- [x] Font: Plus Jakarta Sans → Bricolage Grotesque (display) + Instrument Sans (UI).
- [x] Default tema = light lavender (bukan dark), masih bisa switch System/Light/Dark.
- [x] Landing: 8 kartu pelangi → 3 fitur + strip 3 langkah; copy "quest"/tanda seru dibersihkan.
- [x] Hero: scene peach + pratinjau produk + sticky note; rating proof row (angka asli dari testimoni).
- [x] Stats strip 3 angka jujur (10 aksi AI, 2 grup, 3 langkah) — pola stat row dari referensi.
- [x] Halaman `/pricing` 3 kolom (Free/Plus/Pro) + FAQ; tombol "See plans" di CTA band.
- [x] Dashboard: header "This week" (bukan gradient quest), "Intern Hunter" → "Applicant".
- [x] Verifikasi: build hijau (27 route), render 1440/390 light+dark, 0 overflow, 0 error konsol.

### P3b3 — Hero berpanel + stat cards ala referensi Aeline (SELESAI)
- [x] Hero dibungkus satu panel gradient ungu bersudut bulat + margin; nav di dalam panel.
- [x] Headline/subhead/CTA di-center, satu kolom; ikon pin inline di dalam kalimat.
- [x] Dua kartu mini melayang (Checklist kiri, CV match kanan) mengapit pratinjau; disembunyikan di mobile.
- [x] Stats strip teks → 3 kartu: ungu gradient / putih berisi kutipan review asli / lavender tint, dengan pill.
- [x] Dark mode: panel diberi border tipis + mini card punya permukaan sendiri supaya tidak menyatu.
- [x] Verifikasi: build hijau, render 1440/390 light+dark, 0 overflow, 0 error konsol.

### P3b4 — Revisi 5 poin dari screenshot (SELESAI)
- [x] Landing + pricing jadi satu dunia ungu gelap tetap: kertas `#130E1E`, panel `#2F2154→#2A1E4A`. Tidak lagi lavender terang.
- [x] Pricing: kartu maskot dihapus (`welcomee.png` langsung di atas latar), proporsional & sejajar; kartu plan tinggi seragam.
- [x] Section "Get in touch" dihapus total beserta import `ContactForm`; footer & nav bersih.
- [x] Maskot tanpa kartu di landing (div `.iq-lp__scene` dihapus); kartu melayang mengapit, pratinjau dapat ruang lebih.
- [x] Semua kartu kuning diganti: sticky note `#FEE362` → chip kaca violet di landing, chip putih di CTA band. Nol elemen kuning tersisa (diverifikasi via computed style).
- [x] Tombol: satu radius/tinggi (48px, sm 40px), primary gradient violet, ghost punya permukaan; tombol band tidak lagi transparan.
- [x] Kontras naik: `--lp-ink-2` .82, `--lp-ink-3` .64, byline review .74, footer .66.
- [x] Verifikasi: build hijau, render 1440/390 light+dark, 0 overflow horizontal, 0 error konsol, 0 "Internship", 0 kartu kuning.

### P3c — Login (SELESAI)
- [x] Hero: satu panel ungu gelap dengan `welcomee.png` besar (520px, proporsional), wordmark solid putih.
- [x] Rotasi 4 slide + dots dihapus; satu tagline tetap. Preload gambar sebelum dipakai.
- [x] Satu maskot mengintip (`momoface4`, mood sleepy) di belakang kartu form; `z-index` diperbaiki.
- [x] Kontras teks di panel putih dinaikkan; wordmark gradasi biru→pink diganti solid.
- [x] Verifikasi: build hijau, render 1440/390 light+dark, 0 overflow, 0 error konsol.

### P4 — Achievements & Profile (SELESAI, belum diverifikasi visual)
- [x] Badge: 6 warna acak → satu ramp aksen; ✨ dihapus; sparkle dekorasi dimatikan.
- [x] Maskot achievements dibesarkan (96 → 128, mood love); avatar profil tidak lagi menempel keluar kartu.
- [x] Profil: dua sistem maskot → satu (`Momo`); callout pink → callout aksen; "!" dihapus; copy Indonesia → Inggris.
- [x] Baris angka pakai mono.
- [ ] **Belum dicek visual** — halaman ini butuh login; baru terbukti lewat build.

### P5 — Harga & Midtrans (SELESAI scaffolding)
- [x] `/pricing`: meter kuota AI (`readQuota` + `planCredits`) muncul saat login.
- [x] Migrasi `0005_passes.sql`: tabel `passes`, RLS (tanpa policy insert), fungsi `apply_paid_pass` idempoten.
- [x] `src/lib/midtrans.ts`: Snap client, `isConfigured()`, verifikasi signature SHA-512, deteksi status.
- [x] `src/app/actions/payments.ts`: `createCheckout` — buat order lalu Snap; gagal rapi tanpa key.
- [x] `src/app/api/midtrans/webhook/route.ts`: verifikasi signature → tandai `paid` → `apply_paid_pass`.
- [x] `UpgradeButton` client component; tombol Plus/Pro hanya aktif kalau key ada.
- [x] `docs/payments/midtrans-setup.md`: env var + langkah migrasi.
- [ ] Belum diuji end-to-end — butuh sandbox key + migrasi dijalankan.

### P6 — QA — belum
- [ ] Cek dashboard, calendar, groups, settings, profile, achievements (butuh login).
- [ ] `npm run lint` masih merah pra-ada (`any` di `src/lib/ai.ts` & `sound.ts`).

> Dark mode: **tidak diubah** — tetap ada, bisa switch System/Light/Dark dari topbar & Settings.
