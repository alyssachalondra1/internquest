# AGENTS.md — InternQuest

Panduan kerja wajib untuk agen apa pun yang mengubah repo ini. Baca seluruh file ini sebelum menyentuh kode.

## 1. Proyek & Tech Stack

- **Framework:** Next.js **16.2.10** (App Router, Server Components + Server Actions), React **19.2.4**.
- **Bahasa:** TypeScript 5 (strict). Styling: **Tailwind v4** (`@tailwindcss/postcss`) + util `src/lib/csx.ts` untuk inline style.
- **Backend/DB/Auth:** **Supabase** (`@supabase/supabase-js` 2.110, `@supabase/ssr` 0.12) sebagai satu-satunya backend. Tidak ada ORM terpisah — semua akses lewat `@supabase/*`.
- **AI:** Google Gemini via `@google/generative-ai` + `src/lib/ai.ts`; model yang dicatat di DB: `gemini-3.1-flash-lite`.
- **Email:** Resend API (dipanggil dari `src/app/actions/feedback.ts` via HTTP).
- **Lain:** `lottie-react` (mascot/celebrations), `@vercel/analytics`.
- **Scripts:** `dev` / `build` / `start` / `lint` (ESLint 9 + `eslint-config-next`). Selalu jalankan `npm run build` + `npm run lint` sebelum menandai tugas selesai.

## 2. Struktur Folder Inti

```
src/
  app/
    (app)/            # area login-required, layout AppShell
      dashboard/ internships/ internships/[id]/ calendar/
      achievements/ ai/ groups/ groups/[id]/ profile/ settings/
    (auth)/login/     # area publik auth
    auth/callback/    # OAuth/PKCE callback
    privacy/ terms/ reset-password/
    actions/          # >>> SEMUA Server Actions (mutasi) <<<
      gamification.ts internships.ts groups.ts profile.ts ai.ts feedback.ts testimonials.ts
    api/              # Route Handlers (HTTP): cv-extract/ extract/ generate/ match/ delete-account/ health/
  components/         # UI client (AddInternshipModal, ChecklistCard, StatusActions, GroupsClient, dll.)
  lib/
    supabase/server.ts   # createClient() server-side (cookie/session)
    supabase/client.ts   # createClient() browser (hanya untuk realtime/auth client)
    achievements.ts      # SUMBER TUNGGAL definisi badge (computeBadges)
    ai.ts / csx.ts / helpers.ts / mascot.ts / sound.ts
```

Aturan penempatan:
- **Mutasi tulis ke DB → Server Action** di `src/app/actions/*.ts` ber-`"use server"`. Jangan menulis ke DB dari komponen client.
- **Integrasi pihak ketiga / streaming / webhook → Route Handler** di `src/app/api/*/route.ts`.
- **Logika domain bersama (badge, perhitungan) → `src/lib/*`**, dipakai ulang oleh action DAN halaman (contoh: `computeBadges` dipakai `achievements/page.tsx` dan `gamification.ts`). Jangan duplikasi logika badge di tempat lain.

## 3. Keamanan: Server Actions & Supabase RPC (KETAT)

Setiap Server Action baru **wajib** mengikuti pola baku yang sudah ada di repo:

1. **Awali file dengan `"use server"`.** Jangan pernah ekspor fungsi non-async dari file action.
2. **Autentikasi dulu, di dalam action** (bukan hanya di middleware/halaman):
   ```ts
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) redirect("/login")   // atau `return` untuk action non-kritis
   ```
   Jangan pernah memakai `getSession()` untuk otorisasi — hanya `getUser()` (validasi ke server).
