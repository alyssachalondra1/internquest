import { NextResponse } from "next/server"
import { generateWithRetry, LITE_MODEL, PRIMARY_MODEL } from "@/lib/ai"

export const runtime = "nodejs"

const PROMPT =
  "Extract the full text content of this CV/resume as clean plain text. " +
  "Keep sections such as education, work/organizational experience, skills, and achievements. " +
  "Output plain text only, no commentary."

export async function POST(req: Request) {
  try {
    const { cv_url } = (await req.json()) as { cv_url?: string }
    if (!cv_url) throw new Error("cv_url wajib")

    const res = await fetch(cv_url)
    const buf = Buffer.from(await res.arrayBuffer())
    const mimeType = res.headers.get("content-type") || "application/pdf"

    const parts: any[] = [
      { text: PROMPT },
      { inlineData: { data: buf.toString("base64"), mimeType } },
    ]
    const text = await generateWithRetry(parts, { models: [LITE_MODEL, PRIMARY_MODEL] })
    return NextResponse.json({ ok: true, text: text.slice(0, 8000) })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "cv extract failed" }, { status: 500 })
  }
}
