import Link from "next/link"
import { headers } from "next/headers"
import { Mascot } from "@/components/Mascot"
import { Icon } from "@/components/Icons"
import { UpgradeButton } from "@/components/UpgradeButton"
import { csx } from "@/lib/csx"
import { createClient } from "@/lib/supabase/server"
import { readQuota, planCredits } from "@/lib/quota"
import { isConfigured } from "@/lib/midtrans"
import { PLAN_PRICE_USD_TEXT } from "@/lib/plans"
import { polarConfigured } from "@/lib/polar"

export const metadata = {
  title: "Plans · Sloe",
  description:
    "Sloe is free to start. Plus and Pro add more AI actions, more groups and the portfolio builder for the months you are applying hard.",
}

type Plan = {
  name: string
  idr: string
  usd: string
  cadence: string
  blurb: string
  cta: string
  href: string
  featured?: boolean
  features: string[]
  planId?: "plus" | "pro"
}

const PLANS: Plan[] = [
  {
    name: "Free",
    idr: "Rp0",
    usd: "$0",
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
    idr: "Rp19.900",
    usd: PLAN_PRICE_USD_TEXT.plus,
    planId: "plus",
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
    idr: "Rp39.900",
    usd: PLAN_PRICE_USD_TEXT.pro,
    planId: "pro",
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
    a: "In Indonesia, pay by QRIS or e-wallet (GoPay, ShopeePay). From outside Indonesia, pay in US dollars by card, Apple Pay or Google Pay. Your plan starts as soon as the payment clears, and the month runs from that moment. You can also top up 10 extra AI actions without changing your plan.",
  },
]

