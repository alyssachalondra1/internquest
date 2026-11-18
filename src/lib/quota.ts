import type { SupabaseClient } from "@supabase/supabase-js"

// Plan → monthly AI action quota. Mirrors Pricing_Strategy.md.
export const PLAN_CREDITS: Record<string, number> = { free: 10, plus: 100, pro: 300 }
export const FREE_SHOT_CREDITS = 5

export type Quota = { plan: string; credits: number; shotCredits: number }

export function planCredits(plan: string | null | undefined): number {
  return PLAN_CREDITS[plan ?? "free"] ?? PLAN_CREDITS.free
}

// Reads the effective remaining quota, accounting for a due monthly reset.
export async function readQuota(supabase: SupabaseClient, userId: string): Promise<Quota> {
  const { data } = await supabase
    .from("profiles")
    .select("plan, ai_credits, ai_shot_credits, credits_reset_at")
    .eq("id", userId)
    .single()

  const plan = (data?.plan as string | null) ?? "free"
  const resetAt = data?.credits_reset_at as string | null
  const resetDue = !resetAt || new Date(resetAt).getTime() <= Date.now()
  const credits = resetDue ? planCredits(plan) : ((data?.ai_credits as number | null) ?? 0)
  const shotCredits = resetDue
    ? plan === "free"
      ? FREE_SHOT_CREDITS
      : -1
    : ((data?.ai_shot_credits as number | null) ?? (plan === "free" ? 0 : -1))

  return { plan, credits, shotCredits }
}

// Atomic debit via RPC. Call AFTER a successful AI action. Returns false on failure.
export async function consumeAiCredit(supabase: SupabaseClient, kind: "ai" | "shot"): Promise<boolean> {
  const { error } = await supabase.rpc("consume_ai_credit", { p_kind: kind })
  return !error
}

// Returns a 402 payload when the user is out of quota, else null.
export function quotaBlocked(kind: "ai" | "shot", q: Quota): { error: string; needUpgrade: true } | null {
  if (kind === "shot" && q.shotCredits === 0) {
    return {
      error: "You've reached your monthly screenshot limit. Upgrade to Sloe Plus for unlimited screenshots.",
      needUpgrade: true,
    }
  }
  if (q.credits <= 0) {
    return {
      error:
        "You've used all your AI actions this month. Upgrade to Sloe Plus (100 actions) or Sloe Pro (300 actions) to keep going.",
      needUpgrade: true,
    }
  }
  return null
}
