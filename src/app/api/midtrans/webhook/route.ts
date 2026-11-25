import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { isPaidStatus, isDeadStatus, verifySignature, signatureKeyCount, keyFingerprint } from "@/lib/midtrans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Notification = {
  order_id?: string
  status_code?: string
  gross_amount?: string
  signature_key?: string
  transaction_id?: string
  transaction_status?: string
  fraud_status?: string
  payment_type?: string
  expiry_time?: string
}

/* Midtrans calls this endpoint. It is the only place a pass becomes paid.
   Order of checks matters: signature first, then the stored amount, then the
   status. A request that fails any step is rejected without touching data. */
export async function GET() {
  // Which environment the webhook is listening to, without leaking the secret.
  return NextResponse.json(keyFingerprint())
}

export async function POST(request: Request) {
  let body: Notification
  try {
    body = (await request.json()) as Notification
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 })
  }

  const orderId = body.order_id
  const statusCode = body.status_code
  const grossAmount = body.gross_amount
  const signature = body.signature_key

  if (!orderId || !statusCode || !grossAmount || !signature) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  if (signatureKeyCount() === 0) {
    console.error("[midtrans] no server key configured — every notification will fail")
    return NextResponse.json({ error: "key not configured" }, { status: 503 })
  }

  if (!verifySignature({ order_id: orderId, status_code: statusCode, gross_amount: grossAmount, signature_key: signature })) {
    // Say which order failed and how many keys are in play; never log the keys.
    console.error("[midtrans] bad signature", { orderId, statusCode, grossAmount, keys: signatureKeyCount() })
    return NextResponse.json({ error: "bad signature", keys: signatureKeyCount() }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error("[midtrans] SUPABASE_SERVICE_ROLE_KEY is not configured")
    return NextResponse.json({ error: "not configured" }, { status: 503 })
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: pass, error: readError } = await admin
    .from("passes")
    .select("id, user_id, plan, amount, status")
    .eq("order_id", orderId)
    .maybeSingle()

  if (readError) return NextResponse.json({ error: "read failed" }, { status: 500 })
  if (!pass) return NextResponse.json({ error: "unknown order" }, { status: 404 })

  // The amount we stored must match what Midtrans says was charged. A mismatch
  // means the order was tampered with, so we stop here.
  const charged = Number(grossAmount)
  if (!Number.isFinite(charged) || Math.round(charged) !== pass.amount) {
    console.error("[midtrans] amount mismatch", orderId, grossAmount, pass.amount)
    return NextResponse.json({ error: "amount mismatch" }, { status: 409 })
  }

  const status = body.transaction_status ?? ""
  const fraud = body.fraud_status ?? ""

  // Already settled: acknowledge so Midtrans stops retrying.
  if (pass.status === "paid") {
    return NextResponse.json({ ok: true, already: true })
  }

  const paid = isPaidStatus(status) && (fraud === "" || fraud === "accept")

  if (paid) {
    const { error: updateError } = await admin
      .from("passes")
      .update({
        status: "paid",
        midtrans_id: body.transaction_id ?? null,
        payment_type: body.payment_type ?? null,
        paid_at: new Date().toISOString(),
        raw_status: status,
      })
      .eq("id", pass.id)
      .eq("status", "pending")

    if (updateError) return NextResponse.json({ error: "update failed" }, { status: 500 })

    // Grants the plan and tops up credits. Idempotent in SQL.
    const { error: applyError } = await admin.rpc("apply_paid_pass", { p_pass_id: pass.id })
    if (applyError) {
      console.error("[midtrans] apply_paid_pass failed", pass.id, applyError.message)
      return NextResponse.json({ error: "apply failed" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (isDeadStatus(status)) {
    await admin
      .from("passes")
      .update({ status: status === "expire" ? "expired" : "failed", raw_status: status })
      .eq("id", pass.id)
      .eq("status", "pending")
    return NextResponse.json({ ok: true, closed: true })
  }

  // Pending / other intermediate states: record what we saw and wait.
  await admin.from("passes").update({ raw_status: status }).eq("id", pass.id)
  return NextResponse.json({ ok: true, pending: true })
}
