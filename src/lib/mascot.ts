// Pure mascot helpers (NO "use client").
// These are plain functions/constants that must be callable from BOTH server
// components (e.g. profile/page.tsx, AppShell) and client components. Keeping
// them here — outside the "use client" MascotAvatar module — prevents the
// "Attempted to call moodOf() from the server" runtime error.
// Asset data lives in lib/mascot-assets.ts; this file owns identity/moods.

export type Mood = "happy" | "wink" | "cool" | "sleepy" | "love"

export type ArtEntry = {
  src: string
  w: number
  h: number
  box: [number, number, number, number]
}

const A = (src: string, w: number, h: number, x: number, y: number, bw: number, bh: number): ArtEntry => ({
  src,
  w,
  h,
  box: [x, y, bw, bh],
})

export const ART: Record<string, ArtEntry> = {
  // --- moments / reactions ---
  hero: A("/mascot-hero.png", 4060, 4060, 68, 716, 3870, 2754),
  quest: A("/mascot-quest.png", 768, 768, 22, 48, 692, 674),
  ai: A("/mascot-ai.png", 768, 768, 18, 102, 732, 564),
  insight: A("/mascot-insight.png", 768, 768, 18, 102, 732, 564),
  loading: A("/mascot-loading.png", 768, 768, 50, 40, 668, 688),
  success: A("/mascot-success.png", 768, 768, 10, 84, 748, 612),
  levelup: A("/mascot-levelup.png", 768, 768, 10, 84, 748, 612),
  confirm: A("/mascot-confirm.png", 3327, 3568, 200, 2, 3124, 3562),
  sad: A("/mascot-sad.png", 3563, 3352, 8, 146, 3364, 3202),
  streak: A("/mascot-streak.png", 768, 768, 10, 114, 746, 542),
  momo: A("/momo.png.png", 768, 768, 18, 102, 732, 564),

  // --- auth carousel ---
  auth1: A("/mascot-auth-1.png", 768, 768, 80, 104, 658, 562),
  auth2: A("/mascot-auth-2.png", 768, 768, 10, 84, 748, 612),
  auth3: A("/mascot-auth-3.png", 4060, 4060, 68, 716, 3870, 2754),
  auth4: A("/mascot-auth-4.png", 768, 768, 80, 104, 658, 562),

  // --- wide scene (login hero) ---
  welcome: A("/welcomee.png", 4020, 2612, 202, 6, 3590, 2452),

  // --- expressions (mood picker, avatars, small reactions) ---
  face1: A("/momoface1.png", 2024, 1566, 2, 2, 2020, 1564),
  face2: A("/momoface2.png", 2024, 1566, 2, 2, 2020, 1564),
  face3: A("/momoface3.png", 2024, 1566, 2, 2, 2020, 1564),
  face4: A("/momoface4.png", 2024, 1566, 2, 2, 2020, 1564),
  face5: A("/momoface5.png", 2024, 1566, 2, 2, 2020, 1564),
  face6: A("/momoface6.png", 2024, 1566, 2, 2, 2020, 1564),
}

export const MOODS: Mood[] = ["happy", "wink", "cool", "sleepy", "love"]

export const MOOD_ART: Record<Mood, string> = {
  happy: "face1",
  wink: "face6",
  cool: "face2",
  sleepy: "face4",
  love: "face3",
}

export const DEFAULT_ART = "hero"

/** Registry key for a key or a raw "/file.png" path. */
export function artKeyFor(name: string | undefined): string {
  if (!name) return DEFAULT_ART
  if (name in ART) return name
  const key = Object.keys(ART).find((k) => ART[k].src === name)
  return key ?? DEFAULT_ART
}

export function artFor(name: string | undefined): ArtEntry {
  return ART[artKeyFor(name)]
}

export type Geometry = { left: number; top: number; width: number; height: number }

/**
 * Size and place the image so the drawn content fills the slot.
 * - fit "contain": whole drawing inside the slot (never cropped)
 * - fit "cover": drawing covers the slot (edges cropped)
 * `align` only matters on the axis that has slack (contain) or overflow (cover).
 */
export function mascotGeometry(
  entry: ArtEntry,
  boxW: number,
  boxH: number,
  fit: "contain" | "cover" = "contain",
  align: "center" | "top" | "bottom" | "left" | "right" = "center",
): Geometry {
  const [x, y, bw, bh] = entry.box
  const fw = bw / entry.w
  const fh = bh / entry.h
  const contentAspect = bw / bh
  const boxAspect = boxW / boxH

  const widthDrivenByWidth = fit === "contain" ? contentAspect >= boxAspect : contentAspect < boxAspect
  let width: number
  let height: number
  if (widthDrivenByWidth) {
    width = boxW / fw
    height = (width * entry.h) / entry.w
  } else {
    height = boxH / fh
    width = (height * entry.w) / entry.h
  }

  const slackX = boxW - fw * width
  const slackY = boxH - fh * height
  const placeX = align === "left" ? 0 : align === "right" ? slackX : slackX / 2
  const placeY = align === "top" ? 0 : align === "bottom" ? slackY : slackY / 2

  return {
    left: -x * (width / entry.w) + placeX,
    top: -y * (height / entry.h) + placeY,
    width,
    height,
  }
}

export const MASCOT_PRESETS: Array<{ key: string; mood: Mood; label: string }> = [
  { key: "mascot:happy", mood: "happy", label: "Happy" },
  { key: "mascot:wink", mood: "wink", label: "Wink" },
  { key: "mascot:cool", mood: "cool", label: "Cool" },
  { key: "mascot:sleepy", mood: "sleepy", label: "Sleepy" },
  { key: "mascot:love", mood: "love", label: "Love" },
]

export function isMascot(url: string | null | undefined): boolean {
  return !!url && url.startsWith("mascot:")
}

export function moodOf(url: string | null | undefined): Mood {
  const m = (url || "").replace("mascot:", "") as Mood
  return (["happy", "wink", "cool", "sleepy", "love"] as Mood[]).includes(m) ? m : "happy"
}