export default async function Pricing({ searchParams }: { searchParams: Promise<{ currency?: string }> }) {
  const sp = await searchParams
  const h = await headers()
  // Vercel sets x-vercel-ip-country; ?currency= lets a VPN user override it.
  const country = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "").toUpperCase()
  const currency: "IDR" | "USD" =
    sp.currency === "USD" ? "USD" : sp.currency === "IDR" ? "IDR" : country && country !== "ID" ? "USD" : "IDR"
  const usd = currency === "USD"
  const polarLive = polarConfigured()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const quota = user ? await readQuota(supabase, user.id) : null
  const allowance = quota ? planCredits(quota.plan) : 0
  const totalAllowance = allowance + (quota?.topup ?? 0)
  const usedPct =
    quota && totalAllowance > 0
      ? Math.min(100, Math.max(0, Math.round(((totalAllowance - quota.credits) / totalAllowance) * 100)))
      : 0
  const checkoutLive = isConfigured()

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
            <p className="iq-lp__fineprint">
              {usd
                ? "Prices in US dollars. One month at a time, no auto-renew."
                : "Prices in rupiah. One month at a time, no auto-renew."}
            </p>
            <div className="row" style={csx("gap:8px;margin:10px 0 4px;align-items:center")}>
              <span className="muted" style={csx("font-size:12px")}>Currency</span>
              <Link
                href="/pricing?currency=IDR"
                className={"iq-btn iq-btn--sm " + (usd ? "iq-btn--ghost" : "iq-btn--primary")}
                aria-current={usd ? undefined : "page"}
              >
                IDR
              </Link>
              <Link
                href="/pricing?currency=USD"
                className={"iq-btn iq-btn--sm " + (usd ? "iq-btn--primary" : "iq-btn--ghost")}
                aria-current={usd ? "page" : undefined}
              >
                USD
              </Link>
            </div>
            {quota && (
              <div className="iq-pr__meter">
                <div className="iq-pr__meter-head">
                  <span className="iq-pr__meter-label">
                    Gems left this month · {quota.plan === "free" ? "Free" : quota.plan === "plus" ? "Plus" : "Pro"} ·
                    3 gems per AI action
                  </span>
                  <span className="iq-pr__meter-num">
                    {quota.credits} / {totalAllowance}
                  </span>
                </div>
                <div className="iq-pr__meter-bar">
                  <i style={{ width: usedPct + "%" }} />
                </div>
              </div>
            )}
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
                <span className="iq-pr__amount">{usd ? p.usd : p.idr}</span>
                <span className="iq-pr__cadence">{p.cadence}</span>
              </div>
              <p className="iq-pr__blurb">{p.blurb}</p>
              {p.name === "Free" ? (
                <Link className={"iq-btn " + (p.featured ? "iq-btn--primary" : "iq-btn--ghost")} href={p.href}>
                  {p.cta}
                </Link>
              ) : usd ? (
                p.planId && polarLive && user ? (
                  <UpgradeButton plan={p.planId} label={p.cta} featured={p.featured} provider="polar" />
                ) : user ? (
                  <span className="iq-btn iq-btn--ghost" aria-disabled="true">
                    Card payment opens soon
                  </span>
                ) : (
                  <Link className={"iq-btn " + (p.featured ? "iq-btn--primary" : "iq-btn--ghost")} href="/login?mode=signup">
                    Sign up to pay by card
                  </Link>
                )
              ) : !user || !checkoutLive ? (
                <Link className={"iq-btn " + (p.featured ? "iq-btn--primary" : "iq-btn--ghost")} href={p.href}>
                  {p.cta}
                </Link>
              ) : (
                <UpgradeButton plan={p.planId ?? "plus"} label={p.cta} featured={p.featured} />
              )}
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

        <section className="iq-pr__topup mb-4" aria-label="Top-up">
          <div className="row" style={csx("gap:12px;align-items:center;flex-wrap:wrap")}>
            <div style={csx("flex:1;min-width:220px")}>
              <h3 style={csx("margin:0")}>Need a few more actions this month?</h3>
              <p className="muted" style={csx("margin:4px 0 0;font-size:13px")}>
                Top up 10 AI actions for {usd ? PLAN_PRICE_USD_TEXT.topup : "Rp10.000"}. It adds 30 gems to your balance
                and never changes your plan.
              </p>
            </div>
            {usd ? (
              polarLive && user ? (
                <UpgradeButton plan="topup" label="Top up 10 actions" provider="polar" />
              ) : user ? (
                <span className="iq-btn iq-btn--ghost" aria-disabled="true">
                  Card payment opens soon
                </span>
              ) : (
                <Link className="iq-btn iq-btn--ghost" href="/login?mode=signup">
                  Sign up to pay by card
                </Link>
              )
            ) : user && checkoutLive ? (
              <UpgradeButton plan="topup" label="Top up 10 actions" />
            ) : (
              <Link className="iq-btn iq-btn--ghost" href="/login?mode=signup">
                Start with Free
              </Link>
            )}
          </div>
        </section>

        <p className="iq-pr__note">
          {usd
            ? "Orders in US dollars are processed by Polar as Merchant of Record, including any applicable tax, receipts and refunds. Cards, Apple Pay and Google Pay accepted. Billing questions or refund requests: support@sloe.my.id."
            : checkoutLive
              ? "Pay by QRIS or e-wallet. Your plan starts as soon as the payment clears, and the month runs from that moment. Billing questions or refund requests: support@sloe.my.id."
              : "QRIS checkout opens soon. Start on Free and your account keeps your place when paid plans go live."}
        </p>
        <p className="iq-lp__fineprint">
          Prepaid access, no auto-renew ·{" "}
          <Link href="/refund">Refund &amp; Cancellation Policy</Link> · <Link href="/terms">Terms of Service</Link>
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
          Sloe · <Link href="/">Home</Link> · <Link href="/pricing">Pricing</Link> · <Link href="/terms">Terms</Link> ·{" "}
          <Link href="/privacy">Privacy</Link> · <Link href="/refund">Refund Policy</Link> ·{" "}
          <a href="mailto:support@sloe.my.id">support@sloe.my.id</a>
        </div>
      </div>
    </main>
  )
}
