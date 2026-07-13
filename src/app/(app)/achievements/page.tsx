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
    { t: "First Application", s: "Send your first application", icon: "ic-target", bg: "var(--pink-15)", fg: "var(--pink-text)", on: applied >= 1 },
    { t: "7 Day Streak", s: "Active 7 days in a row", icon: "ic-flame", bg: "rgba(255,122,61,.15)", fg: "#FF7A3D", on: (profile?.streak_count ?? 0) >= 7 },
    { t: "Active AI User", s: "Generate 10 times", icon: "ic-star", bg: "var(--yellow-15)", fg: "var(--yellow-text)", on: (genCount ?? 0) >= 10 },
    { t: "10 Applications", s: applied + "/10 applications", icon: "ic-list", bg: "var(--blue-15)", fg: "var(--blue-text)", on: applied >= 10 },
    { t: "Interview Star", s: "Reach the interview stage", icon: "ic-user", bg: "var(--blue-15)", fg: "var(--blue-text)", on: items.some((i) => ["interview", "offer"].includes(i.status)) },
    { t: "Offer Getter", s: "Land an internship offer", icon: "ic-trophy", bg: "var(--green-15)", fg: "var(--green-text)", on: items.some((i) => i.status === "offer") },
    { t: "Deadline Master", s: "Finish right on time", icon: "ic-clock", bg: "var(--pink-15)", fg: "var(--pink-text)", on: false },
    { t: "Level 10", s: "Reach Level 10", icon: "ic-star", bg: "var(--yellow-15)", fg: "var(--yellow-text)", on: level >= 10 },
  ]
  const unlocked = badges.filter((b) => b.on).length

  return (
    <section className="iq-screen is-active">
      <div className="iq-ach-hero mb-6">
        <div className="iq-ach-hero__mascot"><Questy size={96} /></div>
        <div style={csx("flex:1")}>
          <div className="row-between wrap" style={csx("gap:10px")}>
            <div>
              <div className="muted" style={csx("font-weight:800;letter-spacing:.05em;text-transform:uppercase;font-size:11px")}>Current level</div>
              <h2 style={csx("font-size:26px")}>Level {level} · Intern Hunter</h2>
            </div>
            <span className="iq-chip iq-chip--yellow" style={csx("height:34px")}>🏅 {unlocked}/{badges.length} badges</span>
          </div>
          <div className="iq-progress mt-4" style={csx("height:16px")}><div className="iq-progress__fill" style={csx("width:" + levelPct + "%")} /></div>
          <div className="muted mt-2" style={csx("font-size:12px")}>{xp} / {target} XP to Level {level + 1}</div>
          <div className="row mt-4 wrap" style={csx("gap:28px")}>
            <div className="center"><div className="big-num">{profile?.streak_count ?? 0}</div><small className="muted">Day streak</small></div>
            <div className="center"><div className="big-num">{profile?.gems ?? 0}</div><small className="muted">Gems</small></div>
            <div className="center"><div className="big-num">{xp}</div><small className="muted">Total XP</small></div>
          </div>
        </div>
      </div>
      <h3 className="mb-4">Badges</h3>
      <div className="iq-grid iq-grid--4">
        {badges.map((b) => (
          <div key={b.t} className={"iq-badge " + (b.on ? "is-unlocked" : "is-locked")}>
            {b.on && <span className="iq-badge__spark">✨</span>}
            <div className="iq-badge__ic" style={csx(b.on ? "background:" + b.bg + ";color:" + b.fg : "")}><Icon name={b.icon} className="ic ic-22" /></div>
            <b>{b.t}</b><span>{b.on ? b.s : "Locked"}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
