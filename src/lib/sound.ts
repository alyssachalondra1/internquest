"use client"

// Efek suara ringan (Web Audio) tanpa file aset. Bisa dimatikan di Settings.
let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

function enabled(): boolean {
  try {
    return localStorage.getItem("iq-sound") !== "off"
  } catch {
    return true
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "triangle", gain = 0.12) {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  o.connect(g)
  g.connect(c.destination)
  const t = c.currentTime + start
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function resume() {
  const c = ac()
  if (c && c.state === "suspended") c.resume()
}

export function playXp() {
  if (!enabled()) return
  resume()
  tone(660, 0, 0.12)
  tone(880, 0.08, 0.14)
}

export function playApply() {
  if (!enabled()) return
  resume()
  tone(523, 0, 0.12)
  tone(659, 0.1, 0.12)
  tone(784, 0.2, 0.18)
}

export function playLevelUp() {
  if (!enabled()) return
  resume()
  ;[523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.18, "triangle", 0.14))
}

export function playSad() {
  if (!enabled()) return
  resume()
  tone(392, 0, 0.22, "sine", 0.1)
  tone(311, 0.16, 0.32, "sine", 0.1)
}

// Bright rising chime for "you did it" moments (e.g. internship added).
export function playSuccess() {
  if (!enabled()) return
  resume()
  tone(659, 0, 0.12)
  tone(988, 0.09, 0.14)
  tone(1319, 0.19, 0.2, "triangle", 0.13)
}

// Energetic "fire" whoosh for streak celebrations.
export function playStreak() {
  if (!enabled()) return
  resume()
  tone(392, 0, 0.1, "sawtooth", 0.08)
  tone(587, 0.08, 0.1, "sawtooth", 0.09)
  tone(880, 0.16, 0.22, "triangle", 0.12)
}
