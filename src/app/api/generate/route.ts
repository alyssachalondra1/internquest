import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const PROMPTS: Record<string, string> = {
  motivation_letter: "Tulis motivation letter profesional dan tulus.",
  cover_letter: "Tulis cover letter yang ringkas dan meyakinkan.",
  tell_me_about_yourself: "Buat jawaban 'Tell me about yourself' yang natural.",
  why_should_we_hire_you: "Buat jawaban 'Why should we hire you' yang percaya diri.",
  why_this_company: "Buat jawaban 'Why this company' yang spesifik.",
  your_strengths: "Sebutkan kelebihan beserta contoh singkat.",
  your_weaknesses: "Sebutkan kelemahan plus cara memperbaikinya.",
  career_goals: "Jelaskan tujuan karier jangka pendek dan panjang.",
  expected_salary: "Buat jawaban sopan soal ekspektasi gaji untuk anak magang.",
  short_bio: "Buat bio singkat 2-3 kalimat untuk profil.",
  professional_summary: "Buat ringkasan profesional untuk bagian atas CV.",
  reason_for_applying: "Jelaskan alasan melamar posisi ini.",
  email_to_hr: "Tulis email lamaran yang sopan ke HR.",
  follow_up_email: "Tulis email follow-up setelah melamar/interview.",
  thank_you_email: "Tulis thank-you email setelah interview.",
  reference_request: "Tulis pesan meminta surat rekomendasi ke dosen/atasan.",
}

export async function POST(req: NextRequest) {
  const { type, context } = await req.json()

  const instruction = PROMPTS[type]
  if (!instruction) {
    return NextResponse.json({ error: "Tipe tidak dikenal" }, { status: 400 })
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  const prompt = `${instruction}

Tulis dalam Bahasa Indonesia, rapi dan siap pakai.
Data pelamar & lowongan (JSON):
${JSON.stringify(context)}`

  const result = await model.generateContent(prompt)
  return NextResponse.json({ output: result.response.text() })
}