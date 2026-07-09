import { createClient } from "@/lib/supabase/server"
import { Questy } from "@/components/Questy"
import { Icon } from "@/components/Icons"
import { csx } from "@/lib/csx"
import type { Internship } from "@/lib/helpers"

export const dynamic = "force-dynamic"

export default async function AchievementsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles").select("level, xp, gems, streak_count").eq("id", user!.id).single()
  const { data: internships } = await supabase
    .from("internships").select("status").eq("user_id", user!.id)
  const { count: genCount } = await supabase
    .from("ai_generations").select("id", { count: "exact", head: true }).eq("user_id", user!.id)

  const items = (internships || []) as Pick<Internship, "status">[]
  const applied = items.filter((i) => ["applied", "interview", "offer"].includes(i.status)).length
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const target = level * 200
  const levelPct = Math.min(100, Math.round(((xp - (level - 1) * 200) / 200) * 100))

  const badges = [
    { t: "First Apply", s: "Lamaran pertama", icon: "ic-target", bg: "var(--pink-15)", fg: "var(--pink-text)", on: applied >= 1 },
    { t: "7-Day Streak", s: "Aktif 7 hari", icon: "ic-flame", bg: "rgba(255,122,61,.15)", fg: "#FF7A3D", on: (profile?.streak_count ?? 0) >= 7 },
    { t: "AI Power User", s: "Generate 10×", icon: "ic-star", bg: "var(--yellow-15)", fg: "var(--yellow-text)", on: (genCount ?? 0) >= 10 },
    { t: "10 Applications", s: applied + "/10", icon: "ic-list", bg: "var(--blue-15)", fg: "var(--blue-text)", on: applied >= 10 },
    { t: "Interview Hero", s: "Masuk interview", icon: "ic-user", bg: "var(--blue-15)", fg: "var(--blue-text)", on: items.some((i) => ["interview", "offer"].includes(i.status)) },
    { t: "Offer Getter", s: "Dapat offer", icon: "ic-trophy", bg: "var(--green-15)", fg: "var(--green-text)", on: items.some((i) => i.status === "offer") },
    { t: "Deadline Master", s: "Selesai tepat waktu", icon: "ic-clock", bg: "var(--pink-15)", fg: "var(--pink-text)", on: false },
    { t: "Level 10", s: "Capai Level 10", icon: "ic-star", bg: "var(--yellow-15)", fg: "var(--yellow-text)", on: level >= 10 },
  ]

  return (
    <section className="iq-screen is-active">
      <div className="iq-card iq-card__pad mb-6">
        <div className="row-between">
          <div className="row"><Questy size={72} /><div><h2 style={csx("font-size:22px")}>Level {level} · Intern Hunter</h2><div className="muted">{xp} / {target} XP</div></div></div>
          <div className="row" style={csx("gap:28px")}>
            <div className="center"><div className="big-num">{profile?.streak_count ?? 0}</div><small className="muted">Streak</small></div>
            <div className="center"><div className="big-num">{profile?.gems ?? 0}</div><small className="muted">Gems</small></div>
            <div className="center"><div className="big-num">{xp}</div><small className="muted">Total XP</small></div>
          </div>
        </div>
        <div className="iq-progress mt-6" style={csx("height:14px")}><div className="iq-progress__fill" style={csx("width:" + levelPct + "%")} /></div>
      </div>
      <h3 className="mb-4">Badges</h3>
      <div className="iq-grid iq-grid--4">
        {badges.map((b) => (
          <div key={b.t} className={"iq-badge" + (b.on ? "" : " is-locked")}>
            <div className="iq-badge__ic" style={csx(b.on ? "background:" + b.bg + ";color:" + b.fg : "")}><Icon name={b.icon} className="ic ic-22" /></div>
            <b>{b.t}</b><span>{b.on ? b.s : "Terkunci"}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
