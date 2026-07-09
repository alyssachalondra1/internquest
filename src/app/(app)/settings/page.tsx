"use client"

import { useState } from "react"
import { csx } from "@/lib/csx"

const TOGGLES = [
  { key: "d7", label: "Reminder 7 hari sebelum", def: true },
  { key: "d3", label: "Reminder 3 hari sebelum", def: true },
  { key: "d1", label: "Reminder 1 hari sebelum", def: true },
  { key: "d0", label: "Reminder hari-H", def: true },
  { key: "email", label: "Email notifikasi (segera hadir)", def: false },
]

export default function SettingsPage() {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLES.map((t) => [t.key, t.def])),
  )
  const [saved, setSaved] = useState(false)

  return (
    <section className="iq-screen is-active">
      <div className="iq-card iq-card__pad" style={csx("max-width:640px")}>
        <h3 className="mb-6">Notification Settings</h3>
        {TOGGLES.map((t) => (
          <div key={t.key} className="iq-field">
            <span className="iq-field__k" style={csx("font-size:14px;color:var(--ink)")}>{t.label}</span>
            <input
              type="checkbox"
              checked={state[t.key]}
              onChange={(e) => { setState((s) => ({ ...s, [t.key]: e.target.checked })); setSaved(false) }}
            />
          </div>
        ))}
        <button className="iq-btn iq-btn--primary mt-6" onClick={() => setSaved(true)}>Simpan</button>
        {saved && <p className="muted mt-4">Preferensi tersimpan untuk sesi ini. ✅</p>}
      </div>
    </section>
  )
}
