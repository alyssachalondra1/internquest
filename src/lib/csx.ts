import type { CSSProperties } from "react"

/** Ubah string CSS ("width:200px;color:red") jadi objek style React. */
export function csx(css: string): CSSProperties {
  const style: Record<string, string> = {}
  for (const rule of css.split(";")) {
    const idx = rule.indexOf(":")
    if (idx === -1) continue
    const rawKey = rule.slice(0, idx).trim()
    const value = rule.slice(idx + 1).trim()
    if (!rawKey || !value) continue
    const key = rawKey.startsWith("--")
      ? rawKey
      : rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    style[key] = value
  }
  return style as CSSProperties
}