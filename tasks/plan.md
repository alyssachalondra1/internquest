# Implementation Plan — Billing & AI System (Sloe / Internquest)

Source spec: `Pricing_Strategy.md`, `Handoff_API_dan_Sistem.md` (Obsidian "Decisions Log", 16 Nov 2026).

## Overview
Monetisasi B2C mahasiswa: tiga tier (Free / Plus / Pro) + top-up Gems, AI lewat OpenRouter, pass prabayar via Midtrans (QRIS/e-wallet). Urutan kerja dikunci: skema dulu, lalu kuota AI server-side, pangkas ekonomi gratis, pindah OpenRouter, batas grup, billing, terakhir UI. AGENTS.md = aturan mutlak (plan-before-building, `getUser()`, scope `user_id`, server-authoritative).

## Architecture Decisions
- **Skema**: `supabase/migrations/0001_init.sql` = sumber kebenaran (diekspor dari produksi, Jalur A).
- **Kuota AI**: kolom di `profiles` (`plan`, `ai_credits`, `credits_reset_at`, `ai_shot_credits`) + RPC atomik `consume_ai_credit(p_kind)` pakai `auth.uid()` (pola `add_xp`), potong setelah sukses.
- **Batas grup**: ditanam di RPC `create_group` / `join_group_by_code`, bukan UI.
- **Billing**: tabel `passes` + webhook Midtrans dengan verifikasi signature; pass prabayar (bukan auto-renew).
- **AI**: satu fungsi `chat()` ke OpenRouter `/chat/completions`; resize gambar ≤768px; catat token/biaya.

## Task List

### Phase 1: Foundation — T1 Skema (SELESAI, dengan temuan)
- [x] `supabase/migrations/0001_init.sql` (tabel + RPC + RLS + policies).
- [x] Verifikasi kecocokan dengan `src/app/actions/*` dan `src/app/api/*`.
- [x] `tasks/plan.md` + `tasks/todo.md`.
- [x] Hapus `supabase_schema.sql` (0 byte).
- [ ] **T1-F1**: Resolusi mismatch kolom `ai_generations` (kode: `answer_type/tone/length/content` vs migrasi: `type/input/output`).
- [ ] **T1-F2**: Tambah `CREATE TRIGGER handle_new_user` (fungsi ada, trigger tidak) — wajib agar profil auto-terbentuk di DB baru.
- [ ] **T1-F3**: Deklarasi storage buckets `posters`, `cvs`, `avatars` + storage RLS (tidak ada di migrasi).

### Checkpoint: Foundation
- [ ] `db diff` bersih / `db reset` sukses setelah T1-F1..F3.
- [ ] Build hijau.

### Phase 2: Kuota AI — T2
- [ ] Kolom kuota di `profiles`.
- [ ] RPC `consume_ai_credit` (auth.uid()).
- [ ] Gate di `extract`, `cv-extract`, `generate`, `match`.
- [ ] Free ke-11 aksi → 402 dengan pesan upgrade.

### Phase 3: Pangkas ekonomi — T3
- [ ] welcome 20→5, harian +5→+1, achievement 25→0; hapus biaya 3 gems di `/api/generate`.

### Phase 4: OpenRouter — T4
- [ ] `src/lib/ai.ts` → `/chat/completions`, fallback chain per task.
- [ ] Resize ≤768px, `max_tokens`, log token & biaya ke `ai_generations`.

### Phase 5: Batas grup — T5
- [ ] Limit di `create_group` / `join_group_by_code` (free 2/10, plus 10/30, pro unlimited).

### Phase 6: Billing — T6
- [ ] Tabel `passes`, `/api/midtrans/webhook` (signature), halaman harga.

### Phase 7: UI — T7
- [ ] Meter kuota, modal upgrade, halaman 3 kolom, gate avatar premium.

### Task terpisah (setelah T1, sesuai instruksi)
- [ ] **Hardening `add_xp`**: ganti `p_user` dari client → `auth.uid()` di SQL; sinkronkan `gamification.ts`.

