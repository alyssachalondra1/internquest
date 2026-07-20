import { createClient } from "@/lib/supabase/server"
import { Icon } from "@/components/Icons"
import { csx } from "@/lib/csx"
import { fmtShort, fmtRange, daysUntil, timingLabel, type Internship } from "@/lib/helpers"

export const dynamic = "force-dynamic"

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

type Ev = { label: string; color: string }

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: internships } = await supabase
    .from("internships")
    .select("*")
    .eq("user_id", user!.id)
  const items = (internships || []) as Internship[]

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // Monday = 0

  const evByDay: Record<number, Ev[]> = {}
  const push = (iso: string | null, label: string, color: string) => {
    if (!iso) return
    const d = new Date(iso)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      ;(evByDay[day] = evByDay[day] || []).push({ label, color })
    }
  }
  for (const it of items) {
    push(it.open_date, "Opens: " + it.company_name, "#1FAE70")
    push(it.deadline, "Deadline: " + it.company_name, "#FB5C93")
    push(it.start_date, "Starts: " + it.company_name, "#2F6BFF")
  }

  const cells: Array<{ day: number | null }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d })

  const reminders = items
    .filter((i) => i.deadline)
    .map((i) => ({ i, n: daysUntil(i.deadline)! }))
    .filter((x) => x.n >= 0 && x.n <= 7)
    .sort((a, b) => a.n - b.n)

  const rolling = items.filter((i) => i.deadline_type && i.deadline_type !== "date")

  const upcoming = items
    .filter((i) => i.open_date || i.deadline || i.start_date)
    .map((i) => ({ i, n: daysUntil(i.deadline ?? i.start_date ?? i.open_date) ?? 9999 }))
    .filter((x) => x.n >= -1)
    .sort((a, b) => a.n - b.n)
    .slice(0, 6)

  return (
    <section className="iq-screen is-active">
      <div className="iq-calhead mb-6">
        <div className="row-between" style={csx("gap:10px")}>
          <h2 style={csx("font-size:22px")}>Calendar</h2>
          <div className="iq-monthnav"><span>{MONTHS[month]} {year}</span></div>
        </div>
        <div className="muted mt-1">Built automatically from your internship dates.</div>
      </div>
      <div className="iq-calwrap">
        <div className="iq-card iq-card__pad">
          <div className="row wrap mb-4" style={csx("gap:8px")}>
            <span className="iq-chip iq-chip--green">Registration opens</span>
            <span className="iq-chip iq-chip--pink">Deadline</span>
            <span className="iq-chip iq-chip--blue">Internship starts</span>
          </div>
          <div className="iq-cal">
            {DOW.map((d) => <div key={d} className="iq-cal__h">{d}</div>)}
            {cells.map((c, i) => (
              <div key={i} className={"iq-cal__d" + (c.day === null ? " is-muted" : "") + (c.day === today ? " is-today" : "")}>
                {c.day}
                {c.day && (evByDay[c.day] || []).map((ev, j) => (
                  <div key={j} className="iq-cal__ev" style={csx("background:" + ev.color)}>{ev.label}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="stack-6">
          {rolling.length > 0 && (
            <div className="iq-card iq-card__pad">
              <div className="row mb-4"><Icon name="ic-clock" className="ic ic-18" style={csx("color:var(--yellow-text)")} /><h3>Apply anytime</h3></div>
              <div className="stack-2">
                {rolling.map((i) => (
                  <div key={i.id} className="iq-rem iq-rem--info">
                    <Icon name="ic-clock" className="ic iq-rem__ic" style={csx("color:var(--yellow-text)")} />
                    <div>
                      <div className="iq-rem__t">{i.company_name}</div>
                      <div className="iq-rem__s">{timingLabel(i)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="iq-card iq-card__pad">
            <div className="row mb-4"><Icon name="ic-bell" className="ic ic-18" style={csx("color:var(--pink-text)")} /><h3>Active reminders</h3></div>
            <div className="stack-2">
              {reminders.length === 0 && <p className="muted">No deadlines in the next 7 days.</p>}
              {reminders.map(({ i, n }) => (
                <div key={i.id} className={"iq-rem " + (n <= 1 ? "iq-rem--warn" : "iq-rem--info")}>
                  <Icon name="ic-clock" className="ic iq-rem__ic" style={csx(n <= 1 ? "color:var(--red-text)" : "color:var(--blue-text)")} />
                  <div>
                    <div className="iq-rem__t">{i.company_name} · {n === 0 ? "today" : n === 1 ? "tomorrow" : n + " days left"}</div>
                    <div className="iq-rem__s">Deadline {fmtShort(i.deadline)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="iq-card iq-card__pad">
            <h3 className="mb-4">Upcoming schedule</h3>
            {upcoming.length === 0 && <p className="muted">Nothing scheduled yet.</p>}
            {upcoming.map(({ i }) => {
              const range = fmtRange(i.open_date, i.deadline)
              return (
                <div key={i.id} className="iq-sched__item">
                  <span className="iq-dot" style={csx("background:var(--pink)")} />
                  <div>
                    <b>{i.company_name}</b>
                    <div className="iq-rem__s">{range ? "Registration " + range : "Deadline " + fmtShort(i.deadline)}</div>
                    {i.start_date && <div className="iq-rem__s">Starts {fmtShort(i.start_date)}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
