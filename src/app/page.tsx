import Link from "next/link"
import { Mascot } from "@/components/Mascot"
import { Icon } from "@/components/Icons"
import { TestimonialForm } from "@/components/TestimonialForm"
import { createClient } from "@/lib/supabase/server"
import { csx } from "@/lib/csx"

export const metadata = {
  title: "Sloe",
  description:
    "Sloe keeps the roles you save, the deadlines you cannot miss and the letters you have to write in one place.",
}

/* Three things the product does, each a real part of the job hunt. */
const GROUPS = [
  {
    icon: "ic-upload",
    t: "Save a role in one paste",
    d: "Drop a link, a poster or a screenshot. Sloe pulls out the company, the role and the closing date, so you never retype a posting you already read.",
    meta: "Link · poster · screenshot",
  },
  {
    icon: "ic-list",
    t: "See every application at a glance",
    d: "Every application sits in one list with its status, its deadline and a CV match score. You can tell which ones went quiet without opening five tabs.",
    meta: "List · status · match",
  },
  {
    icon: "ic-ai",
    t: "Walk in with the draft done",
    d: "Sloe writes the cover letter from your CV and the role, then keeps the checklist honest about what is still missing before you send it.",
    meta: "Draft · checklist",
  },
]

const STEPS = [
  { t: "Add a role", d: "Paste the link. We fill in the rest." },
  { t: "Set the closing date", d: "One date, one reminder you cannot miss." },
  { t: "Send the draft", d: "Check the list, then apply." },
]

const PREVIEW_ROWS = [
  { role: "Product designer", company: "Kawan Studio", status: "Interview Fri", pct: 70, initials: "KS", tone: "accent" },
  { role: "Data analyst", company: "Ruang Data", status: "Draft due", pct: 45, initials: "RD", tone: "warn" },
  { role: "Frontend engineer", company: "Sagara", status: "Applied", pct: 100, initials: "SG", tone: "quiet" },
]

