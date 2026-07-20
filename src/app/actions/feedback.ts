"use server"

import { createClient } from "@/lib/supabase/server"

const FEEDBACK_TO = process.env.FEEDBACK_TO_EMAIL || "alyssachalondra@gmail.com"
const FEEDBACK_FROM = process.env.FEEDBACK_FROM_EMAIL || "Sloe <noreply@sloe.my.id>"

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendFeedback(input: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const name = (input.name || "").trim()
  const email = (input.email || "").trim()
  const subject = (input.subject || "").trim()
  const message = (input.message || "").trim()

  if (!name || !email || !message) {
    return { ok: false, error: "Please fill in your name, email, and message." }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." }
  }

  // Keep a copy in Supabase so nothing is lost even if email delivery fails.
  let stored = false
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("feedback").insert({
      name,
      email,
      subject: subject || "(no subject)",
      message,
    })
    stored = !error
  } catch {
    stored = false
  }

  // Deliver to the owner's inbox via Resend (if configured).
  const key = process.env.RESEND_API_KEY
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FEEDBACK_FROM,
          to: [FEEDBACK_TO],
          reply_to: email,
          subject: `[Sloe feedback] ${subject || "New message"} — from ${name}`,
          html: `<p><b>Name:</b> ${escapeHtml(name)}</p>
<p><b>Email:</b> ${escapeHtml(email)}</p>
<p><b>Subject:</b> ${escapeHtml(subject || "(no subject)")}</p>
<hr/>
<p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
        }),
      })
      if (!res.ok) {
        return {
          ok: false,
          error: "Could not send your message right now. Please try again later.",
        }
      }
    } catch {
      return {
        ok: false,
        error: "Could not send your message right now. Please try again later.",
      }
    }
    return { ok: true }
  }

  // No email provider configured: only succeed if we at least stored it.
  if (stored) return { ok: true }
  return {
    ok: false,
    error: "Feedback isn't fully set up yet. Please email us directly for now.",
  }
}
