import Link from "next/link"
import { Mascot } from "@/components/Mascot"
import { Icon } from "@/components/Icons"
import { ContactForm } from "@/components/ContactForm"
import { TestimonialForm } from "@/components/TestimonialForm"
import { createClient } from "@/lib/supabase/server"
import { csx } from "@/lib/csx"

export const metadata = {
  title: "Sloe",
  description:
    "Sloe keeps the roles you save, the deadlines you cannot miss and the letters you have to write in one place.",
}

/* Four jobs the product does, grouped so the page reads as a plan instead of
   eight equal tiles. Order follows the real workflow: save, track, apply, keep going. */
const GROUPS = [
  {
    icon: "ic-upload",
    t: "Save roles from anywhere",
    d: "Paste a link, upload a poster, or drop in a screenshot from Instagram. Sloe fills in the company, the role and the deadline for you.",
    meta: "Link · poster · screenshot",
  },
  {
    icon: "ic-list",
    t: "See the whole pipeline",
    d: "Every application moves across one board, from to do to applied, interview and offer. Each role also gets a CV match score and a short list of what to fix before you send it.",
    meta: "Board · CV match",
  },
  {
    icon: "ic-calendar",
    t: "Never miss a deadline",
    d: "Registration windows and start dates sit on one calendar, and every application carries its own document checklist so nothing is sent half finished.",
    meta: "Calendar · checklist",
  },
  {
    icon: "ic-ai",
    t: "Write, then keep going",
    d: "Draft motivation letters and HR emails from your own CV, then track XP, streaks and badges as you move things forward. Peer groups let you swap leads with classmates.",
    meta: "Drafts · XP · groups",
  },
]

const STEPS = [
  { t: "Create your account", d: "Sign up with email or Google and set up your profile in about a minute." },
  { t: "Add the roles you find", d: "Paste a link, upload a poster, or type the details yourself." },
  { t: "Set the dates", d: "Put the deadline on your calendar and list the documents each application needs." },
  { t: "Send the application", d: "Draft the letter with help, check the checklist, then submit." },
]

const PREVIEW_ROWS = [
  { role: "Junior Product Designer", company: "Ruang Kerja", status: "Interview Friday", tone: "blue" },
  { role: "Data Analyst", company: "Nusa Labs", status: "Draft due Monday", tone: "yellow" },
  { role: "Frontend Developer", company: "Sagara Studio", status: "Applied", tone: "green" },
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
      <nav className="iq-lp__nav">
        <Link className="iq-lp__wordmark" href="/">
          Sloe
        </Link>
        <div className="iq-lp__navlinks">
          <a href="#how">How it works</a>
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

      <div className="iq-lp__wrap">
        <section className="iq-lp__hero">
          <div className="iq-lp__herotext">
            <p className="iq-lp__eyebrow">For students and fresh graduates</p>
            <h1 className="iq-lp__title">Every application, deadline and draft in one place</h1>
            <p className="iq-lp__sub">
              Sloe keeps the roles you save, the dates you cannot miss and the letters you have to write together, so
              you always know what to do next.
            </p>
            <div className="iq-lp__cta">
              <Link className="iq-btn iq-btn--primary" href="/login?mode=signup">
                Create a free account
              </Link>
              <a className="iq-btn iq-btn--ghost" href="#how">
                See how it works
              </a>
            </div>
            <p className="iq-lp__fineprint">Free plan · 10 AI actions a month · No card needed</p>
          </div>

          <div className="iq-lp__desk">
            <div className="iq-lp__print">
              <Mascot src="/mascot-hero.png" w={256} h={182} priority className="iq-lp__printimg" />
            </div>
            <div className="iq-lp__preview">
              <div className="iq-lp__preview-head">
                <span>This week</span>
                <span className="iq-lp__mono">3 due</span>
              </div>
              {PREVIEW_ROWS.map((r) => (
                <div key={r.role} className="iq-lp__prow">
                  <span className={"iq-lp__dot iq-lp__dot--" + r.tone} aria-hidden="true" />
                  <div className="iq-lp__prow-main">
                    <div className="iq-lp__prow-role">{r.role}</div>
                    <div className="iq-lp__prow-company">{r.company}</div>
                  </div>
                  <div className="iq-lp__prow-status">{r.status}</div>
                </div>
              ))}
              <div className="iq-lp__preview-foot">Saved from a poster · 2 min ago</div>
            </div>
            <div className="iq-lp__note">
              <span className="iq-lp__note-num">2</span>
              <span className="iq-lp__note-label">interviews booked this week</span>
            </div>
          </div>
        </section>

        <section className="iq-lp__sec" id="features">
          <div className="iq-lp__sechead">
            <h2 className="iq-lp__h2">What Sloe keeps track of</h2>
            <p className="iq-lp__lead">
              Four things that usually live in five different places: a notes app, a chat with yourself, a calendar and
              a folder of half-written letters.
            </p>
          </div>
          <div className="iq-lp__groups">
            {GROUPS.map((g, i) => (
              <div key={g.t} className="iq-lp__group">
                <div className="iq-lp__group-top">
                  <Icon name={g.icon} className="ic ic-18" />
                  <span className="iq-lp__mono iq-lp__group-num">0{i + 1}</span>
                </div>
                <h3>{g.t}</h3>
                <p>{g.d}</p>
                <div className="iq-lp__group-meta">{g.meta}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="iq-lp__sec" id="how">
          <div className="iq-lp__sechead">
            <h2 className="iq-lp__h2">How it works</h2>
            <p className="iq-lp__lead">Four steps, and the first one takes about a minute.</p>
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
            <p>Bring your screenshots, links and notes. Sloe will sort them into something you can act on.</p>
            <Link className="iq-btn iq-btn--primary" href="/login?mode=signup">
              Create a free account
            </Link>
          </div>
          <div className="iq-lp__note iq-lp__note--band">
            <span className="iq-lp__note-num">10</span>
            <span className="iq-lp__note-label">AI actions a month, free</span>
          </div>
        </section>

        <section className="iq-lp__sec" id="contact">
          <div className="iq-lp__sechead">
            <h2 className="iq-lp__h2">Get in touch</h2>
            <p className="iq-lp__lead">Have feedback or a suggestion? Send it straight to us and we will read it.</p>
          </div>
          <div className="iq-contact">
            <div className="iq-contact__info">
              <div className="iq-contact__item">
                <div className="iq-contact__ic">
                  <Icon name="ic-doc" className="ic ic-18" />
                </div>
                <div>
                  <div className="iq-contact__label">Email</div>
                  <div className="iq-contact__val">alyssachalondra@gmail.com</div>
                </div>
              </div>
              <div className="iq-contact__item">
                <div className="iq-contact__ic">
                  <Icon name="ic-pin" className="ic ic-18" />
                </div>
                <div>
                  <div className="iq-contact__label">Location</div>
                  <div className="iq-contact__val">Surakarta, Central Java, Indonesia</div>
                </div>
              </div>
              <a
                className="iq-contact__item"
                href="https://linkedin.com/in/alyssachalondra"
                target="_blank"
                rel="noreferrer"
              >
                <div className="iq-contact__ic">
                  <Icon name="ic-link" className="ic ic-18" />
                </div>
                <div>
                  <div className="iq-contact__label">LinkedIn</div>
                  <div className="iq-contact__val">linkedin.com/in/alyssachalondra</div>
                </div>
              </a>
            </div>
            <ContactForm />
          </div>
        </section>

        <div className="iq-lp__foot">
          Sloe · Built for students · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
        </div>
      </div>
    </main>
  )
}
