"use client"

import { Mascot } from "@/components/Mascot"

/* Illustration slot for one of your PNGs.
   Kept as a thin wrapper so existing call sites (<HeroMascot src="/mascot-quest.png" size={80} />)
   keep working; all sizing, crop, preload and crossfade behaviour lives in <Mascot>. */

export function HeroMascot({
  src = "/mascot-hero.png",
  size = 150,
  w,
  h,
  className = "",
  priority = false,
}: {
  src?: string
  size?: number
  w?: number
  h?: number
  className?: string
  priority?: boolean
}) {
  return (
    <Mascot src={src} size={size} w={w} h={h} className={"iq-heromascot " + className} priority={priority} />
  )
}

