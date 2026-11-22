import crypto from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { PLAN_PRICE_USD, type PlanId } from "@/lib/plans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* Paddle notification webhook. It is the only place an international purchase
   becomes an entitlement. Order of checks: signature, then the price id (which
   decides the plan), then the amount. Anything that fails is dropped. */

const SECRET = process.env.PADDLE_WEBHOOK_SECRET ?? ""

/** Paddle signs as `Paddle-Signature: ts=<unix>;h1=<hex hmac of "ts:body">`. */
function verifySignature(rawBody: string, header: string | null): boolean {
  if (!SECRET || !header) return false
  const parts: Record<string, string> = {}
  for (const piece of header.split(";")) {
    const [k, v] = piece.split("=")
    if (k && v) parts[k.trim()] = v.trim()
  }
  if (!parts.ts || !parts.h1) return false
  const expected = crypto.createHmac("sha256", SECRET).update(`${parts.ts}:${rawBody}`).digest("hex")
  const given = parts.h1.toLowerCase()
  if (given.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}

function planForPriceId(priceId: string): PlanId | null {
  const map: Array<[PlanId, string | undefined]> = [
    ["plus", process.env.NEXT_PUBLIC_PADDLE_PRICE_PLUS],
    ["pro", process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO],
    ["topup", process.env.NEXT_PUBLIC_PADDLE_PRICE_TOPUP],
  ]
  for (const [plan, id] of map) if (id && id === priceId) return plan
  return null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const raw = await request.text()
  if (!verifySignature(raw, request.headers.get("paddle-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 })
  }

  const eventType = String(body?.event_type ?? "")
  const data = body?.data ?? {}

  // Acknowledge everything we do not act on, so Paddle stops retrying it.
  if (eventType !== "transaction.completed") {
    return NextResponse.json({ ok: true, ignored: eventType || "unknown" })
  }

  const userId = String(data?.custom_data?.user_id ?? "")
  const priceId = String(data?.items?.[0]?.price?.id ?? "")
  const plan = planForPriceId(priceId)

  if (!UUID.test(userId) || !plan) {
    console.error("[paddle] unusable transaction", data?.id, { userId, priceId })
    return NextResponse.json({ error: "unusable transaction" }, { status: 400 })
  }

  // Paddle reports minor units (cents). Refuse anything below the list price.
  const paid = Number(data?.details?.totals?.total ?? 0)
  if (!Number.isFinite(paid) || paid < PLAN_PRICE_USD[plan]) {
    console.error("[paddle] amount below list price", data?.id, paid, PLAN_PRICE_USD[plan])
    return NextResponse.json({ error: "amount mismatch" }, { status: 409 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error("[paddle] SUPABASE_SERVICE_ROLE_KEY is not configured")
    return NextResponse.json({ error: "not configured" }, { status: 503 })
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const orderId = `PADDLE-${String(data?.id ?? "")}`
  const { data: inserted, error: insertError } = await admin
    .from("passes")
    .insert({
      user_id: userId,
      plan,
      amount: PLAN_PRICE_USD[plan],
      order_id: orderId,
      status: "paid",
      midtrans_id: String(data?.id ?? ""),
      payment_type: "paddle",
      paid_at: new Date().toISOString(),
      raw_status: eventType,
    })
    .select("id")
    .single()

  let passId = inserted?.id as string | undefined

  if (insertError) {
    // Unique order_id: this transaction was already recorded. Re-apply anyway,
    // apply_paid_pass is idempotent.
    const { data: existing } = await admin.from("passes").select("id").eq("order_id", orderId).maybeSingle()
    passId = existing?.id as string | undefined
    if (!passId) {
      console.error("[paddle] insert failed", orderId, insertError.message)
      return NextResponse.json({ error: "insert failed" }, { status: 500 })
    }
  }

  const { error: applyError } = await admin.rpc("apply_paid_pass", { p_pass_id: passId })
  if (applyError) {
    console.error("[paddle] apply_paid_pass failed", passId, applyError.message)
    return NextResponse.json({ error: "apply failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
