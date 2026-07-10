import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ============================================================
// Model aktif — ganti HANYA di sini bila Google mengubah nama model.
// ============================================================
export const PRIMARY_MODEL = "gemini-3.5-flash"
export const LITE_MODEL = "gemini-3.1-flash-lite"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function isTransient(msg: string) {
  return /\b(429|500|502|503|504)\b|overload|unavailable|high demand|rate limit|try again/i.test(msg)
}

/**
 * Generate dengan auto-retry (untuk 429/503 dsb) + fallback antar model.
 * `parts` boleh string biasa atau array parts (teks + gambar/pdf) sesuai SDK Gemini.
 */
export async function generateWithRetry(
  parts: any,
  opts?: { models?: string[]; generationConfig?: any; retries?: number },
): Promise<string> {
  const models = opts?.models ?? [PRIMARY_MODEL, LITE_MODEL]
  const retries = opts?.retries ?? 2
  let lastErr: any
  for (const name of models) {
    const model = genAI.getGenerativeModel(
      opts?.generationConfig
        ? { model: name, generationConfig: opts.generationConfig }
        : { model: name },
    )
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await model.generateContent(parts)
        return result.response.text()
      } catch (e: any) {
        lastErr = e
        const msg = String(e?.message || "")
        if (attempt < retries && isTransient(msg)) {
          await sleep(700 * (attempt + 1))
          continue
        }
        break // pindah ke model berikutnya (fallback)
      }
    }
  }
  throw lastErr
}