3. **Jangan pernah percaya `user_id` dari client.** Selalu derives `user.id` dari sesi server, dan set `user_id: user.id` saat insert/update.
4. **Setiap query tulis/baca wajib di-scope `.eq("user_id", user.id)`** (defense-in-depth di atas RLS). Contoh pola: `update(...).eq("id", id).eq("user_id", user.id)`. Jangan mengandalkan RLS saja.
5. **RLS tetap aktif di Supabase** — anggap itu lapisan kedua, bukan pengganti #4.
6. **Validasi input di boundary**: trim/bersihkan string dari client sebelum masuk DB (lihat `groups.ts` yang `clean` nama grup). Jangan lempar objek client mentah ke `.insert()` tanpa whitelist kolom.
7. **Supabase RPC** (`supabase.rpc(...)`) hanya untuk operasi atomik/logika DB:
   - RPC yang menulis **harus `SECURITY DEFINER` terkontrol** dan **mengambil `user.id` dari sesi**, bukan menerima `p_user` dari client. RPC `add_xp` saat ini menerima `p_user` dari parameter — **ini risiko**: panggilan yang salah/jahat bisa memberi XP ke user lain. Setiap RPC baru wajib memakai `auth.uid()` di dalam SQL, bukan parameter user.
   - Jangan menambah RPC yang menerima ID user sebagai argumen yang bisa dikendalikan client.
8. **Jangan menambah `service_role` key** ke kode client atau action apa pun tanpa kebutuhan eksplisit dan review. Env Supabase hanya lewat `@/lib/supabase/*`.
9. **Jangan log/ekspos** isi `profiles`, token, atau data pribadi ke `console` atau pesan error yang dikembalikan ke client.

## 4. Aturan Bisnis: PIVOT ke Portal Lowongan Kerja Umum

> **Kebijakan mutlak:** produk ini adalah **portal lowongan kerja umum** untuk kandidat/entry-level dan pengguna umum — **BUKAN aplikasi khusus magang.**

Konsekuensi wajib saat menyentuh kode:
- **Terminologi:** hilangkan framing "internship-only" di teks UI, copy, meta, dan nama fitur publik. Ganti istilah yang mengikat ke magang (mis. "Land an internship offer", "Intern Hunter", label onboarding) dengan istilah netral ("job", "application", "offer"). `src/lib/achievements.ts` dan `achievements/page.tsx` masih memakai bahasa magang — sumber inkonsistensi yang harus diperbaiki saat disentuh.
- **Cakupan data:** entitas lowongan harus mendukung **kerja penuh-waktu, part-time, kontrak, remote, dan magang** — bukan asumsi magang. Field seperti `work_type`, `is_paid`, `duration_months` harus diperlakukan sebagai generik, bukan magang-spesifik.
- **Jangan menambah fitur/default yang mengasumsikan kandidat mahasiswa/pencari magang** (mis. transcript, motivation letter sebagai checklist default). Berhati-hati: `DEFAULT_CHECKLIST` di `internships.ts` saat ini magang-spesifik (`CV, Transcript, Motivation Letter, Portfolio`).
- **Rename internal (nama file/tabel/kolom seperti `internships`, `internship_id`) TIDAK dilakukan tanpa migrasi eksplisit** — risiko data. Untuk perubahan kosmetik/UI, ubah teks saja; untuk rename skema, tunggu instruksi dan sediakan migrasi + fallback.

## 5. Aturan Ekonomi & Gamifikasi: XP & Gems DIPERKETAT & LANGKA

> **Kebijakan mutlak:** XP dan Gems adalah mata uang engagement yang **sengaja dibuat langka**. Fitur "generous" dipangkas agar item berharga punya **nilai jual untuk tier Premium.** Ekonomi saat ini (di bawah) dianggap **legacy & terlalu longgar** dan harus dikurangi.

**Nilai legacy yang harus dipangkas** (temuan, bukan target):
| Sumber | XP kini | Gems kini | Lokasi |
|---|---|---|---|
| Buat entri lowongan | +10 | +3 | `internships.ts:64-65` |
| Status applied / screening / test / interview / offer | 25 / 40 / 50 / 75 / 150 | 5 / 5 / 6 / 10 / 30 | `internships.ts:78-87` |
| Bonus tiap kelipatan 5 lamaran | — | +15 | `internships.ts:95` |
| Centang checklist | +15 | +2 | `internships.ts:110-111` |
| Login harian | — | 20 (pertama) / 5 (harian) | `gamification.ts:53,57` |
| Streak kelipatan 7 | — | +15 | `gamification.ts:60` |
| Tiap badge baru | — | +25 | `gamification.ts:77` |
| Generate AI | — | −3 (biaya) | `ai/page.tsx:149` |
| Level | target = `level * 200` XP | — | `achievements/page.tsx:27` |

