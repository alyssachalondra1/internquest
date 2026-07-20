"use client"

import { useEffect, useRef, useState, type ComponentType } from "react"
import { csx } from "@/lib/csx"

/* ============================================================
   ANIMATED MASCOT (Lottie) with a static PNG fallback.

   How it stays fast and never lags:
   - The static PNG paints instantly (no layout shift, works with
     SSR, and is all a search engine or a slow phone ever needs).
   - The Lottie player library AND the animation JSON are only
     downloaded when the mascot actually scrolls into view, and
     only if the user has not turned on "reduce motion".
   - If the animation file is missing, fails to load, or does not
     have its images embedded, we simply keep showing the PNG.
     So it can never look broken.

   To use your own animation: export it from LottieFiles / After
   Effects with "Embed assets" (or "Include images") turned ON, so
   the images are baked into the JSON, then save it as
   /public/signature-pose.json.
   ============================================================ */

function hasExternalImages(json: any): boolean {
  const assets = json?.assets
  if (!Array.isArray(assets)) return false
  // An image asset that is not embedded has a filename (p) with e === 0.
  return assets.some((a: any) => a && typeof a.p === "string" && a.e === 0)
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
  const holderRef = useRef<HTMLDivElement>(null)
  const [Lottie, setLottie] = useState<ComponentType<any> | null>(null)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    if (reduce) return // respect reduced motion: keep the static image
    const el = holderRef.current
    if (!el) return

    let cancelled = false
    const start = async () => {
      try {
        const [mod, res] = await Promise.all([import("lottie-react"), fetch(src)])
        if (cancelled || !res.ok) return
        const json = await res.json()
        if (cancelled) return
        // If the export forgot to embed its images, do not animate a
        // broken file -- just keep the PNG.
        if (hasExternalImages(json)) return
        setLottie(() => mod.default)
        setData(json)
      } catch {
        // network / parse error -> stay on the static image
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          start()
        }
      },
      { rootMargin: "200px" },
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [src])

  return (
    <div
      ref={holderRef}
      className={"iq-heromascot " + className}
      style={csx("width:" + size + "px;height:" + size + "px;max-width:100%")}
    >
      {Lottie && data ? (
        <Lottie animationData={data} loop autoplay style={csx("width:100%;height:100%")} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fallback} alt="Momo mascot" style={csx("width:100%;height:100%;object-fit:contain")} />
      )}
    </div>
  )
}
