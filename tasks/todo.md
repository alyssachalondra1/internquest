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
- [ ] Tabel `passes` (user_id, tier, starts_at, ends_at, channel, order_id, status).
- [ ] `/api/midtrans/webhook` (verifikasi signature) + halaman harga QRIS/e-wallet.

## T7 — UI
- [ ] Meter "x/10 aksi AI bulan ini".
- [ ] Modal upgrade di momen kena batas (bukan banner permanen).
- [ ] Halaman harga 3 kolom; gate avatar premium.

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

### P3c — Login — belum
- [ ] Komposisi hero: adegan `welcomee.png` besar, satu maskot mengintip, tagline berhenti berputar.
- [ ] Crossfade slide maskot (lewat renderer baru), ruang kosong diisi.

### P4 — Achievements & Profile — belum
- [ ] Grid badge satu ramp + satu aksen, kartu terkunci tanpa ✨, baris angka mono, satu sistem maskot.

### P5 — Harga & Midtrans — belum
- [ ] Halaman `/pricing` 3 kolom + meter kuota AI + modal upgrade saat kena batas.
- [ ] Tabel `passes`, Server Action transaksi, webhook signature, UI QRIS/e-wallet.

### P6 — QA — belum
- [ ] Cek tiap halaman (light & dark), `npm run lint` (masih merah pra-ada: `any` di `src/lib/ai.ts` & `sound.ts`).

> Dark mode: **tidak diubah** — tetap ada, bisa switch System/Light/Dark dari topbar & Settings.
