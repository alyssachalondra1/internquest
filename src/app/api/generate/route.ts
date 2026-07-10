import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const LABELS: Record<string, string> = {
  motivation_letter: "a motivation letter",
  cover_letter: "a cover letter",
  tell_me_about_yourself: "an answer to 'Tell me about yourself'",
  why_should_we_hire_you: "an answer to 'Why should we hire you?'",
  why_this_company: "an answer to 'Why this company?'",
  your_strengths: "an answer about your strengths",
  your_weaknesses: "an answer about your weaknesses",
  career_goals: "an answer about your 5-year career goals",
  expected_salary: "an answer about expected salary",
  short_bio: "a short personal bio",
  professional_summary: "a professional summary",
  reason_for_applying: "an answer about your reason for applying",
  email_to_hr: "a professional email to HR",
  follow_up_email: "a polite follow-up email",
  thank_you_email: "a thank-you email after an interview",
  reference_request: "a message requesting a reference",
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      answer_type = "motivation_letter",
      tone = "Professional",
      length = "Medium",
      company = "",
      role = "",
      context = "",
    } = body as Record<string, string>

    const label = LABELS[answer_type] || "a professional writing"
    const prompt =
      "Write " + label + " for an internship application.\n" +
      "Company: " + (company || "(unspecified)") + "\n" +
      "Role: " + (role || "(unspecified)") + "\n" +
      "Tone: " + tone + ". Length: " + length + ".\n" +
      (context ? "Applicant background: " + context + "\n" : "") +
      "Write in the same language as the role/company context (Indonesian or English). Output only the text, ready to copy."

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" })
    const result = await model.generateContent(prompt)
    return NextResponse.json({ ok: true, content: result.response.text() })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "generate failed" }, { status: 500 })
  }
}
