"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { HeroMascot } from "@/components/HeroMascot"
import { markAchievementsSeen } from "@/app/actions/gamification"
import { csx } from "@/lib/csx"

// Celebrates achievements the user has just unlocked but not seen yet.
// The list comes from the server (unseen unlocked badges). On dismiss we mark
// them as seen, which also clears the sidebar count badge.
export function AchievementPopup({ achievements }: { achievements: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't pop up on the achievements page itself — they're already looking.
    if (pathname === "/achievements") return
    if (achievements && achievements.length > 0) setShow(true)
  }, [achievements.join("|"), pathname])

  if (!show || !achievements || achievements.length === 0) return null

  const title = achievements[0]
  const more = achievements.length - 1

  async function close() {
    setShow(false)
    try {
      await markAchievementsSeen()
      router.refresh()
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="iq-streakpop-scrim" onClick={close}>
      <div className="iq-streakpop" onClick={(e) => e.stopPropagation()}>
        <HeroMascot src="/mascot-success.png" size={150} className="iq-streakpop__mascot" />
        <span
          className="iq-pop__badge"
          style={csx(
            "display:inline-block;margin-bottom:8px;background:var(--yellow-15);color:var(--yellow-text);font-weight:800;font-size:12px;padding:5px 12px;border-radius:999px",
          )}
        >
          🏅 Achievement unlocked
        </span>
        <b>{title}</b>
        <p>
          {more > 0
            ? "And " + more + " more achievement" + (more > 1 ? "s" : "") + " unlocked. You're on a roll!"
            : "Nice work. Keep hunting and unlock even more!"}
        </p>
        <button className="iq-btn iq-btn--primary iq-btn--block mt-6" onClick={close}>
          Awesome
        </button>
      </div>
    </div>
  )
}