function Stars({ n }: { n: number }) {
  const r = Math.max(0, Math.min(5, Math.round(n)))
  return (
    <span className="iq-stars-row" aria-label={r + " out of 5"}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="ic-star" className={"ic ic-16" + (i <= r ? " ic--fill" : "")} />
      ))}
    </span>
  )
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
      <div className="iq-lp__panel">
      <nav className="iq-lp__nav">
        <Link className="iq-lp__wordmark" href="/">
          Sloe
        </Link>
        <div className="iq-lp__navlinks">
          <a href="#features">Features</a>
          <Link href="/pricing">Pricing</Link>
          <a href="#reviews">Reviews</a>
        </div>
        <div className="iq-lp__navactions">
          <Link className="iq-lp__login" href="/login">
            Log in
          </Link>
          <Link className="iq-btn iq-btn--primary iq-btn--sm" href="/login?mode=signup">
            Get started
          </Link>
        </div>
      </nav>

        <div className="iq-lp__hero">
          <div className="iq-lp__herotext">
            <p className="iq-lp__eyebrow">For students and fresh graduates</p>
            <h1 className="iq-lp__title">
              Every application, deadline and draft in{" "}
              <span className="iq-lp__inline">
                <Icon name="ic-pin" className="ic ic-20" />
                one place
              </span>
            </h1>
            <p className="iq-lp__sub">
              Sloe keeps the roles you are chasing, the closing dates you cannot miss and the letters you still owe in
              one calm list, so the next step is always obvious.
            </p>
            <div className="iq-lp__cta">
              <Link className="iq-btn iq-btn--primary" href="/login?mode=signup">
                Create a free account
              </Link>
              <a className="iq-btn iq-btn--ghost" href="#features">
                See what it does
              </a>
            </div>
            {list.length > 0 && (
              <div className="iq-lp__proof">
                <Stars n={avg} />
                <span className="iq-lp__prooftext">
                  <b>{avg.toFixed(1)}</b> from {list.length} review{list.length === 1 ? "" : "s"}
                </span>
              </div>
            )}
            <p className="iq-lp__fineprint">Free to start · 10 AI actions a month · No card needed</p>
          </div>

          <div className="iq-lp__desk">
            <Mascot src="/mascot-hero.png" fluid priority className="iq-lp__sceneimg" />
            <div className="iq-lp__mini iq-lp__mini--l">
              <div className="iq-lp__mini-head">
                <Icon name="ic-check" className="ic ic-16" />
                <span>Checklist</span>
              </div>
              <div className="iq-lp__mini-row">CV tailored</div>
              <div className="iq-lp__mini-row">Portfolio link</div>
              <div className="iq-lp__mini-row iq-lp__mini-row--dim">Cover letter</div>
            </div>
            <div className="iq-lp__mini iq-lp__mini--r">
              <div className="iq-lp__mini-head">
                <Icon name="ic-target" className="ic ic-16" />
                <span>CV match</span>
              </div>
              <div className="iq-lp__mini-num">82%</div>
              <div className="iq-lp__mini-bar">
                <i />
              </div>
            </div>
            <div className="iq-lp__previewwrap">
              <div className="iq-lp__preview">
                <div className="iq-lp__preview-head">
                  <span>This week</span>
                  <span className="iq-lp__mono">3 due</span>
                </div>
                {PREVIEW_ROWS.map((r) => (
                  <div key={r.role} className="iq-lp__prow">
                    <span className="iq-lp__plogo" aria-hidden="true">
                      {r.initials}
                    </span>
                    <div>
                      <div className="iq-lp__prow-role">{r.role}</div>
                      <div className="iq-lp__prow-company">{r.company}</div>
                      <div className="iq-lp__prow-bar">
                        <i style={{ width: r.pct + "%" }} />
                      </div>
                    </div>
                    <div className={"iq-lp__prow-status iq-lp__prow-status--" + r.tone}>{r.status}</div>
                  </div>
                ))}
                <div className="iq-lp__preview-foot">
                  <span>3 applied · 1 interview</span>
                  <span>Updated 2 min ago</span>
                </div>
              </div>
              <div className="iq-lp__note">
                <span className="iq-lp__note-num">2</span>
                <span className="iq-lp__note-label">interviews booked this week</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="iq-lp__wrap">
        <div className="iq-lp__stats">
          <div className="iq-lp__stat iq-lp__stat--accent">
            <span className="iq-lp__statkicker">Free plan</span>
            <span className="iq-lp__statnum">10</span>
            <span className="iq-lp__statlabel">AI actions each month, free</span>
            <span className="iq-lp__statpill">No card needed</span>
          </div>
          <div className="iq-lp__stat iq-lp__stat--quote">
            <span className="iq-lp__statkicker">{list.length > 0 ? "In their words" : "What it is"}</span>
            {list.length > 0 ? (
              <>
                <p className="iq-lp__statquote">“{list[0].body}”</p>
                <div className="iq-lp__statby">
                  <span className="iq-lp__statavatar">{list[0].display_name.slice(0, 1).toUpperCase()}</span>
                  <span>{list[0].display_name}</span>
                </div>
              </>
            ) : (
              <p className="iq-lp__statquote">
                One calm list for the roles, the dates and the drafts that usually live in five different places.
              </p>
            )}
          </div>
          <div className="iq-lp__stat iq-lp__stat--tint">
            <span className="iq-lp__statkicker">Three steps</span>
            <span className="iq-lp__statnum">3</span>
            <span className="iq-lp__statlabel">from saved role to sent application</span>
            <span className="iq-lp__statpill iq-lp__statpill--dark">Add · date · send</span>
          </div>
        </div>

        <section className="iq-lp__sec" id="features">
          <div className="iq-lp__sechead">
            <h2 className="iq-lp__h2">What Sloe keeps track of</h2>
            <p className="iq-lp__lead">
              Three things that usually live in five different places: a notes app, a chat with yourself, a calendar and
              a folder of half-written letters.
            </p>
          </div>
          <div className="iq-lp__groups">
            {GROUPS.map((g, i) => (
              <div key={g.t} className="iq-lp__group">
                <div className="iq-lp__group-top">
                  <Icon name={g.icon} className="ic ic-18" />
                </div>
                <h3>{g.t}</h3>
                <p>{g.d}</p>
                <div className="iq-lp__group-meta">{g.meta}</div>
              </div>
            ))}
          </div>
          <div className="iq-lp__steps">
            {STEPS.map((s, i) => (
              <div key={s.t} className="iq-lp__step">
                <div className="iq-lp__num iq-lp__mono">{i + 1}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="iq-lp__sec" id="reviews">
          <div className="iq-lp__sechead">
            <h2 className="iq-lp__h2">What people say</h2>
            <p className="iq-lp__lead">Reviews from people using Sloe on their job hunt.</p>
          </div>
          {list.length > 0 && (
            <div className="iq-tm__summary">
              <span className="iq-tm__avg iq-lp__mono">{avg.toFixed(1)}</span>
              <span className="iq-tm__avgstars">
                <Stars n={avg} />
              </span>
              <span className="muted">
                {list.length} review{list.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
          {list.length > 0 ? (
            <div className="iq-tm__grid">
              {list.map((t) => (
                <div key={t.id} className="iq-tm__card">
                  <div className="iq-tm__stars">
                    <Stars n={t.rating} />
                  </div>
                  <p className="iq-tm__body">{t.body}</p>
                  <div className="iq-tm__by">— {t.display_name}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="iq-lp__lead" style={csx("margin-bottom:22px")}>
              No reviews yet — be the first to share your experience.
            </p>
          )}
          <div className="iq-tm__formwrap iq-lp__formrow">
            <TestimonialForm loggedIn={!!user} defaultName={myName} existing={myTestimonial} />
            <p className="iq-lp__tmnote">
              Reviews are public. Only the pen name you choose appears next to your words, and you can update your
              review whenever you like.
            </p>
          </div>
        </section>

        <section className="iq-lp__cta-band">
          <div className="iq-lp__cta-bandtext">
            <h2>Start with the roles you already have saved</h2>
            <p>Bring your screenshots, links and notes. Sloe sorts them into something you can act on.</p>
            <div className="iq-lp__cta">
              <Link className="iq-btn iq-btn--primary" href="/login?mode=signup">
                Create a free account
              </Link>
              <Link className="iq-btn iq-btn--ghost iq-lp__bandghost" href="/pricing">
                See plans
              </Link>
            </div>
          </div>
          <div className="iq-lp__note iq-lp__note--band">
            <span className="iq-lp__note-num">10</span>
            <span className="iq-lp__note-label">AI actions a month, free</span>
          </div>
        </section>

        <div className="iq-lp__foot">
          Sloe · Built for students · <Link href="/pricing">Pricing</Link> · <Link href="/terms">Terms</Link> ·{" "}
          <Link href="/privacy">Privacy</Link> · <Link href="/refund">Refund Policy</Link> ·{" "}
          <a href="mailto:support@sloe.my.id">support@sloe.my.id</a>
        </div>
      </div>
    </main>
  )
}
