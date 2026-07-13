"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CompanyLogo } from "@/components/CompanyLogo"
import { Icon } from "@/components/Icons"
import { csx } from "@/lib/csx"
import { deleteInternship } from "@/app/actions/internships"
import {
  STATUSES,
  accentAt,
  deadlineChip,
  fmtShort,
  fmtRange,
  guessDomain,
  statusMeta,
  externalHref,
  type Internship,
} from "@/lib/helpers"

type Prog = Record<string, { done: number; total: number; pct: number }>

const ACTIVE = ["todo", "applied", "screening", "test", "interview", "offer"]

export function InternshipsClient({ items, progress }: { items: Internship[]; progress: Prog }) {
  const router = useRouter()
  const [, startTx] = useTransition()
  const [tab, setTab] = useState<string>("active")

  const counts: Record<string, number> = {
    active: items.filter((i) => ACTIVE.includes(i.status)).length,
    all: items.length,
  }
  for (const s of STATUSES) counts[s.key] = items.filter((i) => i.status === s.key).length

  const shown =
    tab === "active"
      ? items.filter((i) => ACTIVE.includes(i.status))
      : tab === "all"
      ? items
      : items.filter((i) => i.status === tab)

  function remove(e: React.MouseEvent, it: Internship) {
    e.stopPropagation()
    if (!confirm('Remove "' + it.company_name + '" from your list? This action cannot be undone.')) return
    startTx(async () => {
      await deleteInternship(it.id)
      router.refresh()
    })
  }

  return (
    <section className="iq-screen is-active">
      <div className="iq-tabs">
        <button className={"iq-tab" + (tab === "active" ? " is-active" : "")} onClick={() => setTab("active")}>
          Active <span className="iq-tab__cnt">{counts.active}</span>
        </button>
        <button className={"iq-tab" + (tab === "all" ? " is-active" : "")} onClick={() => setTab("all")}>
          All <span className="iq-tab__cnt">{counts.all}</span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.key}
            className={"iq-tab " + s.tab + (tab === s.key ? " is-active" : "")}
            onClick={() => setTab(s.key)}
          >
            {s.label} <span className="iq-tab__cnt">{counts[s.key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="iq-card iq-card__pad muted">No internships in this category yet. Click "Add Internship" above to add one.</div>
      ) : (
        <div className="iq-grid iq-grid--3">
          {shown.map((it, idx) => {
            const a = accentAt(idx)
            const p = progress[it.id] || { done: 0, total: 0, pct: 0 }
            const chip = deadlineChip(it.deadline)
            const sm = statusMeta(it.status)
            const range = fmtRange(it.open_date, it.deadline)
            return (
              <div
                key={it.id}
                className={"iq-icard iq-icard--" + a}
                onClick={() => router.push("/internships/" + it.id)}
                onMouseEnter={() => router.prefetch("/internships/" + it.id)}
              >
                <button className="iq-card-del" title="Delete" onClick={(e) => remove(e, it)}>✕</button>
                {chip && (
                  <span className="iq-timechip">
                    <Icon name="ic-clock" className="ic ic-16" /> {chip.label}
                  </span>
                )}
                <div className="iq-icard__top">
                  <CompanyLogo domain={guessDomain(it.company_name)} name={it.company_name} />
                  <div>
                    <div className="iq-icard__title">{it.company_name}</div>
                    <div className="iq-icard__sub">{it.role}</div>
                  </div>
                </div>
                <div className="iq-icard__meta">
                  {it.location || "-"}
                  {range ? " · " + range : it.start_date ? " · Starts " + fmtShort(it.start_date) : ""}
                  {it.duration_months ? " · " + it.duration_months + " months" : ""}
                </div>
                <div className="iq-progress"><div className="iq-progress__fill" style={csx("width:" + p.pct + "%")} /></div>
                <div className="iq-icard__foot">
                  <span>Checklist {p.done}/{p.total}</span>
                  <span className={"iq-chip " + sm.chip}>{sm.label}</span>
                </div>
                {it.source_url && (
                  <button
                    className="iq-apply-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(externalHref(it.source_url), "_blank", "noopener")
                    }}
                  >
                    <Icon name="ic-link" className="ic ic-16" /> Apply
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
