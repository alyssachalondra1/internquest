import type { SupabaseClient } from "@supabase/supabase-js"

/* One AI action costs 3 gems — the number the Generate button shows. The monthly
   allowance in `ai_credits` is already counted in gems; top-up gems bought with a
   pass sit in `profiles.gems`. An action spends the monthly allowance first. */
export const GEMS_PER_ACTION = 3
export const PLAN_CREDITS: Record<string, number> = { free: 30, plus: 300, pro: 900 }
export const FREE_SHOT_CREDITS = 5

export type Quota = { plan: string; credits: number; topup: number; shotCredits: number }

export function planCredits(plan: string | null | undefined): number {
  return PLAN_CREDITS[plan ?? "free"] ?? PLAN_CREDITS.free
}

// Reads the effective remaining quota, accounting for a due monthly reset.
export async function readQuota(supabase: SupabaseClient, userId: string): Promise<Quota> {
  const { data } = await supabase
    .from("profiles")
    .select("plan, ai_credits, ai_shot_credits, credits_reset_at, gems")
    .eq("id", userId)
    .single()

  const plan = (data?.plan as string | null) ?? "free"
  const resetAt = data?.credits_reset_at as string | null
  const resetDue = !resetAt || new Date(resetAt).getTime() <= Date.now()
  const monthly = resetDue ? planCredits(plan) : ((data?.ai_credits as number | null) ?? 0)
  const topup = (data?.gems as number | null) ?? 0
  const credits = monthly + topup
  const shotCredits = resetDue
    ? plan === "free"
      ? FREE_SHOT_CREDITS
      : -1
    : ((data?.ai_shot_credits as number | null) ?? (plan === "free" ? 0 : -1))

  return { plan, credits, topup, shotCredits }
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
  if (q.credits < GEMS_PER_ACTION) {
    return {
      error:
        "You've used all your AI actions this month. Top up 10 more for Rp10.000, or upgrade to Sloe Plus (100 actions) or Sloe Pro (300 actions).",
      needUpgrade: true,
    }
  }
  return null
}
