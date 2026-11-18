import { NextResponse } from "next/server"
import { friendlyAiError, generateWithRetry } from "@/lib/ai"
import { createClient } from "@/lib/supabase/server"
import { consumeAiCredit, quotaBlocked, readQuota } from "@/lib/quota"
import { logAiUsage } from "@/lib/usage"

export const runtime = "nodejs"

const PROMPT =
  "Extract the full text content of this CV/resume as clean plain text. " +
  "Keep sections such as education, work/organizational experience, skills, and achievements. " +
  "Output plain text only, no commentary."

export async function POST(req: Request) {
  try {
    const { cv_url } = (await req.json()) as { cv_url?: string }
    if (!cv_url) throw new Error("cv_url wajib")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 })

    // Server-side quota gate (one action per successful CV read).
    const quota = await readQuota(supabase, user.id)
    const blocked = quotaBlocked("ai", quota)
    if (blocked) return NextResponse.json({ ok: false, ...blocked }, { status: 402 })

    const res = await fetch(cv_url)
    const buf = Buffer.from(await res.arrayBuffer())
    const mimeType = res.headers.get("content-type") || "application/pdf"

    const parts: any[] = [
      { text: PROMPT },
      { inlineData: { data: buf.toString("base64"), mimeType } },
    ]
    const ai = await generateWithRetry(parts, { tier: quota.plan })
    const text = ai.text

    // Record token/cost, then consume one AI action only after a successful read.
    await logAiUsage(supabase, user.id, "cv", ai)
    await consumeAiCredit(supabase, "ai")

    return NextResponse.json({ ok: true, text: text.slice(0, 8000) })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: friendlyAiError(err) }, { status: 500 })
  }
}
