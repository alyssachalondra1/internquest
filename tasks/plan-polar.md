# Implementation Plan — Polar menggantikan Paddle (pembayaran USD Sloe)

Source spec: permintaan pemilik 26 Nov 2026 + skil Polar resmi (`setup-polar`, `polar-integration`, `polar-migration`) yang sudah dipasang ke Hermes.

## Kondisi yang sudah diverifikasi (bukan asumsi)
- `curl -fsSL https://polar.sh/install.sh | bash` **tidak jalan di Windows**: skripnya hanya mengenal `Darwin` dan `Linux` (`Unsupported OS: MINGW64_NT-…`). Terverifikasi dari isi skrip.
- Paket npm `@polar-sh/cli` v3.3.0 **jalan di Windows** (`bin/polar.exe`). Terverifikasi: `npx -y -p @polar-sh/cli polar --version` → `polar v3.3.0`.
- `polar agent setup` hanya mengenal Claude Code, Codex, Cursor (tidak ada di mesin ini). Tetapi `--skills global` berhasil dan memasang 4 skil Polar ke `C:\Users\alyss\.agents\skills`, sudah disalin ke skil Hermes (`hermes/skills/polar/`).
- MCP Polar bersifat remote + OAuth: produksi `https://mcp.polar.sh/mcp/polar-mcp`, sandbox `https://mcp.polar.sh/mcp/polar-sandbox`. Hermes menerima MCP lewat `mcp_servers:` di `config.yaml` (bridge `npx -y mcp-remote <url>`).
- Perintah yang tersedia untuk API: `polar products create|list|update`, `polar checkout_links create`, `polar webhooks create_webhook_endpoint`, `polar orders list`, `polar auth token`.
- `polar auth whoami` → **belum login**. Ini satu-satunya penghalang.

## Yang dibutuhkan dari pemilik (kunci akses)
Pilih salah satu:
- **A. Login lewat browser (disarankan, tanpa menyerahkan rahasia):** jalankan
  `npx -y -p @polar-sh/cli polar auth login --sandbox` (atau `--production`).
  Sesi tersimpan di komputer ini, lalu saya bisa membuat produk, checkout link, dan webhook sendiri.
- **B. Organization Access Token:** dashboard Polar → Settings → Access Tokens, scope `products:write`, `checkouts:write`, `webhooks:write`, `orders:read`. Token saya taruh di `.env.local` sebagai `POLAR_ACCESS_TOKEN`, tidak pernah di kode.
- Tambahan: mata uang default organisasi harus **USD** supaya harga USD diterima API.

## Produk yang akan dibuat (sekali jalan, USD, sekali bayar)
| Produk | Nama di Polar | Harga | Isi |
|---|---|---|---|
| plus | Sloe Plus — 1 month | USD 4.99 | 300 gems (100 aksi AI) + portfolio builder |
| pro | Sloe Pro — 1 month | USD 9.99 | 900 gems (300 aksi AI) + grup tanpa batas |
| topup | Sloe Top-Up — 30 gems | USD 2.99 | +30 gems (10 aksi AI) |

Alasan sekali bayar (tanpa `recurring_interval`): pass Sloe memang prabayar satu bulan tanpa auto-renew. Kalau nanti mau langganan otomatis, produknya dibuat terpisah — bukan tugas ini.

## Task List

### Fase 1 — Sambungan (tanpa kode)
- [ ] **T1** Login Polar (A atau B di atas), lalu `polar auth whoami` membuktikan organisasi aktif.
- [ ] **T2** Buat 3 produk USD + simpan ID produk dan ID harga.
- [ ] **T3** Buat webhook endpoint `https://sloe.my.id/api/polar/webhook` (event `order.paid`, `order.refunded`), simpan signing secret.
- [ ] **T4** Daftarkan MCP Polar di `config.yaml` Hermes (bridge `mcp-remote`), verifikasi bisa daftar organisasi.

### Checkpoint A
- [ ] `polar products list` menampilkan 3 produk dengan harga yang benar
- [ ] `polar webhooks list_webhook_endpoints` menampilkan endpoint sloe.my.id

### Fase 2 — Kode (setelah checkpoint A)
- [ ] **T5** `src/lib/polar.ts`: baca `POLAR_ACCESS_TOKEN`, `POLAR_ORG_ID`, ID harga, `POLAR_WEBHOOK_SECRET`, mode sandbox/production dari env. Tanpa kunci → `isConfigured()` false, checkout menolak jujur (pola yang sama dengan `src/lib/midtrans.ts`).
- [ ] **T6** `src/app/actions/payments.ts`: `createCheckout` untuk USD membuat checkout session Polar (pakai `@polar-sh/sdk`) dan mengembalikan URL; baris `passes` tetap ditulis lebih dulu seperti sekarang.
- [ ] **T7** `src/app/api/polar/webhook/route.ts`: verifikasi tanda tangan (standard-webhooks), cek jumlah bayar vs `passes.amount`, lalu panggil `apply_paid_pass` — jalur pemberian akses yang sudah ada, tidak ditulis ulang.
- [ ] **T8** Ganti tombol Paddle → Polar di `src/app/pricing/page.tsx`; hapus `src/lib/paddle.ts`, `src/components/PaddleCheckoutButton.tsx`, `src/app/api/paddle/webhook/route.ts`, dan dokumennya. Midtrans (IDR) tidak disentuh.
- [ ] **T9** `npm uninstall @paddle/paddle-js`, `npm i @polar-sh/sdk`; build + `tsc` bersih.

### Fase 3 — Verifikasi di sandbox
- [ ] **T10** `polar webhook listen` + pembelian uji di sandbox, pastikan `passes.status` jadi `paid` dan gems bertambah. Ini satu-satunya bukti yang dihitung.
- [ ] **T11** Setelah lolos, ulangi T2/T3 di produksi dan tayangkan (`git push`).

## Risks and Mitigations
| Risiko | Dampak | Mitigasi |
|---|---|---|
| Mata uang organisasi bukan USD | Produk gagal dibuat | Cek dulu lewat `polar auth whoami --json`; ubah di dashboard bila perlu |
| Pembayaran lama (Paddle) sudah punya pelanggan | Kehilangan riwayat | Polar tidak punya migrasi otomatis dari Paddle; pelanggan lama bayar ulang. Midtrans (IDR) tetap jalan |
| Webhook Polar gagal diverifikasi | Akses tidak diberikan | Tanda tangan diverifikasi dengan secret dari langkah T3, dan `passes` tetap `pending` sampai cocok — sama seperti jalur Midtrans |
| Fitur Polar butuh Node 22+ (`@polar-sh/sdk` v1) | Build gagal | Node di mesin ini 26.x; Vercel memakai Node 22 |
| Kredensial tersebar | Kebocoran | Semua dari env, `.env.example` diperbarui, tidak ada ID/secret di kode |

## Open Questions
1. Sandbox dulu (uji penuh dengan kartu tes) atau langsung produksi? Usulan: sandbox dulu.
2. Metode pembayaran yang mau dinyalakan di Polar (kartu, Apple Pay, Google Pay, PayPal)? Usulan: semua yang tersedia untuk USD.
3. Setuju T8 menghapus jejak Paddle sepenuhnya, atau mau dibiarkan sebagai cadangan sampai Polar terbukti jalan?
