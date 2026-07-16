"use client"

import { useEffect, useState } from "react"
import { HeroMascot } from "@/components/HeroMascot"
import { playLevelUp } from "@/lib/sound"

/**
 * Level-up celebration popup.
 *
 * Shows a one-time popup whenever the user's level NUMBER goes up. We remember
 * the last level we already celebrated in localStorage, so it only fires on an
 * actual increase (not on every page load) and never on the very first login.
 *
 * Uses your custom illustration /mascot-levelup.png (transparent PNG, square,
 * ~512x512). Mounted globally in AppShell so it triggers no matter which page
 * caused the level up (e.g. passing a recruitment stage that grants XP).
 */
export function LevelUpCelebration({ level }: { level: number }) {
  const [popupLevel, setPopupLevel] = useState<number | null>(null)

  useEffect(() => {
    if (!level || level < 1) return
    const key = "sloe:level-seen"
    const raw = localStorage.getItem(key)
    const seen = raw ? parseInt(raw, 10) : null
    // First time we track this device: record silently, do not celebrate.
    if (seen === null) {
      localStorage.setItem(key, String(level))
      return
    }
    if (level > seen) {
      setPopupLevel(level)
      playLevelUp()
    }
    if (level !== seen) localStorage.setItem(key, String(level))
  }, [level])

  if (!popupLevel) return null

  return (
    <div className="iq-streakpop-scrim" onClick={() => setPopupLevel(null)}>
      <div className="iq-streakpop" onClick={(e) => e.stopPropagation()}>
        <HeroMascot src="/mascot-levelup.png" size={140} />
        <div className="iq-streakpop__num iq-levelpop__num">{popupLevel}</div>
        <b>Level up!</b>
        <p>You reached Level {popupLevel}. Amazing progress on your internship quest, keep it going!</p>
        <button className="iq-btn iq-btn--primary iq-btn--block mt-6" onClick={() => setPopupLevel(null)}>
          Continue
        </button>
      </div>
    </div>
  )
}
