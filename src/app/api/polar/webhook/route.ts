import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { webhooks } from "@polar-sh/sdk/2026-10"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* Polar calls this endpoint. It is the only place a USD pass becomes paid.
   Order of checks: signature first, then the stored amount, then the grant.
   Same shape as the Midtrans route: a request that fails any step is rejected
   without touching data. */

const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET ?? ""

function admin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET() {
  // Which environment this endpoint listens to, without leaking the secret.
  return NextResponse.json({
    configured: Boolean(WEBHOOK_SECRET),
    environment: process.env.POLAR_ENVIRONMENT === "sandbox" ? "sandbox" : "production",
  })
}

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    console.error("[polar] POLAR_WEBHOOK_SECRET is not configured")
    return NextResponse.json({ error: "not configured" }, { status: 503 })
  }

  const body = await request.text()
  let event: webhooks.WebhookPayload
  try {
    event = await webhooks.validateEvent(body, {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
    }, WEBHOOK_SECRET)
  } catch (error) {
    if (error instanceof webhooks.PolarWebhookVerificationError) {
      console.error("[polar] bad signature")
      return NextResponse.json({ error: "bad signature" }, { status: 401 })
    }
    if (error instanceof webhooks.PolarWebhookUnknownTypeError) {
      // Signed, but a type this SDK version does not know: acknowledge anyway.
      return NextResponse.json({ ok: true, unhandled: true }, { status: 202 })
    }
    console.error("[polar] webhook error", error)
    return NextResponse.json({ error: "bad request" }, { status: 400 })
  }

  const db = admin()
  if (!db) {
    console.error("[polar] SUPABASE_SERVICE_ROLE_KEY is not configured")
    return NextResponse.json({ error: "not configured" }, { status: 503 })
  }

  if (event.type === "order.paid") {
    const order = event.data
    const orderId = (order.metadata as Record<string, unknown> | null)?.order_id
    if (typeof orderId !== "string" || !orderId) {
      console.error("[polar] order.paid without metadata.order_id", order.id)
      return NextResponse.json({ ok: true, unmatched: true }, { status: 202 })
    }

    const { data: pass, error: readError } = await db
      .from("passes")
      .select("id, plan, amount, status")
      .eq("order_id", orderId)
      .maybeSingle()
    if (readError) return NextResponse.json({ error: "read failed" }, { status: 500 })
    if (!pass) {
      console.error("[polar] unknown order", orderId)
      return NextResponse.json({ ok: true, unknown: true }, { status: 202 })
    }
    if (pass.status === "paid") return NextResponse.json({ ok: true, already: true })

    // What Polar charged (cents) must equal what we stored. A mismatch means
    // the order was tampered with, so we stop here.
    if (Math.round(Number(order.total_amount)) !== pass.amount) {
      console.error("[polar] amount mismatch", orderId, order.total_amount, pass.amount)
      return NextResponse.json({ error: "amount mismatch" }, { status: 409 })
    }

    const { error: updateError } = await db
      .from("passes")
      .update({
        status: "paid",
        // Column keeps its historical name; it now holds whichever provider's
        // transaction id applies, and payment_type says which one.
        midtrans_id: order.id,
        payment_type: "polar",
        paid_at: new Date().toISOString(),
        raw_status: order.status,
      })
      .eq("id", pass.id)
      .eq("status", "pending")
    if (updateError) return NextResponse.json({ error: "update failed" }, { status: 500 })

    // Grants the plan and tops up credits. Idempotent in SQL.
    const { error: applyError } = await db.rpc("apply_paid_pass", { p_pass_id: pass.id })
    if (applyError) {
      console.error("[polar] apply_paid_pass failed", pass.id, applyError.message)
      return NextResponse.json({ error: "apply failed" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (event.type === "order.refunded") {
    const order = event.data
    const orderId = (order.metadata as Record<string, unknown> | null)?.order_id
    if (typeof orderId === "string" && orderId) {
      await db.from("passes").update({ status: "refunded", raw_status: order.status }).eq("order_id", orderId)
    }
    return NextResponse.json({ ok: true })
  }

  // order.created and anything else: acknowledge so Polar stops retrying.
  return NextResponse.json({ ok: true, ignored: event.type }, { status: 202 })
}
