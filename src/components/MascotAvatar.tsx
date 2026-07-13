"use client"

import { csx } from "@/lib/csx"
import type { Mood } from "@/lib/mascot"

/* ============================================================
   MASCOT AVATAR PRESETS (sloth expressions)
   ------------------------------------------------------------
   Built-in default avatars a user can pick if they don't want to
   upload their own photo. Each preset renders Momo with a
   different expression.

   >>> SWAP POINT FOR YOUR FINAL ART <<<
   When your illustrated sloth expressions are ready:
     1. Drop the files in /public, e.g. /public/mascot/happy.png
     2. Set USE_CUSTOM_ART = true and map each mood in CUSTOM_ART.
   The picker, profile, sidebar and topbar all use THIS component,
   so you only change it here once.
   ============================================================ */

const USE_CUSTOM_ART = false
const CUSTOM_ART: Record<Mood, string> = {
  happy: "/mascot/happy.png",
  wink: "/mascot/wink.png",
  cool: "/mascot/cool.png",
  sleepy: "/mascot/sleepy.png",
  love: "/mascot/love.png",
}

function Eyes({ mood }: { mood: Mood }) {
  switch (mood) {
    case "wink":
      return (
        <>
          <circle cx="39" cy="53" r="5" fill="#3A3550" />
          <circle cx="40.6" cy="51.4" r="1.6" fill="#fff" />
          <path d="M56 53 Q61 49 66 53" stroke="#3A3550" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )
    case "cool":
      return (
        <>
          <rect x="31" y="48" width="17" height="9" rx="4.5" fill="#2A2740" />
          <rect x="52" y="48" width="17" height="9" rx="4.5" fill="#2A2740" />
          <rect x="47.5" y="51" width="5" height="2.4" fill="#2A2740" />
        </>
      )
    case "sleepy":
      return (
        <>
          <path d="M34 53 Q39 57 44 53" stroke="#3A3550" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M56 53 Q61 57 66 53" stroke="#3A3550" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )
    case "love":
      return (
        <>
          <path d="M39 50 c-2 -2.6 -6 -0.6 -4 2.4 l4 4.2 4 -4.2 c2 -3 -2 -5 -4 -2.4Z" fill="#FF5B86" />
          <path d="M61 50 c-2 -2.6 -6 -0.6 -4 2.4 l4 4.2 4 -4.2 c2 -3 -2 -5 -4 -2.4Z" fill="#FF5B86" />
        </>
      )
    default:
      return (
        <>
          <circle cx="39" cy="53" r="5" fill="#3A3550" />
          <circle cx="61" cy="53" r="5" fill="#3A3550" />
          <circle cx="40.6" cy="51.4" r="1.6" fill="#fff" />
          <circle cx="62.6" cy="51.4" r="1.6" fill="#fff" />
        </>
      )
  }
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === "love")
    return <path d="M43 64 Q50 72 57 64" stroke="#6E5230" strokeWidth="2" fill="none" strokeLinecap="round" />
  if (mood === "sleepy")
    return <ellipse cx="50" cy="66" rx="3" ry="2.2" fill="#6E5230" />
  return <path d="M45 66 Q50 70 55 66" stroke="#6E5230" strokeWidth="1.8" fill="none" strokeLinecap="round" />
}

export function MomoFace({ mood = "happy", size = 96 }: { mood?: Mood; size?: number }) {
  if (USE_CUSTOM_ART) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={CUSTOM_ART[mood]}
        alt="Momo"
        style={csx("width:" + size + "px;height:" + size + "px;border-radius:50%;object-fit:cover")}
      />
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="30" cy="35" rx="8" ry="8" fill="#8FB9E8" />
      <ellipse cx="70" cy="35" rx="8" ry="8" fill="#8FB9E8" />
      <ellipse cx="50" cy="58" rx="35" ry="33" fill="#8FB9E8" />
      <ellipse cx="50" cy="55" rx="25" ry="25" fill="#FBEFD9" />
      <ellipse cx="38" cy="51" rx="9" ry="12" fill="#C8A46A" opacity="0.45" />
      <ellipse cx="62" cy="51" rx="9" ry="12" fill="#C8A46A" opacity="0.45" />
      <Eyes mood={mood} />
      <ellipse cx="50" cy="62" rx="3.2" ry="2.2" fill="#6E5230" />
      <Mouth mood={mood} />
      <circle cx="32" cy="62" r="3.4" fill="#FF9DBE" opacity="0.55" />
      <circle cx="68" cy="62" r="3.4" fill="#FF9DBE" opacity="0.55" />
      <ellipse cx="20" cy="68" rx="6" ry="11" fill="#7FA9D8" transform="rotate(22 20 68)" />
      <ellipse cx="80" cy="68" rx="6" ry="11" fill="#7FA9D8" transform="rotate(-22 80 68)" />
    </svg>
  )
}
