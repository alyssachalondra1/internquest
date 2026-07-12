"use client"

import { useEffect, useState } from "react"
import { Icon } from "@/components/Icons"
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
  { key: "d7", label: "Reminder 7 hari sebelum deadline", def: true },
  { key: "d3", label: "Reminder 3 hari sebelum deadline", def: true },
  { key: "d1", label: "Reminder 1 hari sebelum deadline", def: true },
  { key: "d0", label: "Reminder di hari deadline", def: true },
]

export default function SettingsPage() {
  const [notif, setNotif] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF.map((t) => [t.key, t.def])),
  )
  const [sound, setSound] = useState(true)
  const [lang, setLang] = useState("id")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      setSound(localStorage.getItem("iq-sound") !== "off")
      setLang(localStorage.getItem("iq-lang") || "id")
    } catch {}
  }, [])

  function save() {
    try {
      localStorage.setItem("iq-sound", sound ? "on" : "off")
      localStorage.setItem("iq-lang", lang)
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <section className="iq-screen is-active">
      <div className="iq-set-grid">
        <div>
          <div className="iq-card iq-card__pad iq-set-sec">
            <div className="iq-set-head"><span className="iq-set-ic"><Icon name="ic-bell" className="ic ic-18" /></span><h3>Notifikasi</h3></div>
            {NOTIF.map((t) => (
              <div key={t.key} className="iq-set-row">
                <div className="iq-set-row__t"><b>{t.label}</b></div>
                <Switch on={notif[t.key]} onChange={(v) => { setNotif((s) => ({ ...s, [t.key]: v })); setSaved(false) }} />
              </div>
            ))}
            <div className="iq-set-row">
              <div className="iq-set-row__t"><b>Email notifikasi</b><span>Segera hadir</span></div>
              <Switch on={false} onChange={() => {}} />
            </div>
          </div>

          <div className="iq-card iq-card__pad iq-set-sec">
            <div className="iq-set-head"><span className="iq-set-ic"><Icon name="ic-ai" className="ic ic-18" /></span><h3>Suara &amp; Efek</h3></div>
            <div className="iq-set-row">
              <div className="iq-set-row__t"><b>Efek suara</b><span>Bunyi saat dapat XP, naik level, dan melamar</span></div>
              <Switch on={sound} onChange={(v) => { setSound(v); setSaved(false) }} />
            </div>
          </div>
        </div>

        <div>
          <div className="iq-card iq-card__pad iq-set-sec">
            <div className="iq-set-head"><span className="iq-set-ic"><Icon name="ic-user" className="ic ic-18" /></span><h3>Bahasa</h3></div>
            <div className="iq-set-row">
              <div className="iq-set-row__t"><b>Bahasa aplikasi</b><span>Bahasa Inggris segera hadir</span></div>
              <div className="iq-seg">
                <button className={lang === "id" ? "on" : ""} onClick={() => { setLang("id"); setSaved(false) }}>Indonesia</button>
                <button className={lang === "en" ? "on" : ""} onClick={() => { setLang("en"); setSaved(false) }}>English</button>
              </div>
            </div>
          </div>

          <div className="iq-card iq-card__pad iq-set-sec">
            <div className="iq-set-head"><span className="iq-set-ic"><Icon name="ic-star" className="ic ic-18" /></span><h3>Tentang</h3></div>
            <div className="iq-set-row"><div className="iq-set-row__t"><b>InternQuest</b><span>Teman AI untuk berburu magang</span></div><span className="iq-chip iq-chip--blue">v1.0</span></div>
          </div>

          <button className="iq-btn iq-btn--primary" onClick={save}>Simpan pengaturan</button>
          {saved && <span className="muted" style={csx("margin-left:12px")}>Tersimpan ✅</span>}
        </div>
      </div>
    </section>
  )
}
