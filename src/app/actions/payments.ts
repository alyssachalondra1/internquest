"use server"

import { createClient as createAdmin } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { createSnapTransaction, isConfigured, PLAN_PRICE, type PlanId } from "@/lib/midtrans"

/* Checkout scaffolding.
   The order row is written first (server-side, with the service role), then the
   Snap transaction is created. The browser only ever receives the redirect URL;
   the plan itself is granted by the webhook, never by the client. */

export type CheckoutResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: "not_configured" | "not_logged_in" | "bad_plan" | "failed"; message?: string }

function orderId(userId: string, plan: PlanId): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const tail = userId.replace(/-/g, "").slice(0, 6).toUpperCase()
  return `SLOE-${plan.toUpperCase()}-${stamp}-${tail}`
}

export async function createCheckout(plan: PlanId): Promise<CheckoutResult> {
  if (!isConfigured()) {
    return { ok: false, error: "not_configured" }
  }
  if (plan !== "plus" && plan !== "pro") {
    return { ok: false, error: "bad_plan" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "not_logged_in" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single()

  const amount = PLAN_PRICE[plan]
  const id = orderId(user.id, plan)

  // `passes` has no insert policy: an authenticated client cannot create a row,
  // so a forged "paid" pass is impossible. Writes go through the service role.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return { ok: false, error: "not_configured" }
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Insert first so a webhook that arrives before the user returns still finds
  // a row to update. Status starts as pending; only the webhook moves it.
  const { error: insertError } = await admin.from("passes").insert({
    user_id: user.id,
    plan,
    amount,
    order_id: id,
    status: "pending",
  })
  if (insertError) {
    return { ok: false, error: "failed", message: insertError.message }
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"

  try {
    const snap = await createSnapTransaction({
      orderId: id,
      plan,
      amount,
      customer: { name: profile?.full_name ?? null, email: profile?.email ?? user.email ?? null },
      appUrl: origin,
    })
    return { ok: true, redirectUrl: snap.redirect_url }
  } catch (err) {
    // Leave the row as pending; the expiry job / webhook closes it later.
    return { ok: false, error: "failed", message: err instanceof Error ? err.message : "unknown" }
  }
}
