import Link from "next/link"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { Mascot } from "@/components/Mascot"
import { CompanyLogo } from "@/components/CompanyLogo"
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

/* Preview content for the three product cards on the landing page.
   Every company, role, place and date here is invented on purpose: the brief
   (25 Nov 2026) forbids real postings on the public page. */
const DUMMY = {
  job: {
    when: "Rolling intake",
    company: "Kiranawala Studio",
    role: "Social Media Intern",
    meta: "Bandung · Hybrid · 4 months",
    done: 1,
    total: 4,
    chip: "To Do",
  },
  deadlines: [
    { company: "Kiranawala Studio", until: "Registration until 4 Dec", chip: "5 days", cls: "iq-chip--blue" },
    { company: "Arunika Labs", until: "Registration until 6 Dec", chip: "7 days", cls: "iq-chip--blue" },
    { company: "Bayu Ventures", until: "Registration until 9 Dec", chip: "10 days", cls: "iq-chip--yellow" },
  ],
  match: {
    score: 86,
    note:
      "The portfolio leans on social content, simple analytics dashboards and scheduling tools, which is what Kiranawala Studio asks for in this role. Nothing in the listing is missing from the CV, so the score stays high.",
  },
}

/* Exact number of people who have an account. Read with the service role
   because row level security hides other people's profiles from the anon
   client. When the key is absent the number is simply not shown — never faked. */
async function readUserCount(): Promise<number | null> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) return null
  const admin = createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { count, error } = await admin.from("profiles").select("*", { count: "exact", head: true })
  if (error) return null
  return count ?? null
}

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
  const userCount = await readUserCount()

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
            {userCount !== null && (
              <p className="iq-lp__usercount">
                <span className="iq-lp__livedot" aria-hidden="true" />
                <b>{userCount.toLocaleString("en-US")}</b>
                <span>people already keep their applications on Sloe</span>
              </p>
            )}
            <p className="iq-lp__fineprint">Free to start · 10 AI actions a month · No card needed</p>
          </div>

          <div className="iq-lp__desk">
            <Mascot src="/mascot-hero.png" fluid priority className="iq-lp__sceneimg" />
          </div>

          {/* Tiga kartu resmi Sloe. Bentuk, warna dan proporsinya sama dengan
              yang dipakai di dalam aplikasi; isinya data dummy. */}
          <div className="iq-lp__cards">
            <div className="iq-lp__cardslot">
              <div className="iq-lp__cardlabel">
                <Icon name="ic-list" className="ic ic-16" /> Application card
              </div>
              <div className="iq-icard iq-icard--pink">
                <span className="iq-timechip">
                  <Icon name="ic-clock" className="ic ic-16" /> {DUMMY.job.when}
                </span>
                <div className="iq-icard__top">
                  <CompanyLogo name={DUMMY.job.company} />
                  <div>
                    <div className="iq-icard__title">{DUMMY.job.company}</div>
                    <div className="iq-icard__sub">{DUMMY.job.role}</div>
                  </div>
                </div>
                <div className="iq-icard__meta">{DUMMY.job.meta}</div>
                <div className="iq-progress">
                  <div
                    className="iq-progress__fill"
                    style={csx("width:" + Math.round((DUMMY.job.done / DUMMY.job.total) * 100) + "%")}
                  />
                </div>
                <div className="iq-icard__foot">
                  <span>
                    Checklist {DUMMY.job.done}/{DUMMY.job.total}
                  </span>
                  <span className="iq-chip iq-chip--yellow">{DUMMY.job.chip}</span>
                </div>
                <span className="iq-apply-btn" aria-hidden="true">
                  <Icon name="ic-link" className="ic ic-16" /> Apply
                </span>
              </div>
            </div>

            <div className="iq-lp__cardslot">
              <div className="iq-lp__cardlabel">
                <Icon name="ic-clock" className="ic ic-16" /> Deadlines
              </div>
              <div className="iq-card iq-card__pad">
                <div className="iq-sec-title">
                  <h3>Upcoming Deadlines</h3>
                  <Link href="/login">Calendar</Link>
                </div>
                {DUMMY.deadlines.map((d) => (
                  <div key={d.company} className="iq-dl">
                    <span className="iq-tag-dot" style={csx("background:var(--blue)")} />
                    <div style={csx("flex:1")}>
                      <div className="iq-dl__t">{d.company}</div>
                      <div className="iq-dl__s">{d.until}</div>
                    </div>
                    <span className={"iq-chip " + d.cls}>{d.chip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="iq-lp__cardslot">
              <div className="iq-lp__cardlabel">
                <Icon name="ic-target" className="ic ic-16" /> Match
              </div>
              <div className="iq-card iq-card__pad">
                <div className="row mb-4">
                  <Icon name="ic-target" className="ic ic-22" style={csx("color:var(--blue-text)")} />
                  <h3>CV &amp; Company Match</h3>
                </div>
                <div className="iq-match__score">{DUMMY.match.score}%</div>
                <div className="iq-match__bar">
                  <i style={csx("width:" + DUMMY.match.score + "%")} />
                </div>
                <p className="muted iq-justify" style={csx("font-size:13px")}>
                  {DUMMY.match.note}
                </p>
                <button className="iq-btn iq-btn--blue iq-btn--block iq-btn--sm mt-4" disabled>
                  <Icon name="ic-ai" className="ic ic-16" /> Recalculate
                </button>
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
          {userCount === null ? (
            <div className="iq-lp__stat iq-lp__stat--quote">
              <span className="iq-lp__statkicker">What it is</span>
              <p className="iq-lp__statquote">
                One calm list for the roles, the dates and the drafts that usually live in five different places.
              </p>
            </div>
          ) : (
            <div className="iq-lp__stat iq-lp__stat--live">
              <span className="iq-lp__statkicker">Live from the database</span>
              <span className="iq-lp__statnum">{userCount.toLocaleString("en-US")}</span>
              <span className="iq-lp__statlabel">people with a Sloe account, right now</span>
              <span className="iq-lp__statpill">Counted, not estimated</span>
            </div>
          )}
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
