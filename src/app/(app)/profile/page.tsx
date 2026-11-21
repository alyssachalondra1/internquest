import { createClient } from "@/lib/supabase/server"
import { Momo } from "@/components/Momo"
import { MomoFace } from "@/components/MascotAvatar"
import { isMascot, moodOf } from "@/lib/mascot"
import { ProfileExtras } from "@/components/ProfileExtras"
import { DeleteAccountButton } from "@/components/DeleteAccountButton"
import { LogoutButton } from "@/components/LogoutButton"
import { StreakCelebration } from "@/components/StreakCelebration"
import { csx } from "@/lib/csx"

export const dynamic = "force-dynamic"

// Nama file bisa mengandung karakter yang membuat decodeURIComponent melempar
// URIError (mis. '%' yang bukan escape valid). Bungkus supaya tidak crash.
function safeName(url: string | null | undefined, prefix: RegExp): string | null {
  if (!url) return null
  const raw = url.split("/").pop() || ""
  let name = raw
  try {
    name = decodeURIComponent(raw)
  } catch {
    name = raw
  }
  return name.replace(prefix, "")
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, level, xp, gems, streak_count, avatar_url")
    .eq("id", user!.id)
    .single()
  const { count: applied } = await supabase
    .from("internships").select("id", { count: "exact", head: true }).eq("user_id", user!.id)

  // CV & interests fetched separately so the page still works if a column is missing.
  let extra: { cv_url: string | null; cv_text: string | null; interests: string | null } | null = null
  try {
    const { data } = await supabase
      .from("profiles").select("cv_url, cv_text, interests").eq("id", user!.id).single()
    extra = (data as any) ?? null
  } catch {}

  // Portfolio is fetched separately so it is safe if the column does not exist yet.
  let portfolio: { portfolio_url: string | null; portfolio_text: string | null } | null = null
  try {
    const { data } = await supabase
      .from("profiles").select("portfolio_url, portfolio_text").eq("id", user!.id).single()
    portfolio = (data as any) ?? null
  } catch {}

  // Plan is read separately so the page still renders if the column is missing.
  let plan = "free"
  try {
    const { data } = await supabase.from("profiles").select("plan").eq("id", user!.id).single()
    plan = ((data as any)?.plan as string) || "free"
  } catch {}

  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const target = level * 200
  const levelPct = Math.min(100, Math.round(((xp - (level - 1) * 200) / 200) * 100))

  const hasCv = !!extra?.cv_text
  const cvName = safeName(extra?.cv_url, /^cv-\d+-/)
  const hasPortfolio = !!portfolio?.portfolio_text
  const portfolioName = safeName(portfolio?.portfolio_url, /^portfolio-\d+-/)

  return (
    <section className="iq-screen is-active">
      <StreakCelebration streak={profile?.streak_count ?? 0} />
      <div className="iq-levelcard mb-6" style={csx("max-width:540px;margin-left:auto;margin-right:auto")}>
        {profile?.avatar_url && !isMascot(profile.avatar_url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="Profile photo" className="iq-avatar-lg" />
        ) : (
          <div className="iq-avatar-lg iq-avatar-lg--mascot">
            <MomoFace mood={moodOf(profile?.avatar_url)} size={104} />
          </div>
        )}
        <h2>Applicant, Level {level}</h2>
        <div className="iq-progress mt-4 mb-3"><div className="iq-progress__fill" style={csx("width:" + levelPct + "%")} /></div>
        <div className="muted" style={csx("font-size:12px")}>{xp} / {target} XP</div>
        <div className="iq-levelstats">
          <div><span className="big-num">{profile?.streak_count ?? 0}</span><small>Day Streak</small></div>
          <div><span className="big-num">{profile?.gems ?? 0}</span><small>Gems</small></div>
          <div><span className="big-num">{applied ?? 0}</span><small>Saved jobs</small></div>
        </div>
      </div>
      <div className="iq-grid iq-grid--dash">
        <div className="stack-6">
          <div className="iq-card iq-card__pad">
            <h3 className="mb-4">Personal Information</h3>
            <div className="iq-field"><span className="iq-field__k">Name</span><span className="iq-field__v">{profile?.full_name || "—"}</span></div>
            <div className="iq-field"><span className="iq-field__k">Email</span><span className="iq-field__v">{profile?.email || user?.email}</span></div>
            <div className="iq-field"><span className="iq-field__k">Level</span><span className="iq-field__v">{level}</span></div>
          </div>
          <ProfileExtras hasCv={hasCv} cvName={cvName} interests={extra?.interests ?? null} hasPortfolio={hasPortfolio} portfolioName={portfolioName} avatarUrl={profile?.avatar_url ?? null} plan={plan} />
          <div className="iq-card iq-card__pad iq-mobile-only">
            <h3 className="mb-4">Account</h3>
            <LogoutButton />
          </div>
          <div className="iq-card iq-card__pad">
            <h3 className="mb-4">Danger Zone</h3>
            <p className="muted mb-4" style={csx("font-size:13px")}>Deleting your account removes everything permanently: saved roles, CV, progress and gems. It cannot be undone.</p>
            <DeleteAccountButton />
          </div>
        </div>
        <div className="stack-6">
          <div className="iq-sidebyside">
            <Momo size={96} mood="wink" />
            <div className="iq-callout iq-callout--accent">
              <div><b>Keep going, {(profile?.full_name || "").split(" ")[0] || "there"}</b><p className="mt-2 iq-justify">Just {Math.max(0, target - xp)} XP more to Level {level + 1}. Open Sloe every day to keep your streak alive.</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
