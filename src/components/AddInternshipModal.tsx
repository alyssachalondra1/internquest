"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { HeroMascot } from "@/components/HeroMascot"
import { AiErrorState } from "@/components/AiErrorState"
import { createClient } from "@/lib/supabase/client"
import { createInternship, type NewInternship } from "@/app/actions/internships"
import { DEADLINE_TYPES } from "@/lib/helpers"
import { playSuccess } from "@/lib/sound"
import { csx } from "@/lib/csx"

type Step = "method" | "extracting" | "posterMode" | "review" | "reviewList" | "success"
type Mode = "poster" | "ig" | "link" | "jd" | "manual"

const EMPTY: NewInternship = {
  company_name: "",
  role: "",
  location: "",
  work_type: "",
  is_paid: false,
  open_date: "",
  deadline: "",
  deadline_type: "date",
  timing_note: "",
  start_date: "",
  duration_months: null,
  notes: "",
  poster_url: null,
  source_url: null,
}

// Build an internship form object from one AI result + the poster it came from.
function fromExtracted(d: any, poster_url: string | null): NewInternship {
  const dt = d?.deadline_type || "date"
  return {
    ...EMPTY,
    company_name: d?.company_name || "",
    role: d?.role || "",
    location: d?.location || "",
    work_type: d?.work_type || "",
    is_paid: !!d?.is_paid,
    open_date: d?.open_date || "",
    deadline: dt === "date" ? d?.deadline || "" : "",
    deadline_type: dt,
    timing_note: d?.timing_note || "",
    start_date: d?.start_date || "",
    duration_months: d?.duration_months || null,
    notes: d?.notes || "",
    poster_url,
    source_url: d?.source_url || null,
  }
}

// Compress and resize the poster image before upload so upload and AI reading are much faster.
async function compressImage(file: File, max = 1400, quality = 0.82): Promise<Blob> {
  try {
    if (!file.type.startsWith("image/")) return file
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b || file), "image/jpeg", quality),
    )
  } catch {
    return file
  }
}

