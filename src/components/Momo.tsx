"use client"

import { csx } from "@/lib/csx"

/* ============================================================
   MASCOT (Momo) — THE SWAP POINT FOR YOUR FINAL ILLUSTRATION
   ------------------------------------------------------------
   Right now this renders the placeholder sloth from the icon sprite
   (with a small "MASKOT" label). When your real art is ready:
     1. Export it as PNG (transparent) or SVG.
     2. Drop the file into the /public folder, e.g. /public/momo.png
     3. Set USE_CUSTOM_ART = true below (and update CUSTOM_ART_SRC).
   Everywhere the mascot appears (login, dashboard, level card, modals,
   AI helper, etc.) uses THIS component, so you only change it once here.
   ============================================================ */
const USE_CUSTOM_ART = false
const CUSTOM_ART_SRC = "/momo.png"

export function Momo({
  size = 96,
  className = "",
  clean = true,
}: {
  size?: number
  className?: string
  clean?: boolean
}) {
  const style = csx("width:" + size + "px;height:" + size + "px")
  return (
    <div className={"iq-mascot " + (clean ? "iq-mascot--clean " : "") + className} style={style}>
      {USE_CUSTOM_ART ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="iq-momo" src={CUSTOM_ART_SRC} alt="Momo mascot" />
      ) : (
        <svg className="iq-momo" aria-hidden="true">
          <use href="#momo" />
        </svg>
      )}
    </div>
  )
}
