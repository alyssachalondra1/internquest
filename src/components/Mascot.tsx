"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { MASCOT_FALLBACK, MOOD_FILE, mascotAsset, mascotGeometry, type Align, type Fit } from "@/lib/mascot-assets"
import type { Mood } from "@/lib/mascot"

/* The single mascot renderer. Every spot in the app (hero, pops, avatars,
   login slides) goes through this so size, aspect and crop are decided in one
   place.
   - The slot is sized from the drawing's *visible content*, not the file's
     transparent canvas, so a padded PNG no longer renders tiny.
   - preloadMascots() warms files ahead of a change.
   - A swap crossfades only after the new file has loaded, so no empty frame
     ever shows between two mascots. */

const warmed = new Set<string>()
const waits = new Map<string, Promise<void>>()

/** Warm the browser cache for these files (call before a slide/step change). */
export function preloadMascots(files: string[]) {
  if (typeof window === "undefined") return
  for (const file of files) {
    if (warmed.has(file)) continue
    warmed.add(file)
    void waitForMascot(file)
  }
}

/** Resolves once the file is decoded, so a swap never fades in an empty frame. */
function waitForMascot(file: string): Promise<void> {
  const hit = waits.get(file)
  if (hit) return hit
  const p = new Promise<void>((resolve) => {
    if (typeof window === "undefined") return resolve()
    const img = new Image()
    const done = () => resolve()
    img.onload = done
    img.onerror = done
    img.src = file
    if (img.complete) done()
  })
  waits.set(file, p)
  return p
}

const POSITION_ALIGN: Record<string, Align> = {
  "50% 50%": "center",
  center: "center",
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
}

export function Mascot({
  src,
  mood,
  size = 120,
  className = "",
  round = false,
  fit,
  position = "50% 50%",
  w,
  h,
  priority = false,
  alt = "Momo the sloth",
}: {
  src?: string
  mood?: Mood
  size?: number
  className?: string
  round?: boolean
  fit?: Fit
  position?: string
  w?: number
  h?: number
  priority?: boolean
  alt?: string
}) {
  const target = src || (mood ? MOOD_FILE[mood] : MASCOT_FALLBACK)
  const asset = mascotAsset(target)
  const contentAspect = asset.box[2] / asset.box[3]

  // Slot: square for avatars, otherwise shaped like the drawing so it fills it.
  const boxW = w ?? size
  const boxH = h ?? (round ? size : Math.round(size / contentAspect))
  const mode: Fit = fit ?? (round ? "cover" : "contain")
  const align = POSITION_ALIGN[position] ?? "center"

  const [layers, setLayers] = useState<{ cur: string; prev: string | null }>({ cur: target, prev: null })

  // Swap only after the new file is decoded, then crossfade. Doing it here
  // (never during render) keeps React out of a render/ref/state loop.
  useEffect(() => {
    if (target === layers.cur) return
    let cancelled = false
    void waitForMascot(target).then(() => {
      if (cancelled) return
      setLayers((prev) => ({ cur: target, prev: prev.cur }))
    })
    return () => {
      cancelled = true
    }
  }, [target, layers.cur])

  useEffect(() => {
    preloadMascots([target])
  }, [target])

  // Once the new file is painted, drop the retired layer.
  useEffect(() => {
    if (!layers.prev) return
    const t = setTimeout(() => setLayers((l) => ({ cur: l.cur, prev: null })), 420)
    return () => clearTimeout(t)
  }, [layers])

  const layer = (file: string, state: "cur" | "prev") => {
    const g = mascotGeometry(file, boxW, boxH, mode, align)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={file + state}
        src={file}
        alt={alt}
        className={"iq-mascotlayer " + (state === "cur" ? "is-cur" : "is-prev")}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onError={(e) => {
          const el = e.currentTarget
          if (el.getAttribute("src") !== MASCOT_FALLBACK) el.src = MASCOT_FALLBACK
        }}
        style={
          {
            left: g.left,
            top: g.top,
            width: g.width,
            height: g.height,
            opacity: state === "cur" ? 1 : 0,
          } as CSSProperties
        }
      />
    )
  }

  return (
    <div
      className={"iq-mascotbox" + (round ? " iq-mascotbox--round" : "") + (className ? " " + className : "")}
      style={{ width: boxW, height: boxH }}
    >
      {layers.prev ? layer(layers.prev, "prev") : null}
      {layer(layers.cur, "cur")}
    </div>
  )
}
