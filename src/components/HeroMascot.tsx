import { csx } from "@/lib/csx"

/* ============================================================
   HERO MASCOT — your own illustration, used ONLY on:
     - the landing page hero (top-left + Today's Quest card)
     - the dashboard hero ("Hi, ...")
   Every OTHER place (login, level card, modals, AI helper, etc.)
   keeps its own image/mascot and is NOT affected by this file.

   HOW TO SET YOUR IMAGE:
     1. Export your mascot as a PNG with a TRANSPARENT background.
     2. Save it as:  public/mascot-hero.png
     3. Recommended: square, about 512x512 px (min 300x300) so it
        stays crisp when shown large.
   To use a different file name, just change SRC below.
   ============================================================ */
const SRC = "/mascot-hero.png"

export function HeroMascot({
  size = 150,
  className = "",
}: {
  size?: number
  className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC}
      alt="Momo mascot"
      className={"iq-heromascot " + className}
      style={csx("width:" + size + "px;height:auto")}
    />
  )
}
