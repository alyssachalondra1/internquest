"use client"

import { Mascot } from "@/components/Mascot"
import { MOOD_FILE } from "@/lib/mascot-assets"
import type { Mood } from "@/lib/mascot"

// Inline Momo: the expression art (momoface*.png), sized by its drawing so it
// never renders smaller than the slot it sits in.
export function Momo({
  size = 96,
  className = "",
  mood = "happy",
  round = false,
}: {
  size?: number
  className?: string
  mood?: Mood
  round?: boolean
}) {
  return (
    <Mascot
      src={MOOD_FILE[mood]}
      size={size}
      round={round}
      className={"iq-momo " + className}
      alt="Momo"
      priority
    />
  )
}
