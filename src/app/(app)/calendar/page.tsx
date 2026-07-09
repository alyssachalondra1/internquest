import { createClient } from "@/lib/supabase/server"
import { Icon } from "@/components/Icons"
import { csx } from "@/lib/csx"
import { fmtShort, daysUntil, type Internship } from "@/lib/helpers"

export const dynamic = "force-dynamic"

const DOW = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

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
    push(it.deadline, it.company_name, "var(--pink)")
    push(it.start_date, it.company_name, "var(--blue)")
  }

  const cells: Array<{ day: number | null }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d })

  const reminders = items
    .filter((i) => i.deadline)
    .map((i) => ({ i, n: daysUntil(i.deadline)! }))
    .filter((x) => x.n >= 0 && x.n <= 7)
    .sort((a, b) => a.n - b.n)

  return (
    <section className="iq-screen is-active">
      <div className="row-between mb-6">
        <div><h2 style={csx("font-size:22px")}>Calendar</h2><div className="muted">Otomatis dari deadline internship-mu.</div></div>
        <div className="iq-monthnav"><span>{MONTHS[month]} {year}</span></div>
      </div>
      <div className="iq-calwrap">
        <div className="iq-card iq-card__pad">
          <div className="row wrap mb-4" style={csx("gap:8px")}>
            <span className="iq-chip iq-chip--pink">Deadline</span>
            <span className="iq-chip iq-chip--blue">Mulai magang</span>
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
          <div className="iq-card iq-card__pad">
            <div className="row mb-4"><Icon name="ic-bell" className="ic ic-18" style={csx("color:var(--pink-text)")} /><h3>Reminder aktif</h3></div>
            <div className="stack-2">
              {reminders.length === 0 && <p className="muted">Tidak ada deadline dalam 7 hari ke depan.</p>}
              {reminders.map(({ i, n }) => (
                <div key={i.id} className={"iq-rem " + (n <= 1 ? "iq-rem--warn" : "iq-rem--info")}>
                  <Icon name="ic-clock" className="ic iq-rem__ic" style={csx(n <= 1 ? "color:var(--red-text)" : "color:var(--blue-text)")} />
                  <div>
                    <div className="iq-rem__t">{i.company_name} · {n === 0 ? "hari ini" : n === 1 ? "besok" : n + " hari lagi"}</div>
                    <div className="iq-rem__s">Deadline {fmtShort(i.deadline)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="iq-card iq-card__pad">
            <h3 className="mb-4">Jadwal mendatang</h3>
            {reminders.length === 0 && <p className="muted">Belum ada jadwal.</p>}
            {reminders.map(({ i }) => (
              <div key={i.id} className="iq-sched__item">
                <span className="iq-dot" style={csx("background:var(--pink)")} />
                <div><b>{fmtShort(i.deadline)} · {i.company_name}</b><div className="iq-rem__s">Deadline lamaran</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
