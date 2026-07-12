import { NextResponse } from "next/server"
import { generateWithRetry, LITE_MODEL, PRIMARY_MODEL } from "@/lib/ai"

export const runtime = "nodejs"

function stripFences(s: string) {
  return s.replace(/```json/gi, "").replace(/```/g, "").trim()
}

const PROMPT = `You are an assistant that extracts internship details from a job poster image, a web page, or a pasted job description.
Return ONLY valid JSON (no prose) with this exact shape:
{
  "company_name": string,
  "role": string,
  "location": string,
  "work_type": "on-site" | "remote" | "hybrid" | "",
  "is_paid": boolean,
  "deadline": string,        // ISO date YYYY-MM-DD or ""
  "start_date": string,      // ISO date YYYY-MM-DD or ""
  "duration_months": number, // 0 if unknown
  "notes": string,           // requirements / required documents summary, in Indonesian
  "source_url": string       // the application/registration link if any is visible; "" if none
}
Rules:
- Use "" or 0 when a field is missing. Do not invent data.
- If the poster or text contains a link to apply or register (a full URL, bit.ly, tinyurl, s.id, Google Form, or a "daftar di / apply here" link), put it EXACTLY as written into source_url.
- Write notes in Indonesian. Do not use the em dash character. Do not use fire emoji.`

// Ambil teks mentah dari sebuah URL (best-effort). Situs ber-login seperti LinkedIn sering memblokir ini.
async function fetchUrlText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    })
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
    return text.slice(0, 8000)
  } catch {
    return ""
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { poster_url, text, source_url } = body as {
      poster_url?: string
      text?: string
      source_url?: string
    }

    const parts: any[] = [{ text: PROMPT }]
    let fetched = ""
    if (source_url) {
      fetched = await fetchUrlText(source_url)
      parts.push({ text: "SOURCE URL: " + source_url })
      if (fetched) parts.push({ text: "PAGE CONTENT FROM THAT URL:\n" + fetched })
    }
    if (text) parts.push({ text: "JOB TEXT:\n" + text })
    if (poster_url) {
      const img = await fetch(poster_url)
      const buf = Buffer.from(await img.arrayBuffer())
      const mimeType = img.headers.get("content-type") || "image/png"
      parts.push({ inlineData: { data: buf.toString("base64"), mimeType } })
      parts.push({ text: "Extract the details from the poster image above, including any application link visible on it." })
    }

    const raw = stripFences(
      await generateWithRetry(parts, {
        models: [LITE_MODEL, PRIMARY_MODEL],
        generationConfig: { responseMimeType: "application/json" },
      }),
    )
    const parsed = JSON.parse(raw)
    if (source_url && !parsed.source_url) parsed.source_url = source_url

    const linkedinBlocked =
      !!source_url && /linkedin\.com/i.test(source_url) && !fetched && !parsed.company_name
    return NextResponse.json({
      ok: true,
      data: parsed,
      warning: linkedinBlocked
        ? "LinkedIn membatasi akses otomatis, jadi sebagian data mungkin kosong. Lengkapi manual, atau salin-tempel teks lowongannya lewat opsi Tempel JD."
        : undefined,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "extract failed" }, { status: 500 })
  }
}
