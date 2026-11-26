"use client"

import { useState } from "react"
import { createCheckout, createPolarCheckout } from "@/app/actions/payments"
import type { PlanId } from "@/lib/plans"

/* Starts a paid checkout. The server action returns a redirect URL; we never
   mark anything as paid on the client. `provider` picks the rail: Midtrans for
   rupiah, Polar for US dollars. */
export function UpgradeButton({
  plan,
  label,
  featured,
  className,
  provider = "midtrans",
}: {
  plan: PlanId
  label: string
  featured?: boolean
  className?: string
  provider?: "midtrans" | "polar"
}) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  async function go() {
    setBusy(true)
    setMsg("")
    try {
      const res = provider === "polar" ? await createPolarCheckout(plan) : await createCheckout(plan)
      if (res.ok) {
        window.location.href = res.redirectUrl
        return
      }
      if (res.error === "not_logged_in") {
        window.location.href = "/login?mode=signup"
        return
      }
      // Show what the server actually said. A generic message hides the reason
      // (wrong key, sandbox vs live, account not approved) and costs a round trip.
      setMsg(
        res.error === "not_configured"
          ? "Checkout is not switched on yet. Your free plan keeps working."
          : res.message
            ? `Checkout could not start: ${res.message.slice(0, 160)}`
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
