import type { SupabaseClient } from "@supabase/supabase-js"
import type { AiResult } from "@/lib/ai"

// Rough $/M-token rates (OpenRouter, 16 Nov 2026) and USD→IDR.
const USD_TO_IDR = 18259
const RATE = {
  cheapIn: 0.036,
  cheapOut: 0.5,
  premiumIn: 0.25,
  premiumOut: 1.5,
}

export function estimateCostIdr(model: string, promptTokens: number, completionTokens: number): number {
  const premium = /gemini/i.test(model)
  const inRate = premium ? RATE.premiumIn : RATE.cheapIn
  const outRate = premium ? RATE.premiumOut : RATE.cheapOut
  const usd = (promptTokens / 1e6) * inRate + (completionTokens / 1e6) * outRate
  return Math.round(usd * USD_TO_IDR * 100) / 100
}

// Best-effort audit log. Never blocks the user-facing request.
export async function logAiUsage(
  supabase: SupabaseClient,
  userId: string,
  kind: string,
  r: AiResult,
): Promise<void> {
  try {
    await supabase.from("ai_usage").insert({
      user_id: userId,
      kind,
      model: r.model,
      prompt_tokens: r.promptTokens,
      completion_tokens: r.completionTokens,
      cost_idr: estimateCostIdr(r.model, r.promptTokens, r.completionTokens),
    })
  } catch {
    // usage logging is non-critical
  }
}
