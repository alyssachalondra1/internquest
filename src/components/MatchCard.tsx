"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { csx } from "@/lib/csx"

type Rec = { type: string; title: string; detail: string }

const REC_META: Record<string, { icon: string; label: string; chip: string }> = {
  certification: { icon: "ic-trophy", label: "Certification", chip: "iq-chip--yellow" },
  project: { icon: "ic-code", label: "Project", chip: "iq-chip--blue" },
  skill: { icon: "ic-brain", label: "Skill", chip: "iq-chip--pink" },
  cv: { icon: "ic-doc", label: "Add to CV", chip: "iq-chip--green" },
}

export function MatchCard({
  internshipId,
  initialScore,
  initialReasons,
  hasCv,
}: {
  internshipId: string
  initialScore: number | null
  initialReasons: string | null
  hasCv: boolean
}) {
  const router = useRouter()
  const [score, setScore] = useState<number | null>(initialScore)
  const [reasons, setReasons] = useState<string>(initialReasons || "")
  const [companyScore, setCompanyScore] = useState<number | null>(null)
  const [companyNote, setCompanyNote] = useState<string>("")
  const [recs, setRecs] = useState<Rec[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internship_id: internshipId }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Could not calculate")
      setScore(json.score)
      setReasons(json.reasons || "")
      setCompanyScore(typeof json.companyScore === "number" ? json.companyScore : null)
      setCompanyNote(json.companyNote || "")
      setRecs(Array.isArray(json.recommendations) ? json.recommendations : [])
      router.refresh()
    } catch (e: any) {
      setErr(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="iq-card iq-card__pad">
      <div className="row mb-4">
        <Icon name="ic-target" className="ic ic-22" style={csx("color:var(--blue-text)")} />
        <h3>CV &amp; Company Match</h3>
      </div>
      {!hasCv ? (
        <p className="muted iq-justify">
          Upload your CV on the <b>Profile</b> page first so AI can score how well you match this role and suggest how to improve.
        </p>
      ) : (
        <>
          {score !== null && (
            <>
              <div className="iq-match__score">{score}%</div>
              <div className="iq-match__bar"><i style={csx("width:" + score + "%")} /></div>
              {reasons && <p className="muted iq-justify" style={csx("font-size:13px")}>{reasons}</p>}
              {companyScore !== null && (
                <div className="mt-4" style={csx("border-top:1px solid var(--border);padding-top:14px")}>
                  <div className="row mb-2">
                    <Icon name="ic-star" className="ic ic-18" style={csx("color:var(--pink-text)")} />
                    <b>Company fit &amp; quality · {companyScore}%</b>
                  </div>
                  <div className="iq-match__bar" style={csx("margin:6px 0")}><i style={csx("width:" + companyScore + "%")} /></div>
                  {companyNote && <p className="muted iq-justify" style={csx("font-size:13px")}>{companyNote}</p>}
                </div>
              )}
              {recs.length > 0 && (
                <div className="iq-recs mt-4">
                  <div className="row mb-2">
                    <Icon name="ic-star" className="ic ic-18" style={csx("color:var(--yellow-text)")} />
                    <b>How to boost your chances</b>
                  </div>
                  <div className="stack-2">
                    {recs.map((r, i) => {
                      const m = REC_META[r.type] || REC_META.skill
                      return (
                        <div key={i} className="iq-rec">
                          <span className="iq-rec__ic"><Icon name={m.icon} className="ic ic-18" /></span>
                          <div style={csx("flex:1")}>
                            <div className="iq-rec__head">
                              <b>{r.title}</b>
                              <span className={"iq-chip " + m.chip}>{m.label}</span>
                            </div>
                            {r.detail && <div className="iq-rec__detail muted iq-justify">{r.detail}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
          {score === null && <p className="muted mb-4 iq-justify">Not checked yet. Click the button below to see your match and get tips to improve your chances.</p>}
          {err && <p style={csx("color:var(--red-text);font-size:12px;margin-top:6px")}>{err}</p>}
          <button className="iq-btn iq-btn--blue iq-btn--block iq-btn--sm mt-4" onClick={run} disabled={loading}>
            <Icon name="ic-ai" className="ic ic-16" /> {loading ? "Analyzing…" : score === null ? "Check match & tips" : "Recalculate"}
          </button>
        </>
      )}
    </div>
  )
}
