import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function stripFences(s: string) {
  return s.replace(/```json/gi, "").replace(/```/g, "").trim()
}

const PROMPT = `You are an assistant that extracts internship details from a job poster, link, or pasted job description.
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
  "notes": string            // requirements / required documents summary
}
Use "" or 0 when a field is missing. Do not invent data.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { poster_url, text, source_url } = body as {
      poster_url?: string
      text?: string
      source_url?: string
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    })

    const parts: any[] = [{ text: PROMPT }]
    if (text) parts.push({ text: "JOB TEXT:\n" + text })
    if (source_url) parts.push({ text: "SOURCE URL: " + source_url })
    if (poster_url) {
      const img = await fetch(poster_url)
      const buf = Buffer.from(await img.arrayBuffer())
      const mimeType = img.headers.get("content-type") || "image/png"
      parts.push({ inlineData: { data: buf.toString("base64"), mimeType } })
      parts.push({ text: "Extract the details from the poster image above." })
    }

    const result = await model.generateContent(parts)
    const raw = stripFences(result.response.text())
    const parsed = JSON.parse(raw)
    return NextResponse.json({ ok: true, data: parsed })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "extract failed" }, { status: 500 })
  }
}
