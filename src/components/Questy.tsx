"use client"

import { csx } from "@/lib/csx"

/* ============================================================
   MASCOT (Questy) — THE SWAP POINT FOR YOUR FINAL ILLUSTRATION
   ------------------------------------------------------------
   Right now this renders the placeholder sloth from the icon sprite
   (with a small "MASKOT" label). When your real art is ready:
     1. Export it as PNG (transparent) or SVG.
     2. Drop the file into the /public folder, e.g. /public/questy.png
     3. Set USE_CUSTOM_ART = true below (and update CUSTOM_ART_SRC).
   Everywhere the mascot appears (login, dashboard, level card, modals,
   AI helper, etc.) uses THIS component, so you only change it once here.
   ============================================================ */
const USE_CUSTOM_ART = false
const CUSTOM_ART_SRC = "/questy.png"

export function Questy({
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
        <img className="iq-questy" src={CUSTOM_ART_SRC} alt="Questy mascot" />
      ) : (
        <svg className="iq-questy" aria-hidden="true">
          <use href="#questy" />
        </svg>
      )}
    </div>
  )
}
