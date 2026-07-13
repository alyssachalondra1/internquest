"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { createClient } from "@/lib/supabase/client"
import { saveCv, saveInterests, saveAvatar, savePortfolio } from "@/app/actions/profile"
import { QuestyFace } from "@/components/MascotAvatar"
import { MASCOT_PRESETS, isMascot } from "@/lib/mascot"
import { csx } from "@/lib/csx"

export function ProfileExtras({
  hasCv,
  cvName,
  interests: initialInterests,
  hasPortfolio,
  portfolioName,
  avatarUrl,
}: {
  hasCv: boolean
  cvName: string | null
  interests: string | null
  hasPortfolio: boolean
  portfolioName: string | null
  avatarUrl: string | null
}) {
  const router = useRouter()
  const cvRef = useRef<HTMLInputElement>(null)
  const pfRef = useRef<HTMLInputElement>(null)
  const avaRef = useRef<HTMLInputElement>(null)
  const [cvBusy, setCvBusy] = useState(false)
  const [cvLabel, setCvLabel] = useState(hasCv ? cvName || "CV saved" : "")
  const [cvErr, setCvErr] = useState<string | null>(null)
  const [pfBusy, setPfBusy] = useState(false)
  const [pfLabel, setPfLabel] = useState(hasPortfolio ? portfolioName || "Portfolio saved" : "")
  const [pfErr, setPfErr] = useState<string | null>(null)
  const [interests, setInterests] = useState(initialInterests || "")
  const [savedInt, setSavedInt] = useState(false)
  const [avaBusy, setAvaBusy] = useState(false)
  const [avaErr, setAvaErr] = useState<string | null>(null)
  const [ava, setAva] = useState<string | null>(avatarUrl)

  async function uploadPdf(file: File, prefix: string) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Your session has expired, please log in again")
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
    if (!json.ok) throw new Error(json.error || "Could not read the PDF")
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
      setCvErr(e?.message || "Upload failed")
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
      setPfErr(e?.message || "Upload failed")
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
      if (!user) throw new Error("Session expired")
      const path = user.id + "/avatar-" + Date.now() + "-" + file.name
      const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
      if (up.error) throw new Error(up.error.message)
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path)
      await saveAvatar(pub.publicUrl)
      setAva(pub.publicUrl)
      setAvaErr(null)
      router.refresh()
    } catch (e: any) {
      setAvaErr(e?.message || "Upload failed. Make sure the 'avatars' storage bucket exists and is public.")
    } finally {
      setAvaBusy(false)
    }
  }

  async function pickPreset(key: string) {
    setAvaErr(null)
    setAva(key)
    await saveAvatar(key)
    router.refresh()
  }

  async function saveInt() {
    await saveInterests(interests)
    setSavedInt(true)
    router.refresh()
  }

  return (
    <div className="iq-card iq-card__pad">
      <h3 className="mb-4">CV, Portfolio &amp; Preferences</h3>

      <div className="iq-form-row">
        <label>CV (PDF), used by AI for personalized results</label>
        <input ref={cvRef} type="file" accept="application/pdf" hidden onChange={onPickCv} />
        <div className={"iq-cvbox" + (cvLabel ? " is-set" : "")} onClick={() => !cvBusy && cvRef.current?.click()}>
          {cvBusy ? "Reading your CV with AI…" : cvLabel ? "✓ " + cvLabel + " · click to replace" : "Click to upload your CV (PDF)"}
        </div>
        {cvErr && <p style={csx("color:var(--red-text);font-size:12px;margin-top:6px")}>{cvErr}</p>}
      </div>

      <div className="iq-form-row">
        <label>Portfolio (PDF), also read by AI for more relevant results</label>
        <input ref={pfRef} type="file" accept="application/pdf" hidden onChange={onPickPortfolio} />
        <div className={"iq-cvbox" + (pfLabel ? " is-set" : "")} onClick={() => !pfBusy && pfRef.current?.click()}>
          {pfBusy ? "Reading your portfolio with AI…" : pfLabel ? "✓ " + pfLabel + " · click to replace" : "Click to upload your Portfolio (PDF)"}
        </div>
        {pfErr && <p style={csx("color:var(--red-text);font-size:12px;margin-top:6px")}>{pfErr}</p>}
      </div>

      <div className="iq-form-row">
        <label>Interests &amp; target fields (optional)</label>
        <textarea
          className="iq-textarea"
          style={csx("min-height:80px")}
          value={interests}
          onChange={(e) => {
            setInterests(e.target.value)
            setSavedInt(false)
          }}
          placeholder="Example: interested in data analysis, supply chain, and digital marketing…"
        />
        <button className="iq-btn iq-btn--ghost iq-btn--sm mt-2" onClick={saveInt}>
          <Icon name="ic-save" className="ic ic-16" /> {savedInt ? "Saved" : "Save interests"}
        </button>
      </div>

      <div className="iq-form-row" style={csx("margin-bottom:0")}>
        <label>Profile photo</label>
        <p className="muted" style={csx("font-size:12px;margin:-2px 0 10px")}>Pick a Questy expression, or upload your own photo.</p>
        <div className="iq-avatar-picker">
          {MASCOT_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={"iq-avatar-opt" + (ava === p.key ? " is-active" : "")}
              onClick={() => pickPreset(p.key)}
              title={p.label}
            >
              <QuestyFace mood={p.mood} size={46} />
            </button>
          ))}
          <input ref={avaRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
          <button
            type="button"
            className={"iq-avatar-opt iq-avatar-opt--upload" + (ava && !isMascot(ava) ? " is-active" : "")}
            onClick={() => !avaBusy && avaRef.current?.click()}
            title="Upload your own photo"
          >
            {ava && !isMascot(ava) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ava} alt="Your photo" />
            ) : (
              <Icon name="ic-upload" className="ic ic-18" />
            )}
          </button>
        </div>
        {avaBusy && <p className="muted" style={csx("font-size:12px;margin-top:8px")}>Uploading…</p>}
        {avaErr && <p style={csx("color:var(--red-text);font-size:12px;margin-top:8px")}>{avaErr}</p>}
      </div>
    </div>
  )
}
