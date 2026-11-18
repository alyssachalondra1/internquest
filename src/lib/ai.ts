// OpenRouter client (OpenAI-compatible /chat/completions) for both text and vision.
// Replaces the direct @google/generative-ai SDK. Model choice is tier-based:
// Free uses cheap DeepSeek models; Plus/Pro use Gemini Flash Lite (higher accuracy).

export const FREE_VISION_MODEL = "deepseek/deepseek-v4.1-flash-1017"
export const FREE_TEXT_MODEL = "deepseek/deepseek-v4-flash-0731"
export const PREMIUM_VISION_MODEL = "google/gemini-3.1-flash-lite"
export const PREMIUM_TEXT_MODEL = "google/gemini-3.1-flash-lite"

// Kept for backward compatibility with any import that still references them.
export const PRIMARY_MODEL = PREMIUM_TEXT_MODEL
export const LITE_MODEL = FREE_TEXT_MODEL

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const MAX_TOKENS = 1600

export type AiResult = {
  text: string
  model: string
  promptTokens: number
  completionTokens: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function isTransient(msg: string) {
  return /\b(429|500|502|503|504)\b|overload|unavailable|high demand|rate limit|try again|fetch failed|timeout|etimedout|enotfound|econnreset/i.test(
    msg,
  )
}

// Gemini-style parts (string | {text} | {inlineData}) → OpenRouter chat messages.
function toMessages(parts: any): Array<{ role: string; content: any }> {
  if (typeof parts === "string") return [{ role: "user", content: parts }]
  if (!Array.isArray(parts)) return [{ role: "user", content: String(parts ?? "") }]
  const content = parts.map((p: any) => {
    if (typeof p === "string") return { type: "text", text: p }
    if (p?.text) return { type: "text", text: p.text }
    if (p?.inlineData) {
      const mime = p.inlineData.mimeType || "image/png"
      return { type: "image_url", image_url: { url: `data:${mime};base64,${p.inlineData.data}` } }
    }
    return { type: "text", text: "" }
  })
  return [{ role: "user", content }]
}

function hasImage(parts: any): boolean {
  return Array.isArray(parts) && parts.some((p: any) => p?.inlineData)
}

function defaultModels(tier: string, image: boolean): string[] {
  const premium = tier === "plus" || tier === "pro"
  // Vision: Gemini Flash Lite for ALL tiers — DeepSeek vision under-reads
  // Indonesian posters (missed role lists and date ranges). Text stays tier-based.
  if (image) {
    return [PREMIUM_VISION_MODEL, FREE_VISION_MODEL]
  }
  return premium ? [PREMIUM_TEXT_MODEL, FREE_TEXT_MODEL] : [FREE_TEXT_MODEL, PREMIUM_TEXT_MODEL]
}

/**
 * Generate via OpenRouter with auto-retry (429/5xx/network) + model fallback.
 * Pass `tier` (profiles.plan) to pick the model line: free = cheap, plus/pro = premium.
 * `generationConfig.responseMimeType === "application/json"` maps to JSON mode.
 */
export async function generateWithRetry(
  parts: any,
  opts?: {
    models?: string[]
    model?: string
    tier?: string
    json?: boolean
    generationConfig?: { responseMimeType?: string }
    retries?: number
  },
): Promise<AiResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured")

  const image = hasImage(parts)
  const models = opts?.models ?? (opts?.model ? [opts.model] : defaultModels(opts?.tier ?? "free", image))
  const jsonMode = opts?.json ?? opts?.generationConfig?.responseMimeType === "application/json"
  const retries = opts?.retries ?? 2
  const messages = toMessages(parts)

  let lastErr: any
  for (const name of models) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://sloe.my.id",
            "X-Title": "Sloe",
          },
          body: JSON.stringify({
            model: name,
            messages,
            max_tokens: MAX_TOKENS,
            ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
          }),
        })
        if (!res.ok) {
          const body = await res.text()
          throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 200)}`)
        }
        const data = await res.json()
        const raw = data?.choices?.[0]?.message?.content
        const text =
          typeof raw === "string"
            ? raw
            : Array.isArray(raw)
            ? raw.map((c: any) => c?.text || "").join("")
            : ""
        if (!text) throw new Error("Empty AI response")
        const usage = data?.usage || {}
        return {
          text,
          model: data?.model || name,
          promptTokens: Number(usage.prompt_tokens) || 0,
          completionTokens: Number(usage.completion_tokens) || 0,
        }
      } catch (e: any) {
        lastErr = e
        const msg = String(e?.message || "")
        if (attempt < retries && isTransient(msg)) {
          await sleep(700 * (attempt + 1))
          continue
        }
        break // try the next model in the fallback chain
      }
    }
  }
  throw lastErr
}

/** Map raw provider errors to a short, friendly message for the UI. */
export function friendlyAiError(err: any): string {
  const msg = String(err?.message || err || "")
  if (/\b429\b|quota|rate limit|resource_exhausted|too many requests/i.test(msg)) {
    return "Momo is getting a lot of requests right now. Please wait about a minute and try again."
  }
  if (/\b(500|502|503|504)\b|unavailable|overload|high demand/i.test(msg)) {
    return "The AI service is busy for a moment. Please try again in a few seconds."
  }
  if (/api[_ ]?key|unauthenticated|permission denied|\b401\b|\b403\b/i.test(msg)) {
    return "There is a problem with the AI configuration. Please check OPENROUTER_API_KEY on the server."
  }
  if (/network|fetch failed|timeout|etimedout|enotfound|econnreset/i.test(msg)) {
    return "Could not reach the AI service. Check your connection and try again."
  }
  return "Could not generate the result. Please try again shortly."
}
