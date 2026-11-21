"use client"

import { useState } from "react"
import { createCheckout } from "@/app/actions/payments"

/* Starts a paid checkout. The server action returns a Midtrans redirect URL;
   we never mark anything as paid on the client. */
export function UpgradeButton({
  plan,
  label,
  featured,
  className,
}: {
  plan: "plus" | "pro"
  label: string
  featured?: boolean
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  async function go() {
    setBusy(true)
    setMsg("")
    try {
      const res = await createCheckout(plan)
      if (res.ok) {
        window.location.href = res.redirectUrl
        return
      }
      if (res.error === "not_logged_in") {
        window.location.href = "/login?mode=signup"
        return
      }
      setMsg(
        res.error === "not_configured"
          ? "Checkout is not switched on yet. Your free plan keeps working."
          : "Could not start checkout. Please try again in a moment.",
      )
    } catch {
      setMsg("Could not start checkout. Please try again in a moment.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="iq-upgrade">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={"iq-btn " + (featured ? "iq-btn--primary" : "iq-btn--ghost") + (className ? " " + className : "")}
      >
        {busy ? "Starting…" : label}
      </button>
      {msg && <p className="iq-upgrade__msg">{msg}</p>}
    </div>
  )
}
