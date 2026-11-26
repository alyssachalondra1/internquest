# Polar — pembayaran internasional (USD)

Polar menggantikan Paddle sejak 26 Nov 2026. Polar adalah **Merchant of Record**: ia yang menagih pajak,
menerbitkan struk, dan menangani pengembalian dana, jadi tidak ada pajak yang perlu kita hitung sendiri.

## Yang sudah dibuat di akun produksi

| Paket | Nama produk di Polar | Harga | ID produk | ID harga |
|---|---|---|---|---|
| Plus | Sloe Plus - 1 month | USD 4.99 | `4eaf393b-067f-4416-b828-e91e30b35cbc` | `c218dde4-e3fa-4175-bf75-1b77f796f258` |
| Pro | Sloe Pro - 1 month | USD 9.99 | `18c61d69-0285-430b-9930-50c0301ca5b9` | `3a65f802-5f6e-4063-aba0-3d0f2cad6b40` |
| Top-Up | Sloe Top-Up - 30 gems | USD 2.99 | `11d477d3-49ef-44cd-b0a6-b9faf64997b2` | `f3b3cd17-032b-4f27-8b02-c837817a8863` |

Semuanya **sekali bayar** (tanpa `recurring_interval`), sesuai model pass prabayar Sloe.

Webhook endpoint: `https://sloe.my.id/api/polar/webhook` (id `68924c8f-c855-4742-9aff-18ef14aea0c8`),
format `raw`, API version `2026-10`, event `order.paid`, `order.refunded`, `order.created`.

Organisasi Polar: `4e5a4b54-c149-4fb8-b45c-17ceb77df7fb`.

## Variabel lingkungan

```
POLAR_ENVIRONMENT=production
POLAR_ACCESS_TOKEN=polar_oat_...
POLAR_PRODUCT_PLUS=4eaf393b-067f-4416-b828-e91e30b35cbc
POLAR_PRODUCT_PRO=18c61d69-0285-430b-9930-50c0301ca5b9
POLAR_PRODUCT_TOPUP=11d477d3-49ef-44cd-b0a6-b9faf64997b2
POLAR_WEBHOOK_SECRET=whsec_...
```

Semua server-only kecuali tiga ID produk (aman diketahui publik, tapi tetap disimpan di env supaya
sandbox dan produksi bisa dibedakan tanpa mengubah kode).

## Alur pembayaran

1. Tombol USD di `/pricing` memanggil Server Action `createPolarCheckout`.
2. Action menulis baris `passes` (status `pending`, `amount` dalam **sen USD**, `payment_type='polar'`)
   lebih dulu, lalu membuat checkout session Polar dan mengembalikan URL-nya.
3. Browser diarahkan ke checkout Polar (kartu, Apple Pay, Google Pay).
4. `order.paid` masuk ke webhook: tanda tangan diverifikasi, `metadata.order_id` dicocokkan ke baris
   `passes`, jumlahnya dibandingkan, lalu `apply_paid_pass` memberi paket dan gems.

`order_id` memakai awalan `SLOE-POLAR-`, dan `payment_type='polar'`, sehingga baris Polar mudah
dibedakan dari baris Midtrans saat rekonsiliasi.

## Menjalankan ulang perintah Polar

Skrip pemasangan resmi hanya untuk macOS dan Linux. Di Windows, pakai paket npm:

```
npx -y -p @polar-sh/cli polar products list
```

Token dibaca dari `POLAR_ACCESS_TOKEN`.

## Catatan

- Polar tidak punya migrasi otomatis dari Paddle; hanya pelanggan Stripe yang bisa dipindahkan otomatis.
- Biaya Polar sama dengan Paddle: 5% + $0.50 per transaksi.
- Kolom `passes.midtrans_id` menyimpan ID transaksi dari provider mana pun; `payment_type` yang
  menentukan asalnya. Namanya historis, bukan tanda bahwa baris itu milik Midtrans.
