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
- [ ] `db diff` bersih / `db reset` sukses.
- [ ] `npm run build` hijau.

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
- [ ] **Uji nyata 20–30 panggilan** dengan `OPENROUTER_API_KEY` di `.env.local` (belum bisa dijalankan di sesi ini).

## T5 — Batas grup di RPC
- [ ] `create_group`: free 2 / plus 10 / pro unlimited.
- [ ] `join_group_by_code`: free 10 / plus 30 / pro unlimited. Keluar grup membebaskan slot.

## T6 — Billing Midtrans
- [ ] Tabel `passes` (user_id, tier, starts_at, ends_at, channel, order_id, status).
- [ ] `/api/midtrans/webhook` (verifikasi signature) + halaman harga QRIS/e-wallet.

## T7 — UI
- [ ] Meter "x/10 aksi AI bulan ini".
- [ ] Modal upgrade di momen kena batas (bukan banner permanen).
- [ ] Halaman harga 3 kolom; gate avatar premium.
