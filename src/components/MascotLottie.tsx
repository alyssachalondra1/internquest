"use client"

import { useEffect, useRef, useState } from "react"
import { csx } from "@/lib/csx"

/* ============================================================
   ANIMATED MASCOT ("signature pose").

   Behaviour (per revisi #2): show the PNG instantly, then play
   the animation ONCE and freeze on the last frame. Never loops,
   so it stays gentle and never eats battery/CPU on mobile.

   How it stays safe:
   - lottie-web is loaded from a CDN at runtime, so there is NO
     npm dependency and the Vercel build can never break over a
     missing package.
   - The PNG is always shown first; the animation only fades in
     after its data is ready.
   - If the JSON is missing or fails, or the user prefers reduced
     motion, it simply stays on the PNG.

   To enable the motion: export your animation with assets EMBEDDED
   and save it as /public/signature-pose.json. That's it.
   ============================================================ */

const LOTTIE_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"

let lottiePromise: Promise<unknown> | null = null
function loadLottie(): Promise<unknown> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  const w = window as unknown as { lottie?: unknown }
  if (w.lottie) return Promise.resolve(w.lottie)
  if (!lottiePromise) {
    lottiePromise = new Promise((resolve, reject) => {
      const s = document.createElement("script")
      s.src = LOTTIE_CDN
      s.async = true
      s.onload = () => resolve((window as unknown as { lottie?: unknown }).lottie)
      s.onerror = reject
      document.head.appendChild(s)
    })
  }
  return lottiePromise
}

export function MascotLottie({
  src = "/signature-pose.json",
  fallback = "/mascot-hero.png",
  size = 200,
  className = "",
}: {
  src?: string
  fallback?: string
  size?: number
  className?: string
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return

    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let anim: any = null

    // Wait until the page has settled so we never block first paint.
    const t = setTimeout(() => {
      loadLottie()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((lottie: any) => {
          if (cancelled || !boxRef.current || !lottie) return
          anim = lottie.loadAnimation({
            container: boxRef.current,
            renderer: "svg",
            loop: false,
            autoplay: true,
            path: src,
          })
          anim.addEventListener("data_ready", () => {
            if (!cancelled) setAnimated(true)
          })
          anim.addEventListener("data_failed", () => {
            if (!cancelled) setAnimated(false)
          })
        })
        .catch(() => {})
    }, 1200)

    return () => {
      cancelled = true
      clearTimeout(t)
      if (anim) anim.destroy()
    }
  }, [src])

  return (
    <div
      className={"iq-heromascot " + className}
      style={csx("width:" + size + "px;height:" + size + "px;max-width:100%;position:relative")}
    >
      {/* PNG poster: shown instantly, fades out once the animation is ready. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fallback}
        alt="Momo the sloth"
        style={csx(
          "width:100%;height:100%;object-fit:contain;position:absolute;inset:0;transition:opacity .35s ease;opacity:" +
            (animated ? "0" : "1"),
        )}
      />
      <div ref={boxRef} style={csx("width:100%;height:100%")} />
    </div>
  )
}
