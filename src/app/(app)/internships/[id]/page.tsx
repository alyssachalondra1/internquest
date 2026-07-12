import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { CompanyLogo } from "@/components/CompanyLogo"
import { Questy } from "@/components/Questy"
import { Icon } from "@/components/Icons"
import { ChecklistCard } from "@/components/ChecklistCard"
import { StatusActions } from "@/components/StatusActions"
import { MatchCard } from "@/components/MatchCard"
import { DeleteInternshipButton } from "@/components/DeleteInternshipButton"
import { csx } from "@/lib/csx"
import { guessDomain, statusMeta, fmtShort, type Internship } from "@/lib/helpers"

export const dynamic = "force-dynamic"

const STEPS = ["Saved", "Preparing", "Applied", "Assessment", "Interview", "Offer"]
const STEP_BY_STATUS: Record<string, number> = {
  todo: 1,
  applied: 2,
  interview: 4,
  offer: 5,
  rejected: 2,
  archived: 1,
}

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: it } = await supabase
    .from("internships")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single()
  if (!it) notFound()
  const item = it as Internship

  const { data: prof } = await supabase
    .from("profiles")
    .select("cv_text")
    .eq("id", user!.id)
    .single()
  const hasCv = !!prof?.cv_text

  const { data: checklist } = await supabase
    .from("checklist_items")
    .select("id, label, is_done")
    .eq("internship_id", id)
    .order("created_at", { ascending: true })
  const rows = checklist || []
  const done = rows.filter((r) => r.is_done).length
  const pct = rows.length ? Math.round((done / rows.length) * 100) : 0
  const current = STEP_BY_STATUS[item.status] ?? 1
  const sm = statusMeta(item.status)

  return (
    <section className="iq-screen is-active">
      <Link href="/internships" className="row muted mb-6" style={csx("font-weight:700")}>
        <Icon name="ic-back" className="ic ic-18" /> Kembali ke daftar
      </Link>
      <div className="iq-grid iq-grid--dash">
        <div className="stack-6">
          <div className="iq-card iq-card__pad">
            <div className="row-between mb-6">
              <div className="row">
                <CompanyLogo domain={guessDomain(item.company_name)} name={item.company_name} large />
                <div>
                  <h2 style={csx("font-size:22px")}>{item.role || "Internship"}</h2>
                  <div className="muted">{item.company_name} · {item.location || "—"}</div>
                </div>
              </div>
              <span className={"iq-chip " + sm.chip}>{sm.label}</span>
            </div>
            <div className="iq-stepper mb-6">
              {STEPS.map((label, i) => (
                <div key={label} className={"iq-step" + (i < current ? " is-done" : i === current ? " is-current" : "")}>
                  <span className="iq-step__dot">{i < current ? <Icon name="ic-check" className="ic ic-16" /> : i + 1}</span>
                  <span className="iq-step__label">{label}</span>
                </div>
              ))}
            </div>
            <div className="iq-field"><span className="iq-field__k">Deadline lamaran</span><span className="iq-field__v">{fmtShort(item.deadline)}</span></div>
            <div className="iq-field"><span className="iq-field__k">Mulai magang</span><span className="iq-field__v">{fmtShort(item.start_date)}</span></div>
            <div className="iq-field"><span className="iq-field__k">Durasi</span><span className="iq-field__v">{item.duration_months ? item.duration_months + " bulan" : "—"}</span></div>
            <div className="iq-field"><span className="iq-field__k">Lokasi</span><span className="iq-field__v">{item.location || "—"}</span></div>
            <div className="iq-field"><span className="iq-field__k">Employment</span><span className="iq-field__v">{(item.work_type || "—")}{item.is_paid ? " · Paid" : ""}</span></div>
            {item.source_url && (
              <a className="iq-btn iq-btn--blue iq-btn--block" style={csx("margin-top:14px")} href={item.source_url} target="_blank" rel="noopener">
                <Icon name="ic-link" className="ic ic-18" /> Buka Halaman Pendaftaran
              </a>
            )}
            {item.notes && (
              <div style={csx("margin-top:12px")}><span className="muted" style={csx("font-size:12px")}>Catatan</span><p className="mt-2">{item.notes}</p></div>
            )}
          </div>
          <ChecklistCard internshipId={item.id} items={rows} done={done} />
        </div>
        <div className="stack-6">
          <div className="iq-card iq-card__pad">
            <div className="row mb-4"><Questy size={52} /><h3>AI Helper</h3></div>
            <div className="stack-2">
              <Link className="iq-btn iq-btn--primary iq-btn--block iq-btn--sm" href={"/ai?internship=" + item.id + "&type=motivation_letter"}>Generate Motivation Letter</Link>
              <Link className="iq-btn iq-btn--ghost iq-btn--block iq-btn--sm" href={"/ai?internship=" + item.id + "&type=cover_letter"}>Cover Letter</Link>
              <Link className="iq-btn iq-btn--ghost iq-btn--block iq-btn--sm" href={"/ai?internship=" + item.id + "&type=email_to_hr"}>Email HR</Link>
            </div>
          </div>
          <MatchCard internshipId={item.id} initialScore={item.match_score} initialReasons={item.match_reasons} hasCv={hasCv} />
          <div className="iq-card iq-card__pad">
            <h3 className="mb-4">Progres</h3>
            <div className="center big-num" style={csx("color:var(--blue-text)")}>{pct}%</div>
            <div className="iq-progress mt-4"><div className="iq-progress__fill" style={csx("width:" + pct + "%")} /></div>
            <StatusActions id={item.id} status={item.status} />
            <div className="mt-4"><DeleteInternshipButton id={item.id} name={item.company_name} /></div>
          </div>
        </div>
      </div>
    </section>
  )
}
