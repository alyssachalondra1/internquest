import crypto from "node:crypto"

/* Midtrans scaffolding.
   Snap is used so the payment page (QRIS, e-wallet, bank transfer) is hosted by
   Midtrans and we never touch card data. Nothing here runs without keys: when
   MIDTRANS_SERVER_KEY is missing, isConfigured() is false and the checkout
   action refuses instead of pretending. */

export type PlanId = "plus" | "pro"

export const PLAN_PRICE: Record<PlanId, number> = { plus: 19900, pro: 39900 }
export const PLAN_LABEL: Record<PlanId, string> = { plus: "Sloe Plus", pro: "Sloe Pro" }

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? ""
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
        name: `${PLAN_LABEL[args.plan]} — 1 month`,
      },
    ],
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
  if (!isConfigured()) return false
  const expected = crypto
    .createHash("sha512")
    .update(`${input.order_id}${input.status_code}${input.gross_amount}${SERVER_KEY}`)
    .digest("hex")
  const given = (input.signature_key || "").toLowerCase()
  if (given.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given))
}

/** Midtrans statuses that mean the money arrived. */
export function isPaidStatus(status: string): boolean {
  return status === "capture" || status === "settlement"
}

/** Statuses that close a pending pass without payment. */
export function isDeadStatus(status: string): boolean {
  return status === "expire" || status === "cancel" || status === "deny" || status === "failure"
}
