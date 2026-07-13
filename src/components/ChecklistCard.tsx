"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { toggleChecklistItem, addChecklistItem } from "@/app/actions/internships"
import { playXp } from "@/lib/sound"
import { csx } from "@/lib/csx"

type Row = { id: string; label: string; is_done: boolean }

export function ChecklistCard({
  internshipId,
  items,
}: {
  internshipId: string
  items: Row[]
  done?: number
}) {
  const router = useRouter()
  const [, start] = useTransition()
  const [rows, setRows] = useState<Row[]>(items)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState("")

  // Sync when server data changes (for example after a refresh).
  useEffect(() => {
    setRows(items)
  }, [items])

  const done = rows.filter((r) => r.is_done).length

  function toggle(row: Row) {
    const nd = !row.is_done
    // Optimistic update so it does not feel laggy.
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_done: nd } : r)))
    if (nd) playXp()
    start(async () => {
      await toggleChecklistItem(row.id, nd)
      router.refresh()
    })
  }

  function add() {
    const v = label.trim()
    if (!v) {
      setAdding(false)
      return
    }
    setLabel("")
    setAdding(false)
    const tempId = "temp-" + Date.now()
    setRows((rs) => [...rs, { id: tempId, label: v, is_done: false }])
    start(async () => {
      await addChecklistItem(internshipId, v)
      router.refresh()
    })
  }

  return (
    <div className="iq-card iq-card__pad">
      <div className="iq-sec-title"><h3>Checklist</h3><span className="muted">{done} / {rows.length} done</span></div>
      <div className="stack-2">
        {rows.map((row) => (
          <div key={row.id} className={"iq-check" + (row.is_done ? " is-done" : "")} onClick={() => toggle(row)}>
            <span className="iq-check__box"><Icon name="ic-check" /></span>
            <span className="iq-check__label">{row.label}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="muted">No items yet. Add one below.</p>}
      </div>
      {adding ? (
        <div className="row mt-4" style={csx("gap:8px")}>
          <input className="iq-input" autoFocus value={label} placeholder="Document name…" onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button className="iq-btn iq-btn--primary iq-btn--sm" onClick={add}>Add</button>
        </div>
      ) : (
        <button className="iq-btn iq-btn--ghost iq-btn--sm mt-4" onClick={() => setAdding(true)}>
          <Icon name="ic-plus" className="ic ic-16" /> Add item
        </button>
      )}
    </div>
  )
}
