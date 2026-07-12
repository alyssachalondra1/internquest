"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { createClient } from "@/lib/supabase/client"
import { saveCv, saveInterests, saveAvatar, savePortfolio } from "@/app/actions/profile"
import { csx } from "@/lib/csx"

export function ProfileExtras({
  hasCv,
  cvName,
  interests: initialInterests,
  hasPortfolio,
  portfolioName,
}: {
  hasCv: boolean
  cvName: string | null
  interests: string | null
  hasPortfolio: boolean
  portfolioName: string | null
}) {
  const router = useRouter()
  const cvRef = useRef<HTMLInputElement>(null)
  const pfRef = useRef<HTMLInputElement>(null)
  const avaRef = useRef<HTMLInputElement>(null)
  const [cvBusy, setCvBusy] = useState(false)
  const [cvLabel, setCvLabel] = useState(hasCv ? cvName || "CV tersimpan" : "")
  const [cvErr, setCvErr] = useState<string | null>(null)
  const [pfBusy, setPfBusy] = useState(false)
  const [pfLabel, setPfLabel] = useState(hasPortfolio ? portfolioName || "Portfolio tersimpan" : "")
  const [pfErr, setPfErr] = useState<string | null>(null)
  const [interests, setInterests] = useState(initialInterests || "")
  const [savedInt, setSavedInt] = useState(false)
  const [avaBusy, setAvaBusy] = useState(false)

  async function uploadPdf(file: File, prefix: string) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Sesi habis, login lagi ya")
    const path = user.id + "/" + prefix + "-" + Date.now() + "-" + file.name
    const up = await supabase.storage.from("cvs").upload(path, file, { upsert: true })
    if (up.error) throw new Error(up.error.message)
    const { data: pub } = supabase.storage.from("cvs").getPublicUrl(path)
    const res = await fetch("/api/cv-extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cv_url: pub.publicUrl }),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || "Gagal membaca PDF")
    return { url: pub.publicUrl as string, text: json.text as string }
  }

  async function onPickCv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCvBusy(true)
    setCvErr(null)
    try {
      const r = await uploadPdf(file, "cv")
      await saveCv({ cv_url: r.url, cv_text: r.text })
      setCvLabel(file.name)
      router.refresh()
    } catch (e: any) {
      setCvErr(e?.message || "Upload gagal")
    } finally {
      setCvBusy(false)
    }
  }

  async function onPickPortfolio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPfBusy(true)
    setPfErr(null)
    try {
      const r = await uploadPdf(file, "portfolio")
      await savePortfolio({ portfolio_url: r.url, portfolio_text: r.text })
      setPfLabel(file.name)
      router.refresh()
    } catch (e: any) {
      setPfErr(e?.message || "Upload gagal")
    } finally {
      setPfBusy(false)
    }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvaBusy(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Sesi habis")
      const path = user.id + "/avatar-" + Date.now() + "-" + file.name
      const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
      if (up.error) throw new Error(up.error.message)
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path)
      await saveAvatar(pub.publicUrl)
      router.refresh()
    } catch {
      // diabaikan
    } finally {
      setAvaBusy(false)
    }
  }

  async function saveInt() {
    await saveInterests(interests)
    setSavedInt(true)
    router.refresh()
  }

  return (
    <div className="iq-card iq-card__pad">
      <h3 className="mb-4">CV, Portfolio &amp; Preferensi</h3>

      <div className="iq-form-row">
        <label>CV (PDF), dipakai AI untuk hasil yang dipersonalisasi</label>
        <input ref={cvRef} type="file" accept="application/pdf" hidden onChange={onPickCv} />
        <div className={"iq-cvbox" + (cvLabel ? " is-set" : "")} onClick={() => !cvBusy && cvRef.current?.click()}>
          {cvBusy ? "Membaca CV dengan AI…" : cvLabel ? "✓ " + cvLabel + " · klik untuk ganti" : "Klik untuk upload CV (PDF)"}
        </div>
        {cvErr && <p style={csx("color:var(--red-text);font-size:12px;margin-top:6px")}>{cvErr}</p>}
      </div>

      <div className="iq-form-row">
        <label>Portfolio (PDF), ikut dibaca AI untuk hasil yang lebih relevan</label>
        <input ref={pfRef} type="file" accept="application/pdf" hidden onChange={onPickPortfolio} />
        <div className={"iq-cvbox" + (pfLabel ? " is-set" : "")} onClick={() => !pfBusy && pfRef.current?.click()}>
          {pfBusy ? "Membaca portfolio dengan AI…" : pfLabel ? "✓ " + pfLabel + " · klik untuk ganti" : "Klik untuk upload Portfolio (PDF)"}
        </div>
        {pfErr && <p style={csx("color:var(--red-text);font-size:12px;margin-top:6px")}>{pfErr}</p>}
      </div>

      <div className="iq-form-row">
        <label>Minat &amp; bidang yang dituju (opsional)</label>
        <textarea
          className="iq-textarea"
          style={csx("min-height:80px")}
          value={interests}
          onChange={(e) => {
            setInterests(e.target.value)
            setSavedInt(false)
          }}
          placeholder="Contoh: tertarik di data analysis, supply chain, dan pemasaran digital…"
        />
        <button className="iq-btn iq-btn--ghost iq-btn--sm mt-2" onClick={saveInt}>
          <Icon name="ic-save" className="ic ic-16" /> {savedInt ? "Tersimpan" : "Simpan minat"}
        </button>
      </div>

      <div className="iq-form-row" style={csx("margin-bottom:0")}>
        <label>Foto profil</label>
        <input ref={avaRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
        <button className="iq-btn iq-btn--ghost iq-btn--sm" onClick={() => !avaBusy && avaRef.current?.click()}>
          <Icon name="ic-upload" className="ic ic-16" /> {avaBusy ? "Mengunggah…" : "Ganti foto profil"}
        </button>
      </div>
    </div>
  )
}
