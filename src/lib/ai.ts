import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ============================================================
// Model aktif — ganti HANYA di sini bila Google mengubah nama model.
// ============================================================
// Riwayat: gemini-2.0-* DIHENTIKAN (1 Juni 2026). gemini-2.5-flash-lite TIDAK
// tersedia untuk user baru (404 "no longer available to new users").
// Model Flash-Lite yang aktif untuk akun ini = gemini-3.1-flash-lite, dengan
// free tier ~500 request/hari (jauh lebih besar dari Flash biasa yg ~20/hari)
// sekaligus paling murah. Dipakai sebagai model utama untuk SEMUA fitur AI.
// Kalau nanti billing aktif & mau kualitas lebih tinggi, PRIMARY_MODEL boleh
// diganti ke "gemini-3.5-flash".
export const PRIMARY_MODEL = "gemini-3.1-flash-lite"
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

/**
 * Ubah error mentah dari Gemini/SDK jadi pesan singkat & ramah untuk user.
 * Menghindari menampilkan dump JSON panjang (yang juga bikin layout overflow di HP).
 */
export function friendlyAiError(err: any): string {
  const msg = String(err?.message || err || "")
  if (/\b429\b|quota|rate limit|resource_exhausted|too many requests/i.test(msg)) {
    return "Momo is getting a lot of requests right now (Google's free AI quota was hit). Please wait about a minute and try again. If this keeps happening, enable billing in Google AI Studio or use a new API key."
  }
  if (/\b(500|502|503|504)\b|unavailable|overload|high demand/i.test(msg)) {
    return "The AI service is busy for a moment. Please try again in a few seconds."
  }
  if (/api[_ ]?key|unauthenticated|permission denied|\b401\b|\b403\b/i.test(msg)) {
    return "There is a problem with the AI configuration. Please check the GEMINI_API_KEY on Vercel."
  }
  if (/network|fetch failed|timeout|etimedout|enotfound/i.test(msg)) {
    return "Could not reach the AI service. Check your connection and try again."
  }
  return "Could not generate the result. Please try again shortly."
}
