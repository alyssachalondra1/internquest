"use client"

import { useSyncExternalStore } from "react"
import { Icon } from "@/components/Icons"
import { THEME_STORAGE_KEY } from "@/lib/theme-script"

/* Theme: "system" follows the OS, "light"/"dark" are explicit user choices.
   <html data-theme> is set before first paint by THEME_SCRIPT, and every
   change goes through setChoice() + emit(), so no component holds state. */

export type ThemeChoice = "system" | "light" | "dark"

const KEY = THEME_STORAGE_KEY

function systemTheme(): "light" | "dark" {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function readChoice(): ThemeChoice {
  if (typeof window === "undefined") return "light"
  try {
    const v = localStorage.getItem(KEY)
    if (v === "light" || v === "dark" || v === "system") return v
  } catch {}
  // No stored choice: the light lavender theme is the default.
  return "light"
}

const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", cb)
  window.addEventListener("storage", cb)
  return () => {
    listeners.delete(cb)
    mq.removeEventListener("change", cb)
    window.removeEventListener("storage", cb)
  }
}

function setChoice(next: ThemeChoice) {
  try {
    localStorage.setItem(KEY, next)
  } catch {}
  const theme = next === "system" ? systemTheme() : next
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  listeners.forEach((l) => l())
}

function useChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, readChoice, () => "system")
}

function useResolved(): "light" | "dark" {
  return useSyncExternalStore(
    subscribe,
    () => {
      const c = readChoice()
      return c === "system" ? systemTheme() : c
    },
    () => "light",
  )
}

/** Icon button for the top bar: flips between light and dark. */
export function ThemeButton() {
  const resolved = useResolved()
  const next = resolved === "dark" ? "light" : "dark"
  return (
    <button
      className="iq-iconbtn"
      onClick={() => setChoice(next)}
      title={"Switch to " + next + " mode"}
      aria-label={"Switch to " + next + " mode"}
    >
      <Icon name={resolved === "dark" ? "ic-sun" : "ic-moon"} className="ic ic-20" />
    </button>
  )
}

/** Segmented control for Settings: System / Light / Dark. */
export function ThemeSelect() {
  const choice = useChoice()
  const options: Array<{ key: ThemeChoice; label: string; icon: string }> = [
    { key: "system", label: "System", icon: "ic-settings" },
    { key: "light", label: "Light", icon: "ic-sun" },
    { key: "dark", label: "Dark", icon: "ic-moon" },
  ]
  return (
    <div className="iq-seg">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          className={choice === o.key ? "on" : ""}
          onClick={() => setChoice(o.key)}
        >
          <Icon name={o.icon} className="ic ic-16" /> {o.label}
        </button>
      ))}
    </div>
  )
}
