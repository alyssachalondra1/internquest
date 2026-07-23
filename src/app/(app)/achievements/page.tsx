import { createClient } from "@/lib/supabase/server"
import { Momo } from "@/components/Momo"
import { isMascot } from "@/lib/mascot"
import { Icon } from "@/components/Icons"
import { csx } from "@/lib/csx"
import type { Internship } from "@/lib/helpers"
import { computeBadges } from "@/lib/achievements"
import { markAchievementsSeen } from "@/app/actions/gamification"

export const dynamic = "force-dynamic"

export default async function AchievementsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles").select("level, xp, gems, streak_count, avatar_url").eq("id", user!.id).single()
  const { data: internships } = await supabase
    .from("internships").select("status").eq("user_id", user!.id)
  const { count: genCount } = await supabase
    .from("ai_generations").select("id", { count: "exact", head: true }).eq("user_id", user!.id)

  const items = (internships || []) as Pick<Internship, "status">[]
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const target = level * 200
  const levelPct = Math.min(100, Math.round(((xp - (level - 1) * 200) / 200) * 100))

  const badges = computeBadges({
    level,
    streak: profile?.streak_count ?? 0,
    gens: genCount ?? 0,
    statuses: items.map((i) => i.status),
  })
  const unlocked = badges.filter((b) => b.on).length

  // Opening this page marks the currently-unlocked badges as seen, which clears
  // the count badge shown on the sidebar nav.
  await markAchievementsSeen()

  return (
    <section className="iq-screen is-active">
      <div className="iq-ach-hero mb-6">
        {profile?.avatar_url && !isMascot(profile.avatar_url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="Profile photo" className="iq-ach-hero__pic" />
        ) : (
          <div className="iq-ach-hero__mascot"><Momo size={96} /></div>
        )}
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
          <div key={b.key} className={"iq-badge " + (b.on ? "is-unlocked" : "is-locked")}>
            {b.on && <span className="iq-badge__spark">✨</span>}
            <div className="iq-badge__ic" style={csx(b.on ? "background:" + b.bg + ";color:" + b.fg : "")}><Icon name={b.icon} className="ic ic-22" /></div>
            <b>{b.title}</b><span>{b.on ? b.desc : "Locked"}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