Aturan wajib:
1. **Turunkan reward default secara default-deny.** Setiap perubahan angka reward harus **menurun** atau netral kecuali instruksi eksplisit menaikkan. Jangan menambah jalur pemberian XP/Gems baru (event baru, login bonus, dsb.) tanpa perintah eksplisit.
2. **XP & Gems adalah sumber kelangkaan untuk Premium.** Fitur yang "mudah didapat" (bonus harian besar, reward per checklist, achievement gems) adalah kandidat utama untuk dipindahkan ke balik tier Premium. Saat menambah fitur bernilai, tanyakan: "apakah ini seharusnya gratis, atau premium?" Default: **premium**.
3. **XP hanya naik via RPC `add_xp`** (satu-satunya jalur; RPC juga menghitung ulang level). Jangan menulis `profiles.xp` langsung dari TypeScript.
4. **Gems: hentikan pola read-modify-write.** `addGems` (dan `touchStreak`/`syncAchievementGems`) membaca `gems` lalu menulis `current + amount` — **race condition**, hilang-update saat concurrent, dan mudah dieksploitasi untuk inflasi. Perbaikan yang benar: **RPC atomik `add_gems(p_amount)`** yang memakai `auth.uid()` di DB, sama seperti `add_xp`. Ini prasyarat sebelum memperketat ekonomi, karena angka langka wajib anti-inflasi.
5. **Server-authoritative:** biaya/kredit Gems (mis. biaya generate AI = 3) **tidak boleh dihitung di client**. Validasi saldo dan potong Gems di Server Action/RPC, bukan di UI. Saat ini biaya generate hanya tampil di UI — celah untuk mendapatkan hasil AI gratis.
6. **Idempotensi reward achievement:** `awarded_achievements` mencegah double-grant badge — pertahankan pola ini untuk setiap reward one-time baru.
7. **Dokumen nilai yang baru.** Setiap perubahan angka XP/Gems harus punya satu tempat kebenaran (konstanta bernama seperti `ACHIEVEMENT_GEMS`, bukan magic number tersebar).
8. **Jangan pernah menambah mekanisme "reset/refund/free grant"** Gems/XP di UI tanpa otorisasi server + review.

## 6. Alur Kerja & Git (WAJIB)

1. **Plan-before-building:** sebelum mengubah **kode proyek apa pun**, susun rencana perbaikan (gunakan skill `planning-and-task-breakdown`) dan **minta persetujuan user dulu**. Jangan menulis/mengubah satu baris kode proyek tanpa approval.
2. **Skill wajib** untuk pekerjaan software-development di repo ini: `planning-and-task-breakdown`, `security-and-hardening`, `frontend-ui-engineering`, `debugging-and-error-recovery`. Gunakan **hanya** empat ini; hindari skill debugging lama yang tumpang tindih.
3. **Analisis dulu** kode terkait sebelum mengubah; jaga fitur yang ada; perubahan terfokus, jangan menyentuh file yang tidak berkaitan.
4. **Jalankan `npm run build` + `npm run lint`** setelah implementasi, dan laporkan file yang diubah + ringkasan + error/asumsi secara jujur.
5. **Git:** kerja hanya di branch **`ai-development`**. Jangan commit/push/modifikasi `main` atau menjalankan perintah Git destruktif tanpa approval.
6. **Database:** jangan ubah skema/tabel/RLS/migrasi, dan jangan pernah sentuh database produksi tanpa approval.
7. **Secret:** jangan pernah membaca/menampilkan isi file `.env`, dan jangan mengekspos key/kredensial.