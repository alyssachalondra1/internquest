"use client"

import { csx } from "@/lib/csx"

/* ============================================================
   HERO / ILLUSTRATION MASCOT
   Renders one of YOUR custom PNG illustrations. Each spot can use
   a DIFFERENT image via the `src` prop. Drop the files in /public.

   Files used across the app (add the ones you want):
     /mascot-hero.png     landing hero (left) + dashboard hero
     /mascot-quest.png    landing "Today's Quest" card
     /mascot-ai.png       "Generate with AI" header + AI helper
     /mascot-insight.png  dashboard "AI Insight" callout
     /mascot-loading.png  "Reading the details" loading screen
     /mascot-success.png  "Internship added" + stage-win popup
     /mascot-confirm.png  status-change confirm popup
     /mascot-sad.png      rejected / "Do not give up" popup
     /mascot-streak.png   streak milestone popup
     /mascot-levelup.png  level-up popup

   >>> FALLBACK <<<
   If a specific file above is NOT in /public yet, the image
   automatically falls back to FALLBACK_SRC (your main mascot),
   so every spot still shows YOUR art -- never a broken image and
   never a built-in cartoon. As long as /mascot-hero.png exists,
   nothing will ever look empty. Change FALLBACK_SRC if your main
   file has a different name.

   Recommended: transparent PNG, square, ~512x512 px (min 300).
   ============================================================ */

const FALLBACK_SRC = "/mascot-hero.png"

export function HeroMascot({
  src = "/mascot-hero.png",
  size = 150,
  className = "",
}: {
  src?: string
  size?: number
  className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Momo mascot"
      className={"iq-heromascot " + className}
      style={csx("width:" + size + "px;height:auto")}
      onError={(e) => {
        const el = e.currentTarget
        if (el.getAttribute("src") !== FALLBACK_SRC) el.src = FALLBACK_SRC
      }}
    />
  )
}
