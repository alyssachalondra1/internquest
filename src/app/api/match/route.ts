import { NextResponse } from "next/server"
import { generateWithRetry, LITE_MODEL, PRIMARY_MODEL } from "@/lib/ai"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

function stripFences(s: string) {
  return s.replace(/```json/gi, "").replace(/```/g, "").trim()
}

export async function POST(req: Request) {
  try {
    const { internship_id } = (await req.json()) as { internship_id?: string }
    if (!internship_id) throw new Error("internship_id is required")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 })

    const { data: prof } = await supabase
      .from("profiles")
      .select("cv_text, interests")
      .eq("id", user.id)
      .single()
    if (!prof?.cv_text) {
      return NextResponse.json(
        { ok: false, error: "No CV uploaded yet. Please upload your CV on the Profile page first." },
        { status: 400 },
      )
    }

    let portfolioText = ""
    try {
      const { data: p2 } = await supabase
        .from("profiles")
        .select("portfolio_text")
        .eq("id", user.id)
        .single()
      if (p2?.portfolio_text) portfolioText = String(p2.portfolio_text).slice(0, 3000)
    } catch {}

    const { data: it } = await supabase
      .from("internships")
      .select("company_name, role, location, notes")
      .eq("id", internship_id)
      .eq("user_id", user.id)
      .single()
    if (!it) return NextResponse.json({ ok: false, error: "Internship not found" }, { status: 404 })

    const prompt =
      "You are a career advisor. Compare the applicant CV, portfolio, and interests against an internship, then estimate a match percentage AND give concrete recommendations to improve the applicant chances for THIS specific role.\n" +
      'Return ONLY valid JSON: { "score": number (0-100), "reasons": string (2 to 3 sentences in English explaining the score), "recommendations": array of 3 to 5 objects, each { "type": one of "certification" | "project" | "skill" | "cv", "title": short actionable step of at most 8 words, "detail": one sentence in English on how it boosts chances for this role } }.\n' +
      "Make every recommendation specific to the gap between the applicant profile and the internship requirements. Suggest real certification names, concrete personal project ideas, specific skills or tools to learn, or exact things to add to the CV.\n" +
      "STYLE: Write in English. Do not use the em dash character. Do not use the fire emoji.\n\n" +
      "INTERNSHIP:\nCompany: " + (it.company_name || "") + "\nRole: " + (it.role || "") +
      "\nLocation: " + (it.location || "") + "\nRequirements/Notes: " + (it.notes || "") + "\n\n" +
      "APPLICANT INTERESTS: " + (prof.interests || "(not provided)") + "\n\n" +
      (portfolioText ? "APPLICANT PORTFOLIO:\n" + portfolioText + "\n\n" : "") +
      "APPLICANT CV:\n" + String(prof.cv_text).slice(0, 6000)

    const raw = stripFences(
      await generateWithRetry(prompt, {
        models: [LITE_MODEL, PRIMARY_MODEL],
        generationConfig: { responseMimeType: "application/json" },
      }),
    )
    const parsed = JSON.parse(raw)
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)))
    const reasons = String(parsed.reasons || "")
    const ALLOWED = ["certification", "project", "skill", "cv"]
    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
          .map((r: any) => ({
            type: ALLOWED.includes(String(r?.type)) ? String(r.type) : "skill",
            title: String(r?.title || "").trim(),
            detail: String(r?.detail || "").trim(),
          }))
          .filter((r: any) => r.title)
          .slice(0, 5)
      : []

    await supabase
      .from("internships")
      .update({ match_score: score, match_reasons: reasons })
      .eq("id", internship_id)
      .eq("user_id", user.id)

    return NextResponse.json({ ok: true, score, reasons, recommendations })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "match failed" }, { status: 500 })
  }
}
