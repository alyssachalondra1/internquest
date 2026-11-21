# Midtrans setup (paid plans)

Checkout is scaffolded but switched off until the keys below exist. Nothing in
the app grants a paid plan without them.

## 1. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `MIDTRANS_SERVER_KEY` | yes | Sandbox key while testing. Server-only — never `NEXT_PUBLIC_*`. |
| `MIDTRANS_IS_PRODUCTION` | no | `"true"` switches Snap from sandbox to production. Default sandbox. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Already used by delete-account. Needed to write `passes`. |
| `NEXT_PUBLIC_APP_URL` | yes | Used for the Midtrans `finish` callback. |

## 2. Database

Apply `supabase/migrations/0005_passes.sql`. It creates the `passes` table, RLS,
and the `apply_paid_pass` function that grants the plan.

`passes` has **no insert/update policy** on purpose: only the service role writes
it. A signed-in client cannot create or edit a pass.

## 3. Webhook

Point the Midtrans notification URL at:

```
https://<your-domain>/api/midtrans/webhook
```

The route checks, in order:

1. `signature_key` = `sha512(order_id + status_code + gross_amount + server_key)`.
2. The stored `amount` equals the notified `gross_amount`.
3. The pass is still `pending` (paid rows are acknowledged and skipped).

Only then does it mark the pass paid and call `apply_paid_pass`, which sets the
plan and tops up `ai_credits`. Replays are safe.

## 4. What the UI does today

- `/pricing` shows the quota meter when signed in.
- Plus / Pro buttons call `createCheckout` only when `isConfigured()` is true.
- With no key, the buttons stay as links to signup and the page says checkout
  opens soon.

## 5. Still to do before taking real money

- Expiry sweep for abandoned `pending` passes (Midtrans sends `expire`, but a
  cron guard is safer).
- Receipt email on `paid`.
- Refund path: `refund` status is recognised in the table but not handled yet.
