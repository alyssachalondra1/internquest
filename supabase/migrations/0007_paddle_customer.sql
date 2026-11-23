-- ============================================================================
-- 0007_paddle_customer.sql — simpan Paddle customer id untuk Paddle Retain
-- Kolomnya boleh kosong: hanya terisi setelah pengguna menyelesaikan pembayaran
-- lewat Paddle (webhook menuliskan `customer_id` dari transaksi).
-- ============================================================================

alter table public.profiles
  add column if not exists paddle_customer_id text;

comment on column public.profiles.paddle_customer_id is
  'Paddle customer id (ctm_...). Diisi webhook setelah pembayaran; dipakai untuk pwCustomer (Paddle Retain).';
