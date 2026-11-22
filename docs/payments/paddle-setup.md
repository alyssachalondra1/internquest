# Paddle setup (jalur internasional / USD)

Checkout USD untuk pembeli luar Indonesia. Paddle adalah *merchant of record*: dia
yang menerima kartu, Apple Pay, dan PayPal, serta menghitung dan menyetor PPN/VAT.
Tarif 5% + $0.50 per transaksi.

Harga yang sudah dikunci: **Plus $4.99**, **Pro $9.99**, **top-up 30 gems $2.99**.
Ketiganya produk **sekali bayar** (bukan langganan berulang), karena model kita pass
prabayar per bulan.

> Tombol USD hanya aktif kalau semua env di bawah terisi. Sebelum itu halaman
> menampilkan "Sign up to pay by card", bukan tombol bayar yang mati.

## 1. Produk di dashboard Paddle

Catalog → Products → New product, tiga kali, harga USD, tipe **one-time**:

| Produk | Harga | Catat |
|---|---|---|
| Sloe Plus | $4.99 | Price ID `pri_...` |
| Sloe Pro | $9.99 | Price ID `pri_...` |
| 30 AI actions top-up | $2.99 | Price ID `pri_...` |

## 2. Client-side token

Developer Tools → Authentication → Client-side tokens. Buat satu token untuk domain
`sloe.my.id`. Token ini memang terlihat di browser; itu memang desainnya.

## 3. Webhook (wajib — di sinilah akses diberikan)

Developer Tools → Notifications → New destination:

```
https://sloe.my.id/api/paddle/webhook
```

Pilih event **`transaction.completed`** saja. Salin **secret key** ke
`PADDLE_WEBHOOK_SECRET`.

Route `/api/paddle/webhook` memeriksa, berurutan:

1. Tanda tangan `Paddle-Signature` = HMAC-SHA256 dari `ts:body` dengan secret.
2. Price ID → paket (`plus` / `pro` / `topup`). Paket datang dari harga yang dibayar,
   bukan dari data yang dikirim browser.
3. Nominal `totals.total` tidak boleh di bawah harga daftar.
4. Baru setelah itu baris `passes` ditulis dan `apply_paid_pass` dipanggil
   (idempoten, jadi notifikasi ulang aman).

`user_id` diambil dari `custom_data` yang dikirim saat checkout. Kalau id itu tidak
valid atau webhook gagal dipasang, pembeli membayar tapi tidak menerima akses —
karena itu pasang webhook **sebelum** mengumumkan jalur ini.

## 4. Environment (Vercel + `.env.local`)

| Variabel | Isi |
|---|---|
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox` saat uji, `production` saat rilis |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | token dari langkah 2 |
| `NEXT_PUBLIC_PADDLE_PRICE_PLUS` | Price ID Plus |
| `NEXT_PUBLIC_PADDLE_PRICE_PRO` | Price ID Pro |
| `NEXT_PUBLIC_PADDLE_PRICE_TOPUP` | Price ID top-up |
| `PADDLE_WEBHOOK_SECRET` | secret dari langkah 3 (server-only) |

Karena variabel `NEXT_PUBLIC_*` ditanam saat build, **redeploy** setelah mengubahnya.

## 5. Uji sebelum produksi

1. `NEXT_PUBLIC_PADDLE_ENV=sandbox`, pakai token sandbox + Price ID sandbox dan
   webhook sandbox.
2. Bayar dengan kartu tes Paddle (`4242 4242 4242 4242`), cek baris `passes` berstatus
   `paid` dengan `payment_type = 'paddle'`, lalu cek `profiles.plan` naik atau
   `gems` bertambah 30 untuk top-up.
3. Ulangi dengan `?currency=USD` untuk melihat halaman versi USD, dan tanpa parameter
   untuk memastikan deteksi negara berjalan.

## 6. Yang belum ada

- Refund/chargeback: status `refunded` ada di tabel tapi belum ditangani webhook.
- Email tanda terima dan pengingat H-3 perpanjangan.
- Pass tahunan (belum dijual di jalur USD).
