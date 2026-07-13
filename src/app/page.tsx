import Link from "next/link"
import { Questy } from "@/components/Questy"
import { Icon } from "@/components/Icons"
import { csx } from "@/lib/csx"

export const metadata = {
  title: "InternQuest - Your AI internship companion",
  description: "Find, track, and win internships with an AI companion that keeps you organized and motivated.",
}

const FEATURES = [
  { icon: "ic-upload", bg: "linear-gradient(135deg,#FF6FA5,#FF9F6F)", t: "Add from anywhere", d: "Upload a poster, paste a link, or read a poster shared on Instagram. AI fills in the details for you." },
  { icon: "ic-ai", bg: "linear-gradient(135deg,#7C5CFF,#3B76FF)", t: "AI writing helper", d: "Generate motivation letters, cover letters, and HR emails that match your CV in seconds." },
  { icon: "ic-target", bg: "linear-gradient(135deg,#2FCB7E,#3B76FF)", t: "CV match score", d: "See how well you fit each role and get clear tips on what to improve before you apply." },
  { icon: "ic-calendar", bg: "linear-gradient(135deg,#3B76FF,#7C5CFF)", t: "Deadline calendar", d: "Every registration window and start date in one place, so you never miss an opportunity." },
  { icon: "ic-trophy", bg: "linear-gradient(135deg,#FFC53D,#FF6FA5)", t: "Gamified progress", d: "Earn XP and gems, keep your daily streak, and unlock badges every time you move an application forward." },
  { icon: "ic-check", bg: "linear-gradient(135deg,#2FCB7E,#2FCB7E)", t: "Smart checklist", d: "Track the documents each application needs and check them off as you go." },
  { icon: "ic-list", bg: "linear-gradient(135deg,#3B76FF,#2FCB7E)", t: "Application tracker", d: "Move every internship across a clear board, from To Do to Applied, Interview, and Offer, and see your whole pipeline at a glance." },
  { icon: "ic-users", bg: "linear-gradient(135deg,#FF6FA5,#7C5CFF)", t: "Study groups", d: "Create or join groups with classmates and friends who share your interests, then share internship opportunities with each other." },
]

const STEPS = [
  { t: "Create your account", d: "Sign up with email or Google and set up your student profile in a minute." },
  { t: "Add internships", d: "Upload a poster, paste a link, or read a poster posted on Instagram. You can also fill it in manually." },
  { t: "Track everything", d: "Follow deadlines on the calendar and complete the checklist for each application." },
  { t: "Apply with AI", d: "Generate tailored letters and emails, then submit with confidence." },
]

export default function Landing() {
  return (
    <main className="iq-lp">
      <nav className="iq-lp__nav">
        <span style={csx("font-weight:800;font-size:22px;color:#141B2E;letter-spacing:-.02em")}>
          Intern<span style={csx("color:#5B3FE0")}>Quest</span>
        </span>
        <div style={csx("display:flex;gap:10px")}>
          <Link className="iq-btn iq-btn--ghost iq-btn--sm" href="/login">Log in</Link>
          <Link className="iq-btn iq-btn--primary iq-btn--sm" href="/login?mode=signup">Get started</Link>
        </div>
      </nav>

      <div className="iq-lp__wrap">
        <section className="iq-lp__hero">
          <div>
            <span className="iq-lp__badge">✨ Your AI internship companion</span>
            <h1 className="iq-lp__title">Turn your internship hunt into a <span className="iq-lp__grad">winning quest</span></h1>
            <p className="iq-lp__sub">InternQuest helps students find, track, and win internships. Save opportunities from posters and links, get AI help with your applications, share finds with study groups, and stay motivated with a friendly gamified workspace.</p>
            <div className="iq-lp__cta">
              <Link className="iq-btn iq-btn--primary" href="/login?mode=signup">Get started free <Icon name="ic-arrow-right" className="ic ic-18" /></Link>
              <Link className="iq-btn iq-btn--ghost" href="/dashboard">Open dashboard</Link>
            </div>
          </div>
          <div className="iq-lp__art">
            <div className="row" style={csx("gap:12px;margin-bottom:16px")}>
              <Questy size={64} />
              <div><b style={csx("font-size:16px")}>Today's Quest</b><div style={csx("opacity:.9;font-size:13px")}>3 tasks to level up</div></div>
            </div>
            <div className="iq-lp__arti"><Icon name="ic-check" className="ic ic-18" /> Finish your CV checklist</div>
            <div className="iq-lp__arti"><Icon name="ic-ai" className="ic ic-18" /> Generate a motivation letter</div>
            <div className="iq-lp__arti"><Icon name="ic-calendar" className="ic ic-18" /> Apply before the deadline</div>
          </div>
        </section>

        <section className="iq-lp__sec">
          <h2 className="iq-lp__h2">Everything you need to land the role</h2>
          <p className="iq-lp__lead">One tidy workspace for the whole journey, from spotting an opportunity to sending a polished application.</p>
          <div className="iq-lp__cards">
            {FEATURES.map((f) => (
              <div key={f.t} className="iq-lp__card">
                <div className="iq-lp__ic" style={csx("background:" + f.bg)}><Icon name={f.icon} className="ic ic-22" /></div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="iq-lp__sec">
          <h2 className="iq-lp__h2">How it works</h2>
          <p className="iq-lp__lead">Get started in four simple steps.</p>
          <div className="iq-lp__steps">
            {STEPS.map((s, i) => (
              <div key={s.t} className="iq-lp__step">
                <div className="iq-lp__num">{i + 1}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="iq-lp__cta-band">
          <h2>Ready to start your quest?</h2>
          <p>Join InternQuest and turn a stressful search into a clear, motivating plan.</p>
          <Link className="iq-btn iq-btn--ghost" href="/login?mode=signup" style={csx("background:#fff;color:#3B2FA0")}>Create your free account</Link>
        </section>

        <div className="iq-lp__foot">InternQuest · Built for students, powered by AI.</div>
      </div>
    </main>
  )
}
