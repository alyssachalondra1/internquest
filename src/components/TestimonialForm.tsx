"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { csx } from "@/lib/csx"
import { saveTestimonial } from "@/app/actions/testimonials"

export function TestimonialForm({
  loggedIn,
  defaultName,
  existing,
}: {
  loggedIn: boolean
  defaultName: string
  existing: { display_name: string; rating: number; body: string } | null
}) {
  const router = useRouter()
  const [name, setName] = useState(existing?.display_name || defaultName || "")
  const [rating, setRating] = useState(existing?.rating || 5)
  const [hover, setHover] = useState(0)
  const [body, setBody] = useState(existing?.body || "")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!loggedIn) {
    return (
      <div className="iq-tm__gate">
        <p>Sign in with your account to share your experience with Sloe.</p>
        <Link className="iq-btn iq-btn--primary" href="/login">
          Sign in to write a review
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="iq-tm__gate">
        <p>
          <b>Thanks for your review! 🦥</b>
        </p>
        <p className="muted">It&apos;s now visible to other students on this page.</p>
      </div>
    )
  }

  async function submit() {
    setMsg(null)
    setLoading(true)
    const res = await saveTestimonial({ displayName: name, rating, body })
    setLoading(false)
    if (!res.ok) {
      setMsg(res.error || "Something went wrong. Please try again.")
      return
    }
    setDone(true)
    router.refresh()
  }

  return (
    <div className="iq-tm__form">
      <h3 style={csx("margin-bottom:4px")}>{existing ? "Update your review" : "Write a review"}</h3>
      <p className="muted" style={csx("font-size:13px;margin-bottom:14px")}>
        You can use a custom pen name if you&apos;d rather stay anonymous.
      </p>
      <div className="iq-form-row">
        <label>Display name (pen name)</label>
        <input
          className="iq-input"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sloth Fan"
        />
      </div>
      <div className="iq-form-row">
        <label>Rating</label>
        <div className="iq-stars-pick">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={"iq-star " + ((hover || rating) >= n ? "on" : "")}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              aria-label={n + " stars"}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div className="iq-form-row">
        <label>Your review</label>
        <textarea
          className="iq-textarea"
          style={csx("height:110px;padding:12px 14px")}
          value={body}
          maxLength={600}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What do you love about Sloe?"
        />
      </div>
      {msg && (
        <p style={csx("color:var(--red-text);font-size:13px;margin-bottom:8px")}>{msg}</p>
      )}
      <button className="iq-btn iq-btn--primary" onClick={submit} disabled={loading}>
        {loading ? "Saving…" : existing ? "Update review" : "Submit review"}
      </button>
    </div>
  )
}
