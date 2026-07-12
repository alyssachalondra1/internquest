export type Internship = {
  id: string
  company_name: string
  role: string | null
  location: string | null
  work_type: string | null
  is_paid: boolean | null
  poster_url: string | null
  source_url: string | null
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
  { key: "todo", label: "Belum dilamar", chip: "iq-chip--pink", tab: "iq-tab--todo" },
  { key: "applied", label: "Dilamar", chip: "iq-chip--yellow", tab: "iq-tab--applied" },
  { key: "interview", label: "Interview", chip: "iq-chip--blue", tab: "iq-tab--interview" },
  { key: "offer", label: "Offer", chip: "iq-chip--green", tab: "iq-tab--offer" },
  { key: "rejected", label: "Ditolak", chip: "iq-chip--rejected", tab: "iq-tab--rejected" },
]

export function statusMeta(key: string) {
  return STATUSES.find((s) => s.key === key) || STATUSES[0]
}

export function guessDomain(company: string | null): string {
  if (!company) return ""
  return company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com"
}

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

export function fmtShort(iso?: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "-"
  return d.getDate() + " " + MONTHS_ID[d.getMonth()]
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
  if (n < 0) return { label: "Lewat", cls: "iq-chip--rejected" }
  if (n === 0) return { label: "Hari ini", cls: "iq-chip--pink" }
  if (n === 1) return { label: "Besok", cls: "iq-chip--pink" }
  if (n <= 3) return { label: n + " hari", cls: "iq-chip--yellow" }
  if (n <= 7) return { label: n + " hari", cls: "iq-chip--blue" }
  return { label: n + " hari", cls: "iq-chip--green" }
}
