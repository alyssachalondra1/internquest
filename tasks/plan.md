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