## Hasil Verifikasi T1 (migrasi vs kode)
| Area | Status |
|---|---|
| Tabel dipakai kode (profiles, internships, checklist_items, ai_generations, study_groups, group_members, group_internships, testimonials, feedback) | ✅ Ada semua |
| RPC dipakai kode (add_xp, create_group, join_group_by_code, my_groups, group_members_view) | ✅ Ada semua, signature cocok |
| `ai_generations` kolom | ❌ Mismatch (lihat T1-F1) |
| Trigger `handle_new_user` | ⚠️ Fungsi ada, trigger tidak di-bind (T1-F2) |
| Storage bucket `posters/cvs/avatars` | ⚠️ Tidak dideklarasikan (T1-F3) |
| Tabel ekstra (achievements, user_achievements, quests) | ℹ️ Ada di migrasi, tak dipakai kode — tidak berbahaya |
| Policies duplikat (public + authenticated) | ℹ️ Redundan, tidak berbahaya |

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| `ai_generations` mismatch | High — AI history tak tersimpan, badge AI tak unlock | T1-F1: putuskan bentuk kanonik sebelum T2 |
| Trigger profil tak ada | High — user baru tanpa baris `profiles` | T1-F2 sebelum rilis |
| Storage bucket tak ada | Med — upload gagal di DB baru | T1-F3 |
| `add_xp` terima `p_user` | Med — XP bisa diberikan ke user lain | Task hardening terpisah |

## Open Questions
- Bentuk kanonik `ai_generations`: ikut kode (`answer_type/tone/length/content`) atau DB (`type/input/output`)?
- Sertakan trigger + storage bucket ke `0001_init.sql` atau migrasi baru terpisah?

---

# Plan — Lanjutan Billing & Perbaikan (22 Nov 2026)

Sumber: instruksi user 22 Nov 2026 + `Handoff_API_dan_Sistem.md` (T6/T7). Status: **menunggu approval**.

## Temuan audit (read-only, 22 Nov 2026)

| Cek | Hasil |
|---|---|
| 0001–0004 di DB produksi | **Ada.** `group_plan_limits` ada dan `create_group` menjawab `NOT_AUTHENTICATED` = versi 0004, jadi limit grup sudah live. |
| 0005 (`passes` + `apply_paid_pass`) | **BELUM ada di produksi** (`PGRST205`, `PGRST202`) → webhook Midtrans mustahil jalan, `createCheckout` gagal di insert. |
| Env lokal | `.env.local` hanya URL + anon key + GEMINI + OPENROUTER. `MIDTRANS_SERVER_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` belum ada. |
| Kuota gratis AI | Sudah di server (4 route → 402 + pesan). UI menampilkan pesannya, tapi field `needUpgrade` tidak dipakai → tidak ada CTA upgrade di momen kena batas. |
| Katalog top-up | Belum ada. `passes.plan` CHECK hanya `plus|pro`, `PlanId` hanya `plus|pro`. |
| Bug buat grup | Server Action melempar `Error`; di produksi Next menutup pesan asli jadi "An error occurred in the Server Components render" → pesan bisnis (mis. limit gratis) ikut hilang. |

## Bug "tidak bisa buat grup" — analisis

`create_group` di produksi = versi 0004 (sudah ada cek limit). Untuk user free limitnya **2 grup dibuat**, dan error bisnis itu dilempar sebagai exception → di-mask Next jadi pesan tak berguna di UI.

Jadi ada dua penyebab yang mungkin, dan keduanya harus dibereskan:
1. **Pesan bisnis hilang** (pasti terjadi): limit `GROUP_CREATE_LIMIT` tidak pernah bisa dibaca user. Ini bug nyata.
2. **Penyebab asli** belum pasti: kalau akun itu sudah memiliki ≥2 grup lama (dibuat sebelum T5), maka "tidak bisa buat grup" = limitnya bekerja, bukan kerusakan.

A1 memperbaiki #1 supaya penyebab #2 (atau apa pun yang lain) terbaca. Setelah A1 + retry, penyebab asli pasti terlihat.

