import { NextResponse } from "next/server"
import { generateWithRetry } from "@/lib/ai"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

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

    // Ambil CV, minat, dan portfolio user (bila ada) untuk personalisasi hasil.
    let cvText = ""
    let interests = ""
    let portfolioText = ""
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("cv_text, interests")
          .eq("id", user.id)
          .single()
        if (prof?.cv_text) cvText = String(prof.cv_text).slice(0, 6000)
        if (prof?.interests) interests = String(prof.interests)
        // Portfolio diambil terpisah agar aman bila kolomnya belum ada.
        const { data: p2 } = await supabase
          .from("profiles")
          .select("portfolio_text")
          .eq("id", user.id)
          .single()
        if (p2?.portfolio_text) portfolioText = String(p2.portfolio_text).slice(0, 4000)
      }
    } catch {
      // abaikan, tetap bisa generate tanpa CV
    }

    const label = LABELS[answer_type] || "a professional writing"
    const prompt =
      "Write " + label + " for an internship application.\n" +
      "Company: " + (company || "(unspecified)") + "\n" +
      "Role: " + (role || "(unspecified)") + "\n" +
      "Tone: " + tone + ". Length: " + length + ".\n" +
      (cvText
        ? "Base the content on the applicant's REAL CV below. Only use facts from it; do NOT invent experience.\nCV:\n" + cvText + "\n"
        : "") +
      (portfolioText
        ? "The applicant also has this portfolio. Use relevant projects from it when helpful.\nPORTFOLIO:\n" + portfolioText + "\n"
        : "") +
      (interests ? "Applicant interests/goals: " + interests + "\n" : "") +
      (context ? "Additional info from applicant: " + context + "\n" : "") +
      "STYLE RULES: Write in natural Indonesian unless the company/role context is clearly English. " +
      "Do NOT use the em dash or en dash character; use commas or full stops instead. Avoid overusing colons. " +
      "Do not use the fire emoji or excessive emojis. Output only the final text, ready to copy."

    const content = await generateWithRetry(prompt)
    return NextResponse.json({ ok: true, content })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "generate failed" }, { status: 500 })
  }
}
