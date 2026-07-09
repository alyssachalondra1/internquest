"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { toggleChecklistItem, addChecklistItem } from "@/app/actions/internships"

type Row = { id: string; label: string; is_done: boolean }

export function ChecklistCard({
  internshipId,
  items,
  done,
}: {
  internshipId: string
  items: Row[]
  done: number
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState("")

  function toggle(row: Row) {
    start(async () => {
      await toggleChecklistItem(row.id, !row.is_done)
      router.refresh()
    })
  }
  function add() {
    if (!label.trim()) { setAdding(false); return }
    const v = label.trim()
    setLabel("")
    setAdding(false)
    start(async () => {
      await addChecklistItem(internshipId, v)
      router.refresh()
    })
  }

  return (
    <div className="iq-card iq-card__pad">
      <div className="iq-sec-title"><h3>Checklist</h3><span className="muted">{done} / {items.length} selesai</span></div>
      <div className="stack-2">
        {items.map((row) => (
          <div key={row.id} className={"iq-check" + (row.is_done ? " is-done" : "")} onClick={() => toggle(row)}>
            <span className="iq-check__box"><Icon name="ic-check" /></span>
            <span className="iq-check__label">{row.label}</span>
          </div>
        ))}
        {items.length === 0 && <p className="muted">Belum ada item. Tambahkan di bawah.</p>}
      </div>
      {adding ? (
        <div className="row mt-4" style={ { gap: "8px" } }>
          <input className="iq-input" autoFocus value={label} placeholder="Nama dokumen…" onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button className="iq-btn iq-btn--primary iq-btn--sm" onClick={add} disabled={pending}>Tambah</button>
        </div>
      ) : (
        <button className="iq-btn iq-btn--ghost iq-btn--sm mt-4" onClick={() => setAdding(true)}>
          <Icon name="ic-plus" className="ic ic-16" /> Tambah item
        </button>
      )}
    </div>
  )
}