## Task List

### Phase A — Perbaikan bug grup (W1)
- [ ] A1 `src/app/actions/groups.ts`: `createGroup`/`joinGroup` tidak lagi melempar, tapi mengembalikan `{ok,id}` / `{ok:false,error,needsUpgrade}`. Pesan SQL `GROUP_CREATE_LIMIT`/`GROUP_JOIN_LIMIT` dipetakan ke bahasa manusia + `needsUpgrade: true`.
- [ ] A2 `src/components/GroupsClient.tsx`: pakai hasil bertipe; saat `needsUpgrade` tampilkan tautan "See plans" → `/pricing`.

### Phase B — Midtrans + katalog top-up (W2)
- [ ] B1 Jalankan `0005_passes.sql` di produksi (belum pernah jalan) — **butuh akses DB dari user**.
- [ ] B2 `supabase/migrations/0006_topup_passes.sql`: perluas CHECK `passes.plan` → `plus|pro|topup`; `apply_paid_pass` menangani topup = +10 `ai_credits` tanpa mengubah `plan` (dan tidak membuang top-up saat jendela bulanan sudah lewat).
- [ ] B3 `src/lib/midtrans.ts`: `PlanId` + `topup` (`Rp10.000`, item "10 AI actions"); `enabled_payments` = `qris, gopay, shopeepay` → VA/kartu benar-benar tersembunyi sesuai keputusan.
- [ ] B4 `src/app/actions/payments.ts` + `src/components/UpgradeButton.tsx`: izinkan `topup`.
- [ ] B5 `/pricing`: kartu/strip top-up "10 AI actions · Rp10.000", copy bayar jadi QRIS/e-wallet (buang kata "card").
- [ ] B6 Env di Vercel (`MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`) + notification URL di dashboard Midtrans; `docs/payments/midtrans-setup.md` diperbarui.

### Phase C — Reset gems user lama (W3)
- [ ] C1 `supabase/migrations/0007_gems_cap.sql`: `update public.profiles set gems = 30 where gems > 30;` (dibatasi `> 30` supaya user baru yang punya 5 gems tidak ikut naik).

### Phase D — Batas user gratis terlihat (W4)
- [ ] D1 Saat respons 402 `needUpgrade` dari `/api/extract|cv-extract|match|generate`, tampilkan CTA "See plans" di samping pesan (bukan hanya teks).
- [ ] D2 Meter kuota pindah/duplikat ke header app shell (`x/N aksi AI bulan ini`) — T7.

### Checkpoint
- [ ] `npm run build` + `npm run lint` hijau.
- [ ] SQL 0005/0006/0007 sudah jalan di produksi.
- [ ] Satu pembayaran sandbox QRIS end-to-end: webhook → `plan` naik / `ai_credits` +10.
- [ ] Buat grup di produksi menampilkan pesan yang jelas (berhasil, atau alasan sebenarnya).

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Penyebab bug grup bukan limit | Med — salah diagnosis | A1 bikin penyebab asli terbaca; retry setelah deploy |
| Migrasi dijalankan setengah (0006 sebelum 0005) | High — `passes` tak ada | 0005 wajib lebih dulu |
| Top-up terbakar karena jendela bulanan sudah lewat | Med — user rugi | B2 menangani kasus ini di SQL |
| `SUPABASE_SERVICE_ROLE_KEY` belum ada di Vercel | High — checkout & webhook 503 | B6, dicek sebelum tes sandbox |
| Reset gems salah sasaran | Med — ekonomi longgar | Dibatasi `gems > 30`, satu arah, tanpa jalur baru di UI |

## Open Questions
- Berapa grup yang dimiliki akun uji itu di produksi? (memastikan penyebab bug grup)
- Top-up menambah `ai_credits` (bukan gems) — benar?
- Siapa yang menjalankan SQL 0005/0006/0007: user paste di SQL Editor, atau aku lewat `npx supabase login` + `db push`?
- Key Midtrans sandbox akun sudah tersedia?
