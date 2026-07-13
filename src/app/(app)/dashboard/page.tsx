import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Questy } from "@/components/Questy"
import { CompanyLogo } from "@/components/CompanyLogo"
import { csx } from "@/lib/csx"
import {
  accentAt,
  deadlineChip,
  fmtShort,
  fmtRange,
  guessDomain,
  type Internship,
} from "@/lib/helpers"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, level, xp, gems, streak_count")
    .eq("id", user!.id)
    .single()

  const { data: internships } = await supabase
    .from("internships")
    .select("*")
    .eq("user_id", user!.id)
    .neq("status", "archived")
    .neq("status", "rejected")
    .order("deadline", { ascending: true })
  const items = (internships || []) as Internship[]

  const { data: checks } = await supabase
    .from("checklist_items")
    .select("internship_id, is_done")
    .eq("user_id", user!.id)
  const progressOf = (id: string) => {
    const rows = (checks || []).filter((c) => c.internship_id === id)
    const done = rows.filter((c) => c.is_done).length
    return { done, total: rows.length, pct: rows.length ? Math.round((done / rows.length) * 100) : 0 }
  }

  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const target = level * 200
  const levelPct = Math.min(100, Math.round(((xp - (level - 1) * 200) / 200) * 100))
  const name = (profile?.full_name || "").split(" ")[0] || "there"

  const priority = items.filter((i) => i.deadline).slice(0, 3)
  const upcoming = items.filter((i) => i.deadline && (deadlineChip(i.deadline)?.label ?? "") !== "Passed").slice(0, 4)
  const applied = items.filter((i) => ["applied", "interview", "offer"].includes(i.status)).length

  return (
    <section className="iq-screen is-active">
      <div className="iq-hero mb-6">
        <div style={csx("flex:1;color:#fff")}>
          <div style={csx("font-weight:800;letter-spacing:.08em;font-size:11px;opacity:.85;text-transform:uppercase")}>Today's Quest</div>
          <h1 style={csx("font-size:26px;margin-top:4px;color:#fff")}>Hi, {name}!</h1>
          <p style={csx("opacity:.92;margin-top:4px")}>Here is your internship quest for today.</p>
        </div>
        <span className="iq-hero__spark">✨</span>
        <Questy size={92} />
      </div>

      <div className="iq-callout mb-6">
        <Questy size={54} />
        <div>
          <b>AI Insight</b>
          <p className="mt-2 iq-justify">
            You have saved <b>{items.length} internships</b>, and <b>{applied}</b> are in progress.
            {priority[0]
              ? " Your nearest deadline is at " + priority[0].company_name + ". Focus on finishing its checklist first."
              : " Add your first internship to get started."}
          </p>
        </div>
      </div>

      <div className="iq-grid iq-grid--dash">
        <div className="stack-6">
          <div className="iq-sec-title"><h3>Priority Deadlines</h3><Link href="/internships">See all</Link></div>
          <div className="stack-4">
            {priority.length === 0 && (
              <div className="iq-card iq-card__pad muted">No deadlines yet. Add an internship with the Add Internship button.</div>
            )}
            {priority.map((it, idx) => {
              const a = accentAt(idx)
              const p = progressOf(it.id)
              const chip = deadlineChip(it.deadline)
              const range = fmtRange(it.open_date, it.deadline)
              return (
                <div key={it.id} className={"iq-prio iq-prio--" + a}>
                  <div className="iq-prio__top">
                    <CompanyLogo domain={guessDomain(it.company_name)} name={it.company_name} />
                    <div style={csx("flex:1")}>
                      <div className="iq-prio__title">{it.company_name}</div>
                      <div className="iq-prio__sub">{it.role} · {it.location}</div>
                      {range && <div className="iq-range">{range}</div>}
                    </div>
                    {chip && <span className={"iq-chip " + chip.cls}>{chip.label}</span>}
                  </div>
                  <div className="iq-progress"><div className="iq-progress__fill" style={csx("width:" + p.pct + "%")} /></div>
                  <div className="iq-prio__foot">
                    <span className="muted">Checklist {p.done}/{p.total}</span>
                    <div className="row" style={csx("gap:8px")}>
                      {it.source_url && (
                        <a className="iq-apply-btn" href={it.source_url} target="_blank" rel="noopener">Apply</a>
                      )}
                      <Link className="iq-prio__btn" href={"/internships/" + it.id}>Continue</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="stack-6">
          <div className="iq-levelcard">
            <Questy size={104} />
            <h3 style={csx("font-size:19px")}>Level {level} · Intern Hunter</h3>
            <div className="iq-progress mt-4 mb-4"><div className="iq-progress__fill" style={csx("width:" + levelPct + "%")} /></div>
            <div className="muted" style={csx("font-size:12px")}>{xp} / {target} XP to Level {level + 1}</div>
            <div className="iq-levelstats">
              <div><div className="big-num">{profile?.streak_count ?? 0}</div><small className="muted">Day Streak</small></div>
              <div><div className="big-num">{profile?.gems ?? 0}</div><small className="muted">Gems</small></div>
              <div><div className="big-num">{applied}</div><small className="muted">Applied</small></div>
            </div>
          </div>
          <div className="iq-card iq-card__pad">
            <div className="iq-sec-title"><h3>Upcoming Deadlines</h3><Link href="/calendar">Calendar</Link></div>
            {upcoming.length === 0 && <p className="muted">No upcoming deadlines.</p>}
            {upcoming.map((it) => {
              const chip = deadlineChip(it.deadline)
              const range = fmtRange(it.open_date, it.deadline)
              return (
                <div key={it.id} className="iq-dl">
                  <span className="iq-tag-dot" style={csx("background:var(--blue)")} />
                  <div style={csx("flex:1")}>
                    <div className="iq-dl__t">{it.company_name}</div>
                    <div className="iq-dl__s">{range ? "Registration " + range : "Deadline · " + fmtShort(it.deadline)}</div>
                  </div>
                  {chip && <span className={"iq-chip " + chip.cls}>{chip.label}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
