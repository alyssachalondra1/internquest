"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { HeroMascot } from "@/components/HeroMascot"
import { saveTestimonial } from "@/app/actions/testimonials"
import { csx } from "@/lib/csx"

// Gentle "leave a review" popup.
// Frequency control (so it never annoys):
//  - only on the dashboard, and only after ~18s of use
//  - never again once submitted
//  - if dismissed, stays hidden for 45 days
const SHOWN_KEY = "sloe:review-prompt-last"
const DONE_KEY = "sloe:reviewed"
const COOLDOWN_MS = 45 * 24 * 60 * 60 * 1000 // 45 days

export function ReviewPrompt({ profileName }: { profileName: string | null }) {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState(profileName || "")
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (pathname !== "/dashboard") return
    try {
      if (localStorage.getItem(DONE_KEY)) return
      const last = localStorage.getItem(SHOWN_KEY)
      if (last && Date.now() - parseInt(last, 10) < COOLDOWN_MS) return
    } catch {
      return
    }
    const t = setTimeout(() => setShow(true), 18000)
    return () => clearTimeout(t)
  }, [pathname])

  function dismiss() {
    setShow(false)
    try {
      localStorage.setItem(SHOWN_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
  }

  async function submit() {
    setErr(null)
    if (rating < 1) {
      setErr("Please pick a star rating first.")
      return
    }
    setBusy(true)
    const res = await saveTestimonial({
      displayName: name.trim() || "Sloe user",
      rating,
      body: body.trim() || "Love using Sloe!",
    })
    setBusy(false)
    if (!res.ok) {
      setErr(res.error || "Could not save your review. Please try again.")
      return
    }
    try {
      localStorage.setItem(DONE_KEY, "1")
      localStorage.setItem(SHOWN_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    setDone(true)
  }

  if (!show) return null

  const shownRating = hover || rating

  return (
    <div className="iq-streakpop-scrim" onClick={dismiss}>
      <div
        className="iq-streakpop"
        style={csx("max-width:390px;text-align:left;position:relative")}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="iq-pop__x"
          aria-label="Close"
          onClick={dismiss}
          style={csx(
            "position:absolute;top:12px;right:14px;background:none;border:none;font-size:18px;color:var(--ink-3);cursor:pointer",
          )}
        >
          ✕
        </button>

        {done ? (
          <div style={csx("text-align:center")}>
            <HeroMascot src="/mascot-success.png" size={130} className="iq-streakpop__mascot" />
            <b>Thank you! 💜</b>
            <p>Your review means a lot and helps other students discover Sloe.</p>
            <button className="iq-btn iq-btn--primary iq-btn--block mt-6" onClick={() => setShow(false)}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={csx("text-align:center")}>
              <HeroMascot src="/mascot-hero.png" size={110} className="iq-streakpop__mascot" />
              <b>Enjoying Sloe?</b>
              <p style={csx("margin-bottom:10px")}>
                Mind leaving a quick review? It helps other students find Sloe. 🦥
              </p>
            </div>

            <div
              className="iq-stars"
              style={csx("display:flex;justify-content:center;gap:6px;margin:6px 0 14px")}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={n + " star"}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  style={csx(
                    "background:none;border:none;cursor:pointer;padding:2px;font-size:32px;line-height:1;color:" +
                      (n <= shownRating ? "#FFB800" : "var(--border-2)"),
                  )}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="iq-form-row">
              <label>Display name</label>
              <input
                className="iq-input"
                placeholder="How your name shows on the review"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="iq-form-row">
              <label>Your review (optional)</label>
              <textarea
                className="iq-input"
                rows={3}
                placeholder="What do you like about Sloe?"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {err && (
              <p style={csx("color:var(--red-text);font-size:13px;margin-bottom:8px")}>{err}</p>
            )}

            <div className="row" style={csx("gap:10px;margin-top:4px")}>
              <button className="iq-btn iq-btn--ghost iq-btn--block" onClick={dismiss}>
                Maybe later
              </button>
              <button
                className="iq-btn iq-btn--primary iq-btn--block"
                disabled={busy}
                onClick={submit}
              >
                {busy ? "Sending…" : "Submit review"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
