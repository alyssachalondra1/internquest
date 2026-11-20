import Link from "next/link"
import { Mascot } from "@/components/Mascot"
import { Icon } from "@/components/Icons"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Plans · Sloe",
  description:
    "Sloe is free to start. Plus and Pro add more AI actions, more groups and the portfolio builder for the months you are applying hard.",
}

type Plan = {
  name: string
  price: string
  cadence: string
  blurb: string
  cta: string
  href: string
  featured?: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "Rp0",
    cadence: "forever",
    blurb: "For the first handful of applications.",
    cta: "Start free",
    href: "/login?mode=signup",
    features: [
      "10 AI actions a month",
      "5 screenshot reads a month",
      "2 groups, up to 10 members each",
      "Job list, calendar and checklists",
      "CV match score on every role",
    ],
  },
  {
    name: "Plus",
    price: "Rp19.900",
    cadence: "per month",
    blurb: "For the month you are applying seriously.",
    cta: "Choose Plus",
    href: "/login?mode=signup&plan=plus",
    featured: true,
    features: [
      "100 AI actions a month",
      "Unlimited screenshot reads",
      "10 groups, up to 30 members each",
      "Portfolio builder",
      "Cover letters and HR emails from your CV",
      "Everything in Free",
    ],
  },
  {
    name: "Pro",
    price: "Rp39.900",
    cadence: "per month",
    blurb: "For a full search across several tracks.",
    cta: "Choose Pro",
    href: "/login?mode=signup&plan=pro",
    features: [
      "300 AI actions a month",
      "Unlimited screenshot reads",
      "Unlimited groups and members",
      "Portfolio builder",
      "Priority on new AI features",
      "Everything in Plus",
    ],
  },
]

const QUESTIONS = [
  {
    q: "What counts as an AI action",
    a: "Anything Sloe does with a model: reading a poster or screenshot, scoring a CV against a role, drafting a letter or an email. Opening your job list and ticking a checklist never uses one.",
  },
  {
    q: "Can I stay on Free",
    a: "Yes. Free keeps the whole tracker, the calendar and the checklists. You only run into the limit when you lean on AI a lot in one month.",
  },
  {
    q: "How do I pay",
    a: "Card and QRIS checkout is being connected. Start free now, and your account keeps your place when paid plans open.",
  },
]

export default async function Pricing() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="iq-lp iq-pr">
      <nav className="iq-lp__nav">
        <Link className="iq-lp__wordmark" href="/">
          Sloe
        </Link>
        <div className="iq-lp__navlinks">
          <Link href="/#features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/#reviews">Reviews</Link>
        </div>
        <div className="iq-lp__navactions">
          {user ? (
            <Link className="iq-btn iq-btn--primary iq-btn--sm" href="/dashboard">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link className="iq-lp__login" href="/login">
                Log in
              </Link>
              <Link className="iq-btn iq-btn--primary iq-btn--sm" href="/login?mode=signup">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="iq-lp__wrap">
        <section className="iq-pr__hero">
          <div>
            <p className="iq-lp__eyebrow">Plans</p>
            <h1 className="iq-lp__title">Pay only for the months you are applying hard</h1>
            <p className="iq-lp__sub">
              Every plan keeps the same tracker. What changes is how much AI work you can lean on while you apply, and
              how many groups you can run with classmates.
            </p>
            <p className="iq-lp__fineprint">Prices in rupiah. Cancel whenever you like.</p>
          </div>
          <div className="iq-pr__heroart">
            <Mascot src="/welcomee.png" fluid priority className="iq-pr__heroimg" />
          </div>
        </section>

        <section className="iq-pr__plans" aria-label="Plans">
          {PLANS.map((p) => (
            <div key={p.name} className={"iq-pr__plan" + (p.featured ? " iq-pr__plan--featured" : "")}>
              <div className="iq-pr__plan-head">
                <h2>{p.name}</h2>
                {p.featured && <span className="iq-pr__tag">Most picked</span>}
              </div>
              <div className="iq-pr__price">
                <span className="iq-pr__amount">{p.price}</span>
                <span className="iq-pr__cadence">{p.cadence}</span>
              </div>
              <p className="iq-pr__blurb">{p.blurb}</p>
              <Link className={"iq-btn " + (p.featured ? "iq-btn--primary" : "iq-btn--ghost")} href={p.href}>
                {p.cta}
              </Link>
              <ul className="iq-pr__list">
                {p.features.map((f) => (
                  <li key={f}>
                    <Icon name="ic-check" className="ic ic-16" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <p className="iq-pr__note">
          Card and QRIS checkout opens soon. Start on Free now and your account keeps your place when paid plans go live.
        </p>

        <section className="iq-lp__sec" id="questions">
          <div className="iq-lp__sechead">
            <h2 className="iq-lp__h2">Questions people ask before paying</h2>
          </div>
          <div className="iq-pr__faq">
            {QUESTIONS.map((q) => (
              <div key={q.q} className="iq-pr__faqitem">
                <h3>{q.q}</h3>
                <p>{q.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="iq-lp__foot">
          Sloe · <Link href="/">Home</Link> · <Link href="/pricing">Pricing</Link> · <a href="/privacy">Privacy</a> ·{" "}
          <a href="/terms">Terms</a>
        </div>
      </div>
    </main>
  )
}
