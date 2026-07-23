"use client"

import { csx } from "@/lib/csx"

// The mascot used on auth cards, achievements, and modals.
// It now renders a real PNG illustration so it no longer depends on the SVG
// sprite sheet (which is only mounted inside the app shell). That means it
// shows correctly on the login and reset-password pages too.
const USE_CUSTOM_ART = true
const CUSTOM_ART_SRC = "/welcomee.png"
const FALLBACK_SRC = "/mascot-hero.png"

export function Momo({
  size = 96,
  className = "",
  clean = true,
}: {
  size?: number
  className?: string
  clean?: boolean
}) {
  if (USE_CUSTOM_ART) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={"iq-momo-img " + className}
        src={CUSTOM_ART_SRC}
        alt="Momo the sloth"
        style={csx("width:" + size + "px;height:auto;max-width:100%;display:block")}
        onError={(e) => {
          const el = e.currentTarget
          if (el.getAttribute("src") !== FALLBACK_SRC) el.src = FALLBACK_SRC
        }}
      />
    )
  }

  // Legacy sprite-based rendering (kept as a fallback if custom art is disabled).
  const style = csx("width:" + size + "px;height:" + size + "px")
  return (
    <div className={"iq-mascot " + (clean ? "iq-mascot--clean " : "") + className} style={style}>
      <svg className="iq-momo" aria-hidden="true">
        <use href="#momo" />
      </svg>
    </div>
  )
}
