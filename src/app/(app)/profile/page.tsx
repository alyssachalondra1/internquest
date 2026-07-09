import { createClient } from "@/lib/supabase/server"
import { Questy } from "@/components/Questy"
import { csx } from "@/lib/csx"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles").select("full_name, email, level, xp, gems, streak_count").eq("id", user!.id).single()
  const { count: applied } = await supabase
    .from("internships").select("id", { count: "exact", head: true }).eq("user_id", user!.id)

  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const target = level * 200
  const levelPct = Math.min(100, Math.round(((xp - (level - 1) * 200) / 200) * 100))

  return (
    <section className="iq-screen is-active">
      <div className="iq-levelcard mb-6" style={csx("max-width:540px;margin-left:auto;margin-right:auto")}>
        <Questy size={110} />
        <h2 style={csx("font-size:22px")}>Level {level} · Intern Hunter</h2>
        <div className="iq-progress mt-4 mb-4"><div className="iq-progress__fill" style={csx("width:" + levelPct + "%")} /></div>
        <div className="muted" style={csx("font-size:12px")}>{xp} / {target} XP</div>
        <div className="iq-levelstats">
          <div><div className="big-num">{profile?.streak_count ?? 0}</div><small className="muted">Day Streak</small></div>
          <div><div className="big-num">{profile?.gems ?? 0}</div><small className="muted">Gems</small></div>
          <div><div className="big-num">{applied ?? 0}</div><small className="muted">Internships</small></div>
        </div>
      </div>
      <div className="iq-grid iq-grid--dash">
        <div className="stack-6">
          <div className="iq-card iq-card__pad">
            <h3 className="mb-4">Personal Information</h3>
            <div className="iq-field"><span className="iq-field__k">Nama</span><span className="iq-field__v">{profile?.full_name || "—"}</span></div>
            <div className="iq-field"><span className="iq-field__k">Email</span><span className="iq-field__v">{profile?.email || user?.email}</span></div>
            <div className="iq-field"><span className="iq-field__k">Level</span><span className="iq-field__v">{level}</span></div>
          </div>
          <div className="iq-card iq-card__pad">
            <h3 className="mb-4">Skills</h3>
            <div className="row wrap" style={csx("gap:8px")}><span className="iq-chip">Excel</span><span className="iq-chip">SQL</span><span className="iq-chip">Python</span><span className="iq-chip">Power BI</span></div>
          </div>
        </div>
        <div className="stack-6">
          <div className="iq-sidebyside">
            <Questy size={72} />
            <div className="iq-callout" style={csx("background:var(--pink-15);border-color:var(--pink-50)")}>
              <div><b>Semangat, {(profile?.full_name || "").split(" ")[0] || "Kamu"}!</b><p className="mt-2">Tinggal {Math.max(0, target - xp)} XP lagi menuju Level {level + 1}. Selesaikan 1 checklist hari ini untuk jaga streak-mu! 🔥</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
