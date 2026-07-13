export type Internship = {
  id: string
  company_name: string
  role: string | null
  location: string | null
  work_type: string | null
  is_paid: boolean | null
  poster_url: string | null
  source_url: string | null
  open_date: string | null
  deadline: string | null
  start_date: string | null
  duration_months: number | null
  status: string
  notes: string | null
  match_score: number | null
  match_reasons: string | null
}

export const ACCENTS = ["pink", "yellow", "blue", "green"] as const
export type Accent = (typeof ACCENTS)[number]
export const accentAt = (i: number): Accent => ACCENTS[i % ACCENTS.length]

export const STATUSES = [
  { key: "todo", label: "To Do", chip: "iq-chip--pink", tab: "iq-tab--todo" },
  { key: "applied", label: "Applied", chip: "iq-chip--yellow", tab: "iq-tab--applied" },
  { key: "screening", label: "Screening", chip: "iq-chip--blue", tab: "iq-tab--interview" },
  { key: "test", label: "Online Test", chip: "iq-chip--blue", tab: "iq-tab--interview" },
  { key: "interview", label: "Interview", chip: "iq-chip--blue", tab: "iq-tab--interview" },
  { key: "offer", label: "Offer", chip: "iq-chip--green", tab: "iq-tab--offer" },
  { key: "rejected", label: "Rejected", chip: "iq-chip--rejected", tab: "iq-tab--rejected" },
]

export function statusMeta(key: string) {
  return STATUSES.find((s) => s.key === key) || STATUSES[0]
}

export function guessDomain(company: string | null): string {
  if (!company) return ""
  return company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com"
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function fmtShort(iso?: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "-"
  return d.getDate() + " " + MONTHS_EN[d.getMonth()]
}

/** Registration window text, e.g. "12 Jul - 30 Jul". Uses an en dash, never an em dash. */
export function fmtRange(open?: string | null, close?: string | null): string | null {
  const o = open ? fmtShort(open) : null
  const c = close ? fmtShort(close) : null
  if (o && c) return o + " \u2013 " + c
  if (c) return "Until " + c
  if (o) return "From " + o
  return null
}

export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

export function deadlineChip(iso?: string | null): { label: string; cls: string } | null {
  const n = daysUntil(iso)
  if (n === null) return null
  if (n < 0) return { label: "Passed", cls: "iq-chip--rejected" }
  if (n === 0) return { label: "Today", cls: "iq-chip--pink" }
  if (n === 1) return { label: "Tomorrow", cls: "iq-chip--pink" }
  if (n <= 3) return { label: n + " days", cls: "iq-chip--yellow" }
  if (n <= 7) return { label: n + " days", cls: "iq-chip--blue" }
  return { label: n + " days", cls: "iq-chip--green" }
}

// Ensure an external URL has a protocol so it opens correctly (fixes the 404
// when a link was saved without http/https and got treated as a path under
// internquest.my.id).
export function externalHref(url: string | null | undefined): string {
  const u = (url || "").trim()
  if (!u) return "#"
  if (/^https?:\/\//i.test(u)) return u
  if (/^(mailto:|tel:)/i.test(u)) return u
  return "https://" + u.replace(/^\/+/, "")
}
