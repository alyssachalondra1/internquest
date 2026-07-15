"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateInternshipStatus } from "@/app/actions/internships"
import { Momo } from "@/components/Momo"
import { HeroMascot } from "@/components/HeroMascot"
import { playApply, playLevelUp, playSad } from "@/lib/sound"
import { csx } from "@/lib/csx"

// Forward-only application flow. Each stage asks about the next gate.
// There is no way to move backwards, which is why every step is confirmed.
type Stage = {
  prompt: string
  yes: { to: string; label: string }
  no?: { to: string; label: string }
}

const FLOW: Record<string, Stage> = {
  todo: {
    prompt: "Only mark this once you have actually submitted your application.",
    yes: { to: "applied", label: "I have applied" },
  },
  applied: {
    prompt: "Did you pass the administrative screening?",
    yes: { to: "screening", label: "Yes, I passed screening" },
    no: { to: "rejected", label: "No, I was not selected" },
  },
  screening: {
    prompt: "Did you pass the online test?",
    yes: { to: "test", label: "Yes, I passed the test" },
    no: { to: "rejected", label: "No, I was not selected" },
  },
  test: {
    prompt: "Did you pass the interview?",
    yes: { to: "interview", label: "Yes, I passed the interview" },
    no: { to: "rejected", label: "No, I was not selected" },
  },
  interview: {
    prompt: "Did you receive an offer?",
    yes: { to: "offer", label: "Yes, I got an offer!" },
    no: { to: "rejected", label: "No, I was not selected" },
  },
}

type Pop = { title: string; body: string; badge: string; cls: string; mood: "happy" | "sad" }

const POP: Record<string, Pop> = {
  applied: { title: "Application sent!", body: "One step closer to your dream internship. Good luck!", badge: "+25 XP", cls: "iq-chip--yellow", mood: "happy" },
  screening: { title: "You passed screening!", body: "Great start. Get ready for the online test, you have got this.", badge: "+40 XP", cls: "iq-chip--blue", mood: "happy" },
  test: { title: "Online test cleared!", body: "Awesome work. The interview is next, keep the momentum going.", badge: "+50 XP", cls: "iq-chip--blue", mood: "happy" },
  interview: { title: "Interview passed!", body: "So close now. Fingers crossed for the offer!", badge: "+75 XP", cls: "iq-chip--blue", mood: "happy" },
  offer: { title: "Congrats, you got an offer!", body: "Amazing! All your effort paid off. Time to celebrate this win.", badge: "+150 XP", cls: "iq-chip--green", mood: "happy" },
  rejected: { title: "Do not give up", body: "This one did not work out, but every attempt makes you stronger. Many more opportunities are waiting for you.", badge: "Keep going", cls: "iq-chip--red", mood: "sad" },
}

export function StatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [confirmTo, setConfirmTo] = useState<string | null>(null)
  const [pop, setPop] = useState<string | null>(null)
  const stage = FLOW[status]

  function apply(to: string) {
    setConfirmTo(null)
    start(async () => {
      await updateInternshipStatus(id, to)
      router.refresh()
    })
    setPop(to)
    if (to === "rejected") playSad()
    else if (to === "applied") playApply()
    else playLevelUp()
  }

  const p = pop ? POP[pop] : null
  const isReject = confirmTo === "rejected"

  return (
    <div className="stack-2 mt-6">
      {stage ? (
        <>
          <p className="muted iq-justify" style={csx("font-size:13px")}>{stage.prompt}</p>
          <button className="iq-btn iq-btn--green iq-btn--block" disabled={pending} onClick={() => setConfirmTo(stage.yes.to)}>
            {stage.yes.label}
          </button>
          {stage.no && (
            <button className="iq-btn iq-btn--ghost iq-btn--block" disabled={pending} onClick={() => setConfirmTo(stage.no!.to)}>
              {stage.no.label}
            </button>
          )}
        </>
      ) : status === "offer" ? (
        <div className="iq-callout" style={csx("align-items:center")}>
          <Momo size={46} />
          <div><b>Offer secured</b><p className="mt-2" style={csx("font-size:13px")}>This journey is complete. Congratulations on landing the offer!</p></div>
        </div>
      ) : status === "rejected" ? (
        <div className="iq-callout" style={csx("align-items:center;background:var(--red-15);border-color:var(--red-40)")}>
          <Momo size={46} />
          <div><b>Marked as not selected</b><p className="mt-2" style={csx("font-size:13px")}>Keep going. The next opportunity could be the one.</p></div>
        </div>
      ) : null}

      {confirmTo && (
        <div className="iq-pop-scrim" onClick={() => setConfirmTo(null)}>
          <div className="iq-pop" onClick={(e) => e.stopPropagation()}>
            <button className="iq-pop__x" onClick={() => setConfirmTo(null)}>✕</button>
            <Momo size={72} />
            <h3>{isReject ? "Mark as not selected?" : "Are you sure?"}</h3>
            <p>{isReject ? "This internship will move to Rejected. You cannot change it back afterwards." : "You cannot undo this step later, so only confirm when it is official."}</p>
            <div className="row mt-6" style={csx("gap:10px")}>
              <button className="iq-btn iq-btn--ghost iq-btn--block" onClick={() => setConfirmTo(null)}>Cancel</button>
              <button className={"iq-btn iq-btn--block " + (isReject ? "iq-btn--ghost" : "iq-btn--primary")} disabled={pending} onClick={() => apply(confirmTo)}>Confirm</button>
            </div>
          </div>
        </div>
      )}

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
            {p.mood === "happy" ? (
              <HeroMascot src="/mascot-success.png" size={112} />
            ) : (
              <Momo size={96} />
            )}
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
