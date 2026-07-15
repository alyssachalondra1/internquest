import { csx } from "@/lib/csx"

/* ============================================================
   HERO / ILLUSTRATION MASCOT
   Renders one of YOUR custom PNG illustrations. Each spot can use
   a DIFFERENT image via the `src` prop. Drop the files in /public.

   Files used across the app (add the ones you want):
     /mascot-hero.png     landing hero (left) + dashboard hero
     /mascot-quest.png    landing "Today's Quest" card
     /mascot-ai.png       "Generate with AI" header
     /mascot-insight.png  dashboard "AI Insight" callout
     /mascot-loading.png  "Reading the details" loading screen
     /mascot-success.png  "Internship added" success screen
     /mascot-streak.png   streak popup + recruitment-stage win popup

   Recommended: transparent PNG, square, ~512x512 px (min 300).
   ============================================================ */
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
    />
  )
}
