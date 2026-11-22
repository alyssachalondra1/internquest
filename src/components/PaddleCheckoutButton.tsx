"use client"

import { useEffect, useState } from "react"
import { PADDLE_CLIENT_TOKEN, PADDLE_ENV, PADDLE_PRICE_ID } from "@/lib/paddle"

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
  featured,
}: {
  plan: "plus" | "pro" | "topup"
  label: string
  userId: string
  featured?: boolean
}) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (window.Paddle) {
      setReady(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true
    script.onload = () => {
      window.Paddle.Environment.set(PADDLE_ENV)
      window.Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN })
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
    <button
      type="button"
      onClick={open}
      disabled={!ready || busy}
      className={"iq-btn " + (featured ? "iq-btn--primary" : "iq-btn--ghost")}
    >
      {busy ? "Opening…" : label}
    </button>
  )
}
