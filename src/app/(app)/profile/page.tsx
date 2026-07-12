import { createClient } from "@/lib/supabase/server"
import { Questy } from "@/components/Questy"
import { ProfileExtras } from "@/components/ProfileExtras"
import { csx } from "@/lib/csx"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, level, xp, gems, streak_count, cv_url, cv_text, interests, avatar_url")
    .eq("id", user!.id)
    .single()
  const { count: applied } = await supabase
    .from("internships").select("id", { count: "exact", head: true }).eq("user_id", user!.id)

  // Portfolio diambil terpisah agar aman bila kolomnya belum ada di database.
  let portfolio: { portfolio_url: string | null; portfolio_text: string | null } | null = null
  try {
    const { data } = await supabase
      .from("profiles").select("portfolio_url, portfolio_text").eq("id", user!.id).single()
    portfolio = (data as any) ?? null
  } catch {}

  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const target = level * 200
  const levelPct = Math.min(100, Math.round(((xp - (level - 1) * 200) / 200) * 100))

  const hasCv = !!profile?.cv_text
  const cvName = profile?.cv_url
    ? decodeURIComponent(profile.cv_url.split("/").pop() || "").replace(/^cv-\d+-/, "")
    : null
  const hasPortfolio = !!portfolio?.portfolio_text
  const portfolioName = portfolio?.portfolio_url
    ? decodeURIComponent(portfolio.portfolio_url.split("/").pop() || "").replace(/^portfolio-\d+-/, "")
    : null

  return (
    <section className="iq-screen is-active">
      <div className="iq-levelcard mb-6" style={csx("max-width:540px;margin-left:auto;margin-right:auto")}>
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt="Foto profil"
            className="iq-avatar-lg"
          />
        ) : (
          <Questy size={110} />
        )}
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
            <h3 className="mb-4">Informasi Pribadi</h3>
            <div className="iq-field"><span className="iq-field__k">Nama</span><span className="iq-field__v">{profile?.full_name || "—"}</span></div>
            <div className="iq-field"><span className="iq-field__k">Email</span><span className="iq-field__v">{profile?.email || user?.email}</span></div>
            <div className="iq-field"><span className="iq-field__k">Level</span><span className="iq-field__v">{level}</span></div>
          </div>
          <ProfileExtras hasCv={hasCv} cvName={cvName} interests={profile?.interests ?? null} hasPortfolio={hasPortfolio} portfolioName={portfolioName} />
        </div>
        <div className="stack-6">
          <div className="iq-sidebyside">
            <Questy size={72} />
            <div className="iq-callout" style={csx("background:var(--pink-15);border-color:var(--pink-50)")}>
              <div><b>Semangat, {(profile?.full_name || "").split(" ")[0] || "Kamu"}!</b><p className="mt-2">Tinggal {Math.max(0, target - xp)} XP lagi menuju Level {level + 1}. Selesaikan 1 checklist hari ini untuk jaga streak-mu.</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
