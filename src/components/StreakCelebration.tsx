"use client"

import { useEffect, useState } from "react"
import { HeroMascot } from "@/components/HeroMascot"

/* Shows a short fire-mascot streak popup the FIRST time the profile is
   opened each day, then disappears on its own. Uses /mascot-streak.png. */
export function StreakCelebration({ streak }: { streak: number }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!streak || streak < 1) return
    const today = new Date().toLocaleDateString("en-CA") // YYYY-MM-DD in local time
    const key = "sloe:streak-pop:" + today
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, "1")
    } catch {
      return
    }
    setShow(true)
    const t = setTimeout(() => setShow(false), 3000)
    return () => clearTimeout(t)
  }, [streak])

  if (!show) return null

  return (
    <div className="iq-streakpop-scrim" onClick={() => setShow(false)}>
      <div className="iq-streakpop" onClick={(e) => e.stopPropagation()}>
        <HeroMascot src="/mascot-streak.png" size={140} />
        <div className="iq-streakpop__num">{streak}</div>
        <b>{streak === 1 ? "Day streak started!" : "Day streak!"}</b>
        <p>You showed up again today. Keep the fire going!</p>
      </div>
    </div>
  )
}
