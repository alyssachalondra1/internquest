"use client"

import { Mascot } from "@/components/Mascot"
import { MOOD_FILE } from "@/lib/mascot-assets"
import type { Mood } from "@/lib/mascot"

/* ============================================================
   MASCOT AVATAR (round)
   Renders the real expression art from /momoface*.png, cropped to the
   circle by the shared <Mascot> renderer. The old inline SVG sloth is
   gone: one art source, one renderer.
   ============================================================ */

export function MomoFace({ mood = "happy", size = 96 }: { mood?: Mood; size?: number }) {
  return <Mascot src={MOOD_FILE[mood]} size={size} round alt="Momo" priority />
}
