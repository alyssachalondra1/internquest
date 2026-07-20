import Link from "next/link"
import { HeroMascot } from "@/components/HeroMascot"
import { MascotLottie } from "@/components/MascotLottie"
import { Icon } from "@/components/Icons"
import { ContactForm } from "@/components/ContactForm"
import { TestimonialForm } from "@/components/TestimonialForm"
import { createClient } from "@/lib/supabase/server"
import { csx } from "@/lib/csx"

export const metadata = {
  title: "Sloe - Your AI internship companion",
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
  { icon: "ic-users", bg: "linear-gradient(135deg,#FF6FA5,#7C5CFF)", t: "Internship groups", d: "Find or start groups with classmates and friends who share your interests, then swap internship opportunities with each other." },
]

const STEPS = [
  { t: "Create your account", d: "Sign up with email or Google and set up your student profile in a minute." },
  { t: "Add internships", d: "Upload a poster, paste a link, or read a poster posted on Instagram. You can also fill it in manually." },
  { t: "Track everything", d: "Follow deadlines on the calendar and complete the checklist for each application." },
  { t: "Apply with AI", d: "Generate tailored letters and emails, then submit with confidence." },
]

function stars(n: number) {
  const r = Math.max(0, Math.min(5, Math.round(n)))
  return "★★★★★".slice(0, r) + "☆☆☆☆☆".slice(0, 5 - r)
}

type Testimonial = { id: string; display_name: string; rating: number; body: string }

export default async function Landing() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from("testimonials")
    .select("id, display_name, rating, body, created_at")
    .order("created_at", { ascending: false })
    .limit(24)
  const list: Testimonial[] = (rows as Testimonial[] | null) ?? []
  const avg = list.length ? list.reduce((s, t) => s + (t.rating || 0), 0) / list.length : 0

  let myName = ""
  let myTestimonial: { display_name: string; rating: number; body: string } | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
    myName = profile?.full_name ?? ""
    const { data: mine } = await supabase
      .from("testimonials")
      .select("display_name, rating, body")
      .eq("user_id", user.id)
      .maybeSingle()
    myTestimonial = (mine as { display_name: string; rating: number; body: string } | null) ?? null
  }

  return (
    <main className="iq-lp">
      <nav className="iq-lp__nav">
        <span className="iq-wordmark" style={csx("font-size:22px")}>Sloe</span>
        <div style={csx("display:flex;gap:10px")}>
          <Link className="iq-btn iq-btn--ghost iq-btn--sm" href="/login">Log in</Link>
          <Link className="iq-btn iq-btn--primary iq-btn--sm" href="/login?mode=signup">Get started</Link>
        </div>
      </nav>

      <div className="iq-lp__wrap">
        <section className="iq-lp__hero">
          <div>
            <MascotLottie size={240} className="iq-lp__heromascot" fallback="/mascot-hero.png" />
            <span className="iq-lp__badge iq-lp__badge--yellow">Your AI internship companion</span>
            <h1 className="iq-lp__title">Turn your internship hunt into a <span className="iq-lp__grad">winning quest</span></h1>
            <p className="iq-lp__sub">Sloe helps students find, track, and win internships. Save opportunities from posters and links, get AI help with your applications, share finds with internship groups, and stay motivated with a friendly gamified workspace.</p>
            <div className="iq-lp__cta">
              <Link className="iq-btn iq-btn--primary" href="/login?mode=signup">Get started free <Icon name="ic-arrow-right" className="ic ic-18" /></Link>
              <Link className="iq-btn iq-btn--ghost" href="/dashboard">Open dashboard</Link>
            </div>
          </div>
          <div className="iq-lp__art">
            <div className="row" style={csx("gap:12px;margin-bottom:16px")}>
              <HeroMascot src="/mascot-quest.png" size={80} />
              <div><b style={csx("font-size:16px")}>Today&apos;s Quest</b><div style={csx("opacity:.9;font-size:13px")}>3 tasks to level up</div></div>
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

        <section className="iq-lp__sec" id="reviews">
          <h2 className="iq-lp__h2">Loved by students</h2>
          <p className="iq-lp__lead">Real reviews from students using Sloe on their internship hunt.</p>
          {list.length > 0 && (
            <div className="iq-tm__summary">
              <span className="iq-tm__avg">{avg.toFixed(1)}</span>
              <span className="iq-tm__avgstars">{stars(avg)}</span>
              <span className="muted">{list.length} review{list.length === 1 ? "" : "s"}</span>
            </div>
          )}
          {list.length > 0 ? (
            <div className="iq-tm__grid">
              {list.map((t) => (
                <div key={t.id} className="iq-tm__card">
                  <div className="iq-tm__stars">{stars(t.rating)}</div>
                  <p className="iq-tm__body">{t.body}</p>
                  <div className="iq-tm__by">— {t.display_name}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="iq-lp__lead" style={csx("margin-bottom:22px")}>No reviews yet — be the first to share your experience!</p>
          )}
          <div className="iq-tm__formwrap">
            <TestimonialForm loggedIn={!!user} defaultName={myName} existing={myTestimonial} />
          </div>
        </section>

        <section className="iq-lp__cta-band">
          <h2>Ready to start your quest?</h2>
          <p>Join Sloe and turn a stressful search into a clear, motivating plan.</p>
          <Link className="iq-btn iq-btn--ghost" href="/login?mode=signup" style={csx("background:#fff;color:#3B2FA0")}>Create your free account</Link>
        </section>

        <section className="iq-lp__sec" id="contact">
          <h2 className="iq-lp__h2">Get in touch</h2>
          <p className="iq-lp__lead">Have feedback or suggestions? Send them straight to us — we&apos;d love to hear from you.</p>
          <div className="iq-contact">
            <div className="iq-contact__info">
              <div className="iq-contact__item">
                <div className="iq-contact__ic"><Icon name="ic-doc" className="ic ic-18" /></div>
                <div><div className="iq-contact__label">Email</div><div className="iq-contact__val">alyssachalondra@gmail.com</div></div>
              </div>
              <div className="iq-contact__item">
                <div className="iq-contact__ic"><Icon name="ic-pin" className="ic ic-18" /></div>
                <div><div className="iq-contact__label">Location</div><div className="iq-contact__val">Surakarta, Central Java, Indonesia</div></div>
              </div>
              <a className="iq-contact__item" href="https://linkedin.com/in/alyssachalondra" target="_blank" rel="noreferrer">
                <div className="iq-contact__ic"><Icon name="ic-link" className="ic ic-18" /></div>
                <div><div className="iq-contact__label">LinkedIn</div><div className="iq-contact__val">linkedin.com/in/alyssachalondra</div></div>
              </a>
            </div>
            <ContactForm />
          </div>
        </section>

        <div className="iq-lp__foot">Sloe · Built for students, powered by AI. · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></div>
      </div>
    </main>
  )
}