export function AddInternshipModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("method")
  const [form, setForm] = useState<NewInternship>(EMPTY)
  const [text, setText] = useState("")
  const [mode, setMode] = useState<Mode>("manual")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  // Multi-poster state.
  const [posterUrls, setPosterUrls] = useState<string[]>([])
  const [list, setList] = useState<NewInternship[]>([])
  const [included, setIncluded] = useState<boolean[]>([])

  if (!open) return null

  function reset() {
    setStep("method")
    setForm(EMPTY)
    setText("")
    setError(null)
    setSavedId(null)
    setSavedCount(0)
    setPosterUrls([])
    setList([])
    setIncluded([])
  }
  function close() {
    reset()
    onClose()
  }

  async function runExtract(payload: { poster_url?: string; text?: string; source_url?: string }) {
    setStep("extracting")
    setError(null)
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Could not read the posting")
      const f = fromExtracted(json.data || {}, payload.poster_url || null)
      if (!f.source_url && payload.source_url) f.source_url = payload.source_url
      setForm(f)
      if (json.warning) setError(json.warning)
      setStep("review")
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
      setStep("method")
    }
  }

  // Read several posters at once: either merged into one internship or split
  // into one internship per poster. Both use a single AI call to stay light.
  async function runExtractMulti(urls: string[], multi_mode: "merge" | "separate") {
    setStep("extracting")
    setError(null)
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poster_urls: urls, multi_mode }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Could not read the posters")
      if (multi_mode === "merge") {
        setForm(fromExtracted(json.data || {}, urls[0] || null))
        if (json.warning) setError(json.warning)
        setStep("review")
      } else {
        const arr: any[] = Array.isArray(json.list) ? json.list : []
        const mapped = (arr.length ? arr : [{}]).map((d, i) => fromExtracted(d, urls[i] ?? null))
        setList(mapped)
        setIncluded(mapped.map(() => true))
        if (json.warning) setError(json.warning)
        setStep("reviewList")
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
      setStep("method")
    }
  }

  async function onPickPoster(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = "" // allow re-picking the same files later
    if (!files.length) return
    setStep("extracting")
    setError(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Your session has expired, please log in again")
      const urls: string[] = []
      for (const file of files) {
        const blob = await compressImage(file)
        const path = user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 7) + ".jpg"
        const up = await supabase.storage
          .from("posters")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true })
        if (up.error) throw new Error(up.error.message)
        const { data: pub } = supabase.storage.from("posters").getPublicUrl(path)
        urls.push(pub.publicUrl)
      }
      setPosterUrls(urls)
      if (urls.length === 1) {
        await runExtract({ poster_url: urls[0] })
      } else {
        setStep("posterMode")
      }
    } catch (e: any) {
      setError(e?.message || "Upload failed")
      setStep("method")
    }
  }

  // Turn a form into the payload createInternship expects.
  function toPayload(f: NewInternship): NewInternship {
    const dt = f.deadline_type || "date"
    return {
      ...f,
      duration_months: f.duration_months ? Number(f.duration_months) : null,
      open_date: f.open_date || null,
      deadline: dt === "date" ? f.deadline || null : null,
      deadline_type: dt,
      timing_note: dt === "date" ? null : f.timing_note || null,
      start_date: f.start_date || null,
    }
  }

  async function save() {
    setSaving(true)
    try {
      if (!form.company_name.trim()) throw new Error("Company name is required")
      if (form.source_url && form.source_url.trim() && !/^https?:\/\/.+/i.test(form.source_url.trim()))
        throw new Error("The application link must start with http:// or https://")
      if ((form.deadline_type || "date") === "date" && form.open_date && form.deadline && form.deadline < form.open_date)
        throw new Error("The deadline cannot be earlier than the registration open date.")
      const id = await createInternship(toPayload(form))
      setSavedId(id)
      setSavedCount(1)
      setStep("success")
      playSuccess()
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Could not save")
    } finally {
      setSaving(false)
    }
  }

  async function saveAll() {
    setSaving(true)
    setError(null)
    try {
      const chosen = list.filter((f, i) => included[i] && f.company_name.trim())
      if (!chosen.length) throw new Error("Add a company name to at least one internship, and keep it checked.")
      for (const f of chosen) {
        await createInternship(toPayload(f))
      }
      setSavedId(null)
      setSavedCount(chosen.length)
      setStep("success")
      playSuccess()
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Could not save")
    } finally {
      setSaving(false)
    }
  }

  const upd = (k: keyof NewInternship, v: any) => setForm((f) => ({ ...f, [k]: v }))
  const updList = (idx: number, k: keyof NewInternship, v: any) =>
    setList((l) => l.map((f, i) => (i === idx ? { ...f, [k]: v } : f)))
  const toggleInc = (idx: number) => setIncluded((a) => a.map((v, i) => (i === idx ? !v : v)))
  const includedCount = included.filter(Boolean).length

  return (
    <div className="iq-modal-scrim is-open" onClick={(e) => e.target === e.currentTarget && close()}>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickPoster} />
      {step === "method" && (
        <div className="iq-modal">
          <div className="iq-modal__head">
            <h3>Add Internship</h3>
            <button className="iq-modal__x" onClick={close}>✕</button>
          </div>
          <div className="iq-modal__body">
            {error && (
              <div className="mb-6">
                <AiErrorState message={error} onRetry={() => setError(null)} />
              </div>
            )}
            <p className="muted mb-6">Choose how you want to add it.</p>
            <div className="iq-grid iq-grid--2">
              <button className="iq-method" onClick={() => { setMode("poster"); fileRef.current?.click() }}>
                <span className="iq-method__ic" style={csx("background:var(--pink-15);color:var(--pink-text)")}>
                  <Icon name="ic-upload" />
                </span>
                <b>Upload Poster</b>
                <span className="muted">One or more images / screenshots</span>
              </button>
              <button className="iq-method" onClick={() => { setMode("link"); setStep("review"); setForm(EMPTY) }}>
                <span className="iq-method__ic" style={csx("background:var(--blue-15);color:var(--blue-text)")}>
                  <Icon name="ic-link" />
                </span>
                <b>Paste Link</b>
                <span className="muted">LinkedIn / website</span>
              </button>
              <button className="iq-method" onClick={() => { setMode("jd"); setStep("review"); setForm(EMPTY) }}>
                <span className="iq-method__ic" style={csx("background:var(--yellow-15);color:var(--yellow-text)")}>
                  <Icon name="ic-doc" />
                </span>
                <b>Paste JD</b>
                <span className="muted">Copy and paste the text</span>
              </button>
              <button className="iq-method" onClick={() => { setMode("manual"); setStep("review"); setForm(EMPTY) }}>
                <span className="iq-method__ic" style={csx("background:var(--green-15);color:var(--green-text)")}>
                  <Icon name="ic-edit" />
                </span>
                <b>Fill Manually</b>
                <span className="muted">Type it yourself</span>
              </button>
            </div>
            <p className="muted mt-4" style={csx("font-size:12px")}>
              Tip: with Upload Poster you can select several images at once — combine them into one posting, or turn each poster into its own internship.
            </p>
          </div>
        </div>
      )}

      {step === "extracting" && (
        <div className="iq-modal" style={csx("max-width:440px")}>
          <div className="iq-modal__body center">
            <div className="iq-loader-ring mb-6" />
            <HeroMascot src="/mascot-loading.png" size={120} className="mb-4 iq-modal__mascot" />
            <h3 className="mb-2">Reading the details…</h3>
            <p className="muted">One moment, AI is putting the posting details together.</p>
          </div>
        </div>
      )}

      {step === "posterMode" && (
        <div className="iq-modal" style={csx("max-width:480px")}>
          <div className="iq-modal__head">
            <h3>How should we add these?</h3>
            <button className="iq-modal__x" onClick={close}>✕</button>
          </div>
          <div className="iq-modal__body">
            {error && <p className="iq-inline-note" style={csx("margin-bottom:12px")}>{error}</p>}
            <p className="muted mb-6">You uploaded {posterUrls.length} images. Are they for one internship or several?</p>
            <div className="stack-4">
              <button className="iq-method" style={csx("text-align:left")} onClick={() => runExtractMulti(posterUrls, "merge")}>
                <span className="iq-method__ic" style={csx("background:var(--blue-15);color:var(--blue-text)")}>
                  <Icon name="ic-list" />
                </span>
                <b>One internship</b>
                <span className="muted">Combine all screenshots into a single posting</span>
              </button>
              <button className="iq-method" style={csx("text-align:left")} onClick={() => runExtractMulti(posterUrls, "separate")}>
                <span className="iq-method__ic" style={csx("background:var(--pink-15);color:var(--pink-text)")}>
                  <Icon name="ic-copy" />
                </span>
                <b>Several internships</b>
                <span className="muted">Each poster becomes its own entry in your list</span>
              </button>
            </div>
            <div className="row mt-6" style={csx("justify-content:flex-end")}>
              <button className="iq-btn iq-btn--ghost" onClick={() => { setError(null); setStep("method") }}>Back</button>
            </div>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="iq-modal">
          <div className="iq-modal__head">
            <h3>{mode === "manual" ? "Fill in the details" : "Review & Save"}</h3>
            <button className="iq-modal__x" onClick={close}>✕</button>
          </div>
          <div className="iq-modal__body">
            {error && <p className="iq-inline-note" style={csx("margin-bottom:12px")}>{error}</p>}
            {(mode === "link" || mode === "jd") && (
              <div className="iq-form-row">
                <label>{mode === "link" ? "Paste the posting link" : "Paste the job description text"}</label>
                <textarea
                  className="iq-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={mode === "link" ? "https://…" : "Paste the JD here…"}
                />
                <button
                  className="iq-btn iq-btn--blue iq-btn--sm mt-2"
                  onClick={() => {
                    const val = text.trim()
                    if (mode === "link") {
                      if (!val) { setError("Please paste the posting link first."); return }
                      if (!/^https?:\/\/.+\..+/i.test(val)) { setError("That doesn't look like a valid link. Paste a full URL that starts with https://"); return }
                    } else if (!val) {
                      setError("Please paste the job description text first."); return
                    }
                    setError(null)
                    runExtract(mode === "link" ? { source_url: val } : { text: val })
                  }}
                >
                  <Icon name="ic-ai" className="ic ic-16" /> Read with AI
                </button>
                {mode === "link" && (
                  <p className="muted mt-2" style={csx("font-size:12px")}>
                    Note: LinkedIn often blocks automatic reading. If the result is incomplete, use the Paste JD option and copy in the posting text.
                  </p>
                )}
              </div>
            )}
            <div className="iq-grid iq-grid--2">
              <div className="iq-form-row"><label>Company</label><input className="iq-input" value={form.company_name} onChange={(e) => upd("company_name", e.target.value)} /></div>
              <div className="iq-form-row"><label>Role</label><input className="iq-input" value={form.role || ""} onChange={(e) => upd("role", e.target.value)} /></div>
              <div className="iq-form-row"><label>Location</label><input className="iq-input" value={form.location || ""} onChange={(e) => upd("location", e.target.value)} /></div>
              <div className="iq-form-row"><label>Registration opens</label><input className="iq-input" type="date" value={form.open_date || ""} onChange={(e) => upd("open_date", e.target.value)} /></div>
              <div className="iq-form-row">
                <label>Deadline type</label>
                <select className="iq-select" value={form.deadline_type || "date"} onChange={(e) => upd("deadline_type", e.target.value)}>
                  {DEADLINE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              {(form.deadline_type || "date") === "date" ? (
                <div className="iq-form-row"><label>Registration closes / Deadline</label><input className="iq-input" type="date" value={form.deadline || ""} onChange={(e) => upd("deadline", e.target.value)} /></div>
              ) : (
                <div className="iq-form-row"><label>Timing note (optional)</label><input className="iq-input" value={form.timing_note || ""} onChange={(e) => upd("timing_note", e.target.value)} placeholder="e.g. around late June / apply soon" /></div>
              )}
              <div className="iq-form-row"><label>Internship start</label><input className="iq-input" type="date" value={form.start_date || ""} onChange={(e) => upd("start_date", e.target.value)} /></div>
              <div className="iq-form-row"><label>Duration (months)</label><input className="iq-input" type="number" value={form.duration_months ?? ""} onChange={(e) => upd("duration_months", e.target.value)} /></div>
            </div>
            <div className="iq-form-row"><label>Application link (optional)</label><input className="iq-input" value={form.source_url || ""} onChange={(e) => upd("source_url", e.target.value)} placeholder="https://… apply / register link" /></div>
            <div className="iq-form-row"><label>Notes / Requirements</label><textarea className="iq-textarea" value={form.notes || ""} onChange={(e) => upd("notes", e.target.value)} /></div>
            <div className="row" style={csx("justify-content:flex-end;gap:10px")}>
              <button className="iq-btn iq-btn--ghost" onClick={close}>Cancel</button>
              <button className="iq-btn iq-btn--primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "reviewList" && (
        <div className="iq-modal">
          <div className="iq-modal__head">
            <h3>Review {list.length} internships</h3>
            <button className="iq-modal__x" onClick={close}>✕</button>
          </div>
          <div className="iq-modal__body">
            {error && <p className="iq-inline-note" style={csx("margin-bottom:12px")}>{error}</p>}
            <p className="muted mb-4">We read {list.length} posters. Uncheck any you don't want, tweak the details, then save them all at once.</p>
            <div className="stack-4">
              {list.map((f, idx) => (
                <div key={idx} className="iq-card iq-card__pad" style={csx(included[idx] ? "" : "opacity:0.55")}>
                  <div className="row-between mb-4" style={csx("gap:10px")}>
                    <label className="row" style={csx("gap:8px;font-weight:700;cursor:pointer")}>
                      <input type="checkbox" checked={included[idx] !== false} onChange={() => toggleInc(idx)} />
                      Poster {idx + 1}
                    </label>
                  </div>
                  <div className="iq-grid iq-grid--2">
                    <div className="iq-form-row"><label>Company</label><input className="iq-input" value={f.company_name} onChange={(e) => updList(idx, "company_name", e.target.value)} /></div>
                    <div className="iq-form-row"><label>Role</label><input className="iq-input" value={f.role || ""} onChange={(e) => updList(idx, "role", e.target.value)} /></div>
                    <div className="iq-form-row">
                      <label>Deadline type</label>
                      <select className="iq-select" value={f.deadline_type || "date"} onChange={(e) => updList(idx, "deadline_type", e.target.value)}>
                        {DEADLINE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                      </select>
                    </div>
                    {(f.deadline_type || "date") === "date" ? (
                      <div className="iq-form-row"><label>Deadline</label><input className="iq-input" type="date" value={f.deadline || ""} onChange={(e) => updList(idx, "deadline", e.target.value)} /></div>
                    ) : (
                      <div className="iq-form-row"><label>Timing note (optional)</label><input className="iq-input" value={f.timing_note || ""} onChange={(e) => updList(idx, "timing_note", e.target.value)} placeholder="e.g. secepatnya" /></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="row mt-6" style={csx("justify-content:flex-end;gap:10px")}>
              <button className="iq-btn iq-btn--ghost" onClick={close}>Cancel</button>
              <button className="iq-btn iq-btn--primary" onClick={saveAll} disabled={saving || includedCount === 0}>
                {saving ? "Saving…" : "Save " + includedCount + (includedCount === 1 ? " internship" : " internships")}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="iq-modal" style={csx("max-width:440px")}>
          <div className="iq-modal__body center">
            <HeroMascot src="/mascot-success.png" size={120} className="mb-4" />
            <h3 className="mb-2">{savedCount > 1 ? savedCount + " internships added!" : "Internship added!"}</h3>
            <p className="muted mb-6">Nice one. {savedCount > 1 ? "They are" : "It is"} saved to your list — time to build your checklist and chase those deadlines.</p>
            <div className="row" style={csx("gap:10px;justify-content:center")}>
              <button className="iq-btn iq-btn--ghost" onClick={close}>Close</button>
              {savedId ? (
                <button
                  className="iq-btn iq-btn--primary"
                  onClick={() => { const id = savedId; close(); if (id) router.push("/internships/" + id) }}
                >
                  View internship
                </button>
              ) : (
                <button
                  className="iq-btn iq-btn--primary"
                  onClick={() => { close(); router.push("/internships") }}
                >
                  Go to list
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
