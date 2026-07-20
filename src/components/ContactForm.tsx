"use client"

import { useState } from "react"
import { csx } from "@/lib/csx"
import { sendFeedback } from "@/app/actions/feedback"

export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    setMsg(null)
    setLoading(true)
    const res = await sendFeedback({ name, email, subject, message })
    setLoading(false)
    if (!res.ok) {
      setMsg(res.error || "Something went wrong. Please try again.")
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="iq-contact__form">
        <div
          className="iq-callout"
          style={csx("background:var(--green-15);border-color:var(--green-40)")}
        >
          <div>
            <b>Thanks for reaching out! 💌</b>
            <p className="mt-2">Your message has been sent. We&apos;ll get back to you soon.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="iq-contact__form">
      <div style={csx("display:flex;gap:12px;flex-wrap:wrap")}>
        <div className="iq-form-row" style={csx("flex:1;min-width:160px")}>
          <input
            className="iq-input"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="iq-form-row" style={csx("flex:1;min-width:160px")}>
          <input
            className="iq-input"
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="iq-form-row">
        <input
          className="iq-input"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="iq-form-row">
        <textarea
          className="iq-textarea"
          style={csx("height:120px;padding:12px 14px")}
          placeholder="Your Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {msg && (
        <p style={csx("color:var(--red-text);font-size:13px;margin-bottom:8px")}>{msg}</p>
      )}
      <button
        className="iq-btn iq-btn--primary iq-btn--block"
        onClick={submit}
        disabled={loading}
      >
        {loading ? "Sending…" : "Send Message"}
      </button>
    </div>
  )
}
