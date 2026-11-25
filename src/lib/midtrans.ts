import crypto from "node:crypto"
import { PLAN_LABEL, PLAN_PRICE, type PlanId } from "@/lib/plans"

/* Midtrans scaffolding.
   Snap is used so the payment page (QRIS, e-wallet, bank transfer) is hosted by
   Midtrans and we never touch card data. Nothing here runs without keys: when
   MIDTRANS_SERVER_KEY is missing, isConfigured() is false and the checkout
   action refuses instead of pretending. */

// Prices and labels live in @/lib/plans (shared with the upsell UI). Re-exported
// so existing callers keep importing them from here.
export { PLAN_LABEL, PLAN_PRICE }
export type { PlanId }

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? ""
/* Midtrans signs every notification with the server key of the environment it
   came from: sandbox notifications use the sandbox key, live ones the live key.
   While the account is still being reviewed we accept both, but only when the
   operator turns this on — every extra key is another thing that can sign a
   notification. Turn it off once the live key is the only one in use. */
const SANDBOX_SIGN_KEY =
  process.env.MIDTRANS_ALLOW_SANDBOX_WEBHOOK === "true"
    ? process.env.MIDTRANS_SANDBOX_SERVER_KEY ?? ""
    : ""
const SIGN_KEYS = [SERVER_KEY, SANDBOX_SIGN_KEY].filter((k) => k.length > 0)
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true"
const SNAP_BASE = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions"

export function isConfigured(): boolean {
  return SERVER_KEY.length > 0
}

export type SnapResult = {
  token: string
  redirect_url: string
}

/**
 * Creates a Snap transaction. The order id is ours and is stored in `passes`
 * before this is called, so a webhook can always be matched back to a row.
 */
export async function createSnapTransaction(args: {
  orderId: string
  plan: PlanId
  amount: number
  customer: { name?: string | null; email?: string | null }
  appUrl: string
}): Promise<SnapResult> {
  if (!isConfigured()) throw new Error("MIDTRANS_NOT_CONFIGURED")

  const body = {
    transaction_details: { order_id: args.orderId, gross_amount: args.amount },
    item_details: [
      {
        id: args.plan,
        price: args.amount,
        quantity: 1,
        name: args.plan === "topup" ? `${PLAN_LABEL.topup} (10 AI actions)` : `${PLAN_LABEL[args.plan]} — 1 month`,
      },
    ],
    // Decision 16 Nov: QRIS and e-wallets only; virtual accounts and cards stay hidden.
    enabled_payments: ["qris", "gopay", "shopeepay"],
    customer_details: {
      first_name: args.customer.name || "Sloe user",
      email: args.customer.email || undefined,
    },
    callbacks: { finish: `${args.appUrl}/pricing?paid=1` },
    expiry: { unit: "hours", duration: 24 },
  }

  const res = await fetch(SNAP_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Basic " + Buffer.from(`${SERVER_KEY}:`).toString("base64"),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`MIDTRANS_HTTP_${res.status}${text ? ": " + text.slice(0, 200) : ""}`)
  }

  const json = (await res.json()) as SnapResult
  if (!json?.token) throw new Error("MIDTRANS_NO_TOKEN")
  return json
}

/**
 * Midtrans signs webhook notifications as
 * sha512(order_id + status_code + gross_amount + server_key).
 * Anything that does not match is dropped before it can touch the database.
 */
export function verifySignature(input: {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
}): boolean {
  if (SIGN_KEYS.length === 0) return false
  const given = (input.signature_key || "").toLowerCase()
  const payload = `${input.order_id}${input.status_code}${input.gross_amount}`
  return SIGN_KEYS.some((key) => {
    const expected = crypto.createHash("sha512").update(payload + key).digest("hex")
    if (given.length !== expected.length) return false
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given))
  })
}

/** How many server keys can currently sign a notification. Used for diagnostics. */
export function signatureKeyCount(): number {
  return SIGN_KEYS.length
}

/** Midtrans statuses that mean the money arrived. */
export function isPaidStatus(status: string): boolean {
  return status === "capture" || status === "settlement"
}

/** Statuses that close a pending pass without payment. */
export function isDeadStatus(status: string): boolean {
  return status === "expire" || status === "cancel" || status === "deny" || status === "failure"
}
