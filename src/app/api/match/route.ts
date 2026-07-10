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
    if (!internship_id) throw new Error("internship_id wajib")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: "Belum login" }, { status: 401 })

    const { data: prof } = await supabase
      .from("profiles")
      .select("cv_text, interests")
      .eq("id", user.id)
      .single()
    if (!prof?.cv_text) {
      return NextResponse.json(
        { ok: false, error: "CV belum diunggah. Upload CV di halaman Profile dulu ya." },
        { status: 400 },
      )
    }

    const { data: it } = await supabase
      .from("internships")
      .select("company_name, role, location, notes")
      .eq("id", internship_id)
      .eq("user_id", user.id)
      .single()
    if (!it) return NextResponse.json({ ok: false, error: "Lowongan tidak ditemukan" }, { status: 404 })

    const prompt =
      "You are a career advisor. Compare the applicant's CV and interests against an internship, then estimate a match percentage.\n" +
      'Return ONLY valid JSON: { "score": number (0-100), "reasons": string (2-3 kalimat, bahasa Indonesia), "tips": string (1-2 saran singkat, bahasa Indonesia) }.\n\n' +
      "INTERNSHIP:\nCompany: " + (it.company_name || "") + "\nRole: " + (it.role || "") +
      "\nLocation: " + (it.location || "") + "\nRequirements/Notes: " + (it.notes || "") + "\n\n" +
      "APPLICANT INTERESTS: " + (prof.interests || "(tidak diisi)") + "\n\n" +
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
    const tips = String(parsed.tips || "")

    await supabase
      .from("internships")
      .update({ match_score: score, match_reasons: reasons })
      .eq("id", internship_id)
      .eq("user_id", user.id)

    return NextResponse.json({ ok: true, score, reasons, tips })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "match failed" }, { status: 500 })
  }
}
