"use client"

import { useEffect, useState } from "react"
import { PADDLE_CLIENT_TOKEN, PADDLE_IS_SANDBOX, PADDLE_PRICE_ID } from "@/lib/paddle"

declare global {
  interface Window {
    Paddle?: any
  }
}

/* Paddle.js overlay checkout, loaded from Paddle's own CDN so the project needs
   no new npm dependency. This only opens the payment window: access is granted
   by /api/paddle/webhook after Paddle confirms the money arrived. */
export function PaddleCheckoutButton({
  plan,
  label,
  userId,
  paddleCustomerId,
  featured,
}: {
  plan: "plus" | "pro" | "topup"
  label: string
  userId: string
  paddleCustomerId?: string | null
  featured?: boolean
}) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (window.Paddle) {
      setReady(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true
    script.onload = () => {
      // Production is Paddle's default environment; only switch when testing.
      if (PADDLE_IS_SANDBOX) window.Paddle.Environment.set("sandbox")
      window.Paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
        // Paddle Retain expects the Paddle customer id (ctm_...), never our own
        // user id or the email. Omitted until a purchase tells us the id.
        ...(paddleCustomerId ? { pwCustomer: { id: paddleCustomerId } } : {}),
        // Paddle's own overlay error is generic ("Something went wrong"). Keep the
        // real code in the console, and say something honest to the buyer.
        eventCallback: (event: any) => {
          const name = String(event?.name ?? "")
          if (name !== "checkout.error" && name !== "checkout.failed") return
          console.error("[paddle] checkout error", event?.data ?? event)
          setMsg(
            "Paddle could not start the checkout. Nothing was charged. Please try again, or email support@sloe.my.id and we will help.",
          )
        },
      })
      setReady(true)
    }
    document.head.appendChild(script)
  }, [])

  function open() {
    if (!ready || !window.Paddle) return
    setBusy(true)
    window.Paddle.Checkout.open({
      items: [{ priceId: PADDLE_PRICE_ID[plan], quantity: 1 }],
      // Only the buyer is identified here; the plan comes from the paid price id.
      customData: { user_id: userId },
      settings: { displayMode: "overlay", successUrl: window.location.origin + "/pricing?paid=1" },
    })
    setBusy(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={open}
        disabled={!ready || busy}
        className={"iq-btn " + (featured ? "iq-btn--primary" : "iq-btn--ghost")}
      >
        {busy ? "Opening…" : label}
      </button>
      {msg && (
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 8 }} role="status">
          {msg}
        </p>
      )}
    </div>
  )
}
