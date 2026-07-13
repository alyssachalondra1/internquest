"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Questy } from "@/components/Questy"
import { Icon } from "@/components/Icons"
import { createClient } from "@/lib/supabase/client"
import { saveGeneration } from "@/app/actions/ai"
import { csx } from "@/lib/csx"

const TYPES: Array<{ value: string; label: string }> = [
  { value: "motivation_letter", label: "Motivation Letter" },
  { value: "cover_letter", label: "Cover Letter" },
  { value: "tell_me_about_yourself", label: "Tell Me About Yourself" },
  { value: "why_should_we_hire_you", label: "Why Should We Hire You" },
  { value: "why_this_company", label: "Why This Company" },
  { value: "your_strengths", label: "Your Strengths" },
  { value: "your_weaknesses", label: "Your Weaknesses" },
  { value: "career_goals", label: "Career Goals (5 years)" },
  { value: "expected_salary", label: "Expected Salary" },
  { value: "short_bio", label: "Short Bio" },
  { value: "professional_summary", label: "Professional Summary" },
  { value: "reason_for_applying", label: "Reason for Applying" },
  { value: "email_to_hr", label: "Email to HR" },
  { value: "follow_up_email", label: "Follow-up Email" },
  { value: "thank_you_email", label: "Thank You Email" },
  { value: "reference_request", label: "Reference Request" },
]

function AiInner() {
  const params = useSearchParams()
  const router = useRouter()
  const internshipId = params.get("internship")
  const [type, setType] = useState(params.get("type") || "motivation_letter")
  const [tone, setTone] = useState("Professional")
  const [length, setLength] = useState("Medium")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [context, setContext] = useState("")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!internshipId) return
    const supabase = createClient()
    supabase
      .from("internships")
      .select("company_name, role")
      .eq("id", internshipId)
      .single()
      .then(({ data }) => {
        if (data) { setCompany(data.company_name || ""); setRole(data.role || "") }
      })
  }, [internshipId])

  async function generate() {
    setLoading(true)
    setSaved(false)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer_type: type, tone, length, company, role, context }),
      })
      const json = await res.json()
      if (json.ok) {
        setOutput(json.content)
        router.refresh() // refresh the gem balance shown in the top bar
      } else {
        setOutput(json.needGems ? json.error : "Failed to generate: " + (json.error || ""))
      }
    } catch (e: any) {
      setOutput("Failed to generate: " + (e?.message || ""))
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    await saveGeneration({ internship_id: internshipId, answer_type: type, tone, length, content: output })
    setSaved(true)
  }

  return (
    <section className="iq-screen is-active">
      <div className="iq-grid iq-grid--dash">
        <div className="iq-card iq-card__pad">
          <div className="row mb-6"><Questy size={56} /><h2 style={csx("font-size:20px")}>Generate with AI</h2></div>
          <div className="iq-grid iq-grid--2 mb-4">
            <div className="iq-form-row"><label>Company</label><input className="iq-input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" /></div>
            <div className="iq-form-row"><label>Role</label><input className="iq-input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" /></div>
          </div>
          <div className="iq-grid iq-grid--3 mb-4">
            <div className="iq-form-row"><label>Type</label><select className="iq-select" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div className="iq-form-row"><label>Tone</label><select className="iq-select" value={tone} onChange={(e) => setTone(e.target.value)}><option>Professional</option><option>Friendly</option><option>Confident</option></select></div>
            <div className="iq-form-row"><label>Length</label><select className="iq-select" value={length} onChange={(e) => setLength(e.target.value)}><option>Medium</option><option>Short</option><option>Long</option></select></div>
          </div>
          <div className="iq-form-row mb-4">
            <label>Additional info (optional)</label>
            <textarea
              className="iq-textarea"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="For example: highlight my organization and data project experience; mention my interest in sustainability…"
            />
          </div>
          <button className="iq-btn iq-btn--primary iq-btn--block mb-6" onClick={generate} disabled={loading}>
            <Icon name="ic-ai" className="ic ic-18" /> {loading ? "Generating…" : "Generate · 3 gems"}
          </button>
          <div className="iq-card iq-card__pad" style={csx("background:var(--surface-2);border-style:dashed")}>
            {output ? (
              <p style={csx("line-height:1.7;white-space:pre-wrap")} className="iq-justify">{output}</p>
            ) : (
              <p className="muted">Your AI result will appear here. Pick a type and click Generate.</p>
            )}
            {output && (
              <div className="row wrap mt-6" style={csx("gap:8px")}>
                <button className="iq-btn iq-btn--ghost iq-btn--sm" onClick={() => navigator.clipboard.writeText(output)}><Icon name="ic-copy" className="ic ic-16" /> Copy</button>
                <button className="iq-btn iq-btn--ghost iq-btn--sm" onClick={generate}><Icon name="ic-refresh" className="ic ic-16" /> Regenerate</button>
                <button className="iq-btn iq-btn--green iq-btn--sm" onClick={save}><Icon name="ic-save" className="ic ic-16" /> {saved ? "Saved" : "Save"}</button>
              </div>
            )}
          </div>
        </div>
        <div className="stack-6">
          <div className="iq-card iq-card__pad">
            <div className="row mb-4"><Icon name="ic-doc" className="ic ic-22" style={csx("color:var(--pink-text)")} /><h3>Personalization</h3></div>
            <p className="muted iq-justify">AI results are automatically tailored to the <b>CV</b> you upload on the <b>Profile</b> page. Add "Additional info" on the left for a result that fits exactly what you want.</p>
          </div>
          <div className="iq-card iq-card__pad">
            <div className="row mb-4"><Icon name="ic-target" className="ic ic-22" style={csx("color:var(--green-text)")} /><h3>Tips</h3></div>
            <p className="muted iq-justify">Open an internship and click the AI Helper button so Company and Role are filled in here automatically.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AiPage() {
  return (
    <Suspense fallback={<div className="iq-card iq-card__pad">Loading…</div>}>
      <AiInner />
    </Suspense>
  )
}
