"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateInternshipStatus } from "@/app/actions/internships"
import { STATUSES } from "@/lib/helpers"
import { Questy } from "@/components/Questy"
import { playApply, playLevelUp, playSad } from "@/lib/sound"
import { csx } from "@/lib/csx"

const NEXT: Record<string, { to: string; label: string }> = {
  todo: { to: "applied", label: "Mark as applied" },
  applied: { to: "interview", label: "Move to interview" },
  interview: { to: "offer", label: "Got an offer!" },
}

type Pop = { title: string; body: string; badge: string; cls: string; mood: "happy" | "sad" }

const POP: Record<string, Pop> = {
  applied: { title: "Application sent!", body: "One step closer to your dream internship.", badge: "+25 XP", cls: "iq-chip--yellow", mood: "happy" },
  interview: { title: "You got an interview!", body: "Great work. Get ready, you have got this.", badge: "+50 XP", cls: "iq-chip--blue", mood: "happy" },
  offer: { title: "Congrats, you got an offer!", body: "Amazing! All your effort paid off.", badge: "+150 XP", cls: "iq-chip--green", mood: "happy" },
  rejected: { title: "Do not give up", body: "This is part of the process. Many more opportunities are waiting for you.", badge: "Keep going", cls: "iq-chip--rejected", mood: "sad" },
}

export function StatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [pop, setPop] = useState<string | null>(null)
  const next = NEXT[status]

  function set(to: string) {
    start(async () => {
      await updateInternshipStatus(id, to)
      router.refresh()
    })
    if (POP[to]) {
      setPop(to)
      if (to === "rejected") playSad()
      else if (to === "offer" || to === "interview") playLevelUp()
      else playApply()
    }
  }

  const p = pop ? POP[pop] : null

  return (
    <div className="stack-2 mt-6">
      {next && (
        <button className="iq-btn iq-btn--green iq-btn--block" disabled={pending} onClick={() => set(next.to)}>
          {next.label}
        </button>
      )}
      <select className="iq-select" value={status} onChange={(e) => set(e.target.value)} disabled={pending}>
        {STATUSES.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>

      {p && (
        <div className="iq-pop-scrim" onClick={() => setPop(null)}>
          <div className="iq-pop" onClick={(e) => e.stopPropagation()}>
            <button className="iq-pop__x" onClick={() => setPop(null)}>✕</button>
            {p.mood === "happy" && (
              <>
                <span className="iq-spark" style={csx("top:18px;left:26px")}>✨</span>
                <span className="iq-spark" style={csx("top:30px;right:34px")}>✨</span>
              </>
            )}
            <Questy size={96} />
            <h3>{p.title}</h3>
            <p>{p.body}</p>
            <div>
              <span className={"iq-pop__badge " + p.cls}>{p.badge}</span>
            </div>
            <button className="iq-btn iq-btn--primary iq-btn--block mt-6" onClick={() => setPop(null)}>Continue</button>
          </div>
        </div>
      )}
    </div>
  )
}
