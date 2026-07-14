"use client"

import { useEffect, useState } from "react"
import { Icon } from "@/components/Icons"
import { LogoutButton } from "@/components/LogoutButton"
import { csx } from "@/lib/csx"

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="iq-switch">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
      <span className="knob" />
    </label>
  )
}

const NOTIF = [
  { key: "d7", label: "Reminder 7 days before the deadline", def: true },
  { key: "d3", label: "Reminder 3 days before the deadline", def: true },
  { key: "d1", label: "Reminder 1 day before the deadline", def: true },
  { key: "d0", label: "Reminder on the deadline day", def: true },
]

export default function SettingsPage() {
  const [notif, setNotif] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF.map((t) => [t.key, t.def])),
  )
  const [sound, setSound] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      setSound(localStorage.getItem("iq-sound") !== "off")
    } catch {}
  }, [])

  function save() {
    try {
      localStorage.setItem("iq-sound", sound ? "on" : "off")
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <section className="iq-screen is-active">
      <div className="iq-set-grid">
        <div>
          <div className="iq-card iq-card__pad iq-set-sec">
            <div className="iq-set-head"><span className="iq-set-ic"><Icon name="ic-bell" className="ic ic-18" /></span><h3>Notifications</h3></div>
            {NOTIF.map((t) => (
              <div key={t.key} className="iq-set-row">
                <div className="iq-set-row__t"><b>{t.label}</b></div>
                <Switch on={notif[t.key]} onChange={(v) => { setNotif((s) => ({ ...s, [t.key]: v })); setSaved(false) }} />
              </div>
            ))}
            <div className="iq-set-row">
              <div className="iq-set-row__t"><b>Email notifications</b><span>Coming soon</span></div>
              <Switch on={false} onChange={() => {}} />
            </div>
          </div>

          <div className="iq-card iq-card__pad iq-set-sec">
            <div className="iq-set-head"><span className="iq-set-ic"><Icon name="ic-ai" className="ic ic-18" /></span><h3>Sound &amp; Effects</h3></div>
            <div className="iq-set-row">
              <div className="iq-set-row__t"><b>Sound effects</b><span>Play a sound when you earn XP, level up, and apply</span></div>
              <Switch on={sound} onChange={(v) => { setSound(v); setSaved(false) }} />
            </div>
          </div>
        </div>

        <div>
          <div className="iq-card iq-card__pad iq-set-sec">
            <div className="iq-set-head"><span className="iq-set-ic"><Icon name="ic-star" className="ic ic-18" /></span><h3>About</h3></div>
            <div className="iq-set-row"><div className="iq-set-row__t"><b>Sloe</b><span>Your AI companion for internship hunting</span></div><span className="iq-chip iq-chip--blue">v1.0</span></div>
          </div>

          <div className="iq-card iq-card__pad iq-set-sec">
            <div className="iq-set-head"><span className="iq-set-ic"><Icon name="ic-logout" className="ic ic-18" /></span><h3>Account</h3></div>
            <LogoutButton />
          </div>

          <button className="iq-btn iq-btn--primary" onClick={save}>Save settings</button>
          {saved && <span className="muted" style={csx("margin-left:12px")}>Saved</span>}
        </div>
      </div>
    </section>
  )
}
