"use client"

import { useState } from "react"
import { csx } from "@/lib/csx"

// Small stat icon rendered from a custom uploaded PNG in /public.
// Files needed (transparent PNG, ~64-128px square):
//   /icon-streak.png (fire) . /icon-xp.png (star) . /icon-gems.png (diamond)
//
// FALLBACK: if a file is missing, a matching emoji is shown instead of a
// broken image, so the streak / XP / gems number is always readable.
const EMOJI: Record<"streak" | "xp" | "gems", string> = {
  streak: "\uD83D\uDD25", // fire
  xp: "\u2B50", // star
  gems: "\uD83D\uDC8E", // gem
}

export function StatIcon({ name, size = 18 }: { name: "streak" | "xp" | "gems"; size?: number }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className="iq-staticon"
        style={csx("font-size:" + Math.round(size * 0.9) + "px;line-height:1")}
      >
        {EMOJI[name]}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={"/icon-" + name + ".png"}
      alt=""
      aria-hidden="true"
      className="iq-staticon"
      style={csx("width:" + size + "px;height:" + size + "px")}
      onError={() => setFailed(true)}
    />
  )
}
