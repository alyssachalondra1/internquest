// Pure mascot helpers (NO "use client").
// These are plain functions/constants that must be callable from BOTH server
// components (e.g. profile/page.tsx, AppShell) and client components. Keeping
// them here — outside the "use client" MascotAvatar module — prevents the
// "Attempted to call moodOf() from the server" runtime error.

export type Mood = "happy" | "wink" | "cool" | "sleepy" | "love"

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
