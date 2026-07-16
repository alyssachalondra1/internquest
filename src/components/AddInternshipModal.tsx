"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { HeroMascot } from "@/components/HeroMascot"
import { AiErrorState } from "@/components/AiErrorState"
import { createClient } from "@/lib/supabase/client"
import { createInternship, type NewInternship } from "@/app/actions/internships"
import { csx } from "@/lib/csx"

type Step = "method" | "extracting" | "review" | "success"
type Mode = "poster" | "ig" | "link" | "jd" | "manual"

const EMPTY: NewInternship = {
  company_name: "",
  role: "",
  location: "",
  work_type: "",
  is_paid: false,
  open_date: "",
  deadline: "",
  start_date: "",
  duration_months: null,
  notes: "",
  poster_url: null,
  source_url: null,
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

  if (!open) return null

  function reset() {
    setStep("method")
    setForm(EMPTY)
    setText("")
    setError(null)
    setSavedId(null)
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
      const d = json.data || {}
      setForm({
        ...EMPTY,
        company_name: d.company_name || "",
        role: d.role || "",
        location: d.location || "",
        work_type: d.work_type || "",
        is_paid: !!d.is_paid,
        open_date: d.open_date || "",
        deadline: d.deadline || "",
        start_date: d.start_date || "",
        duration_months: d.duration_months || null,
        notes: d.notes || "",
        poster_url: payload.poster_url || null,
        source_url: d.source_url || payload.source_url || null,
      })
      if (json.warning) setError(json.warning)
      setStep("review")
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
      setStep("method")
    }
  }

  async function onPickPoster(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStep("extracting")
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Your session has expired, please log in again")
      const blob = await compressImage(file)
      const path = user.id + "/" + Date.now() + ".jpg"
      const up = await supabase.storage
        .from("posters")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true })
      if (up.error) throw new Error(up.error.message)
      const { data: pub } = supabase.storage.from("posters").getPublicUrl(path)
      await runExtract({ poster_url: pub.publicUrl })
    } catch (e: any) {
      setError(e?.message || "Upload failed")
      setStep("method")
    }
  }

  async function save() {
    setSaving(true)
    try {
      if (!form.company_name.trim()) throw new Error("Company name is required")
      if (form.source_url && form.source_url.trim() && !/^https?:\/\/.+/i.test(form.source_url.trim()))
        throw new Error("The application link must start with http:// or https://")
      if (form.open_date && form.deadline && form.deadline < form.open_date)
        throw new Error("The deadline cannot be earlier than the registration open date.")
      const id = await createInternship({
        ...form,
        duration_months: form.duration_months ? Number(form.duration_months) : null,
        open_date: form.open_date || null,
        deadline: form.deadline || null,
        start_date: form.start_date || null,
      })
      setSavedId(id)
      setStep("success")
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Could not save")
    } finally {
      setSaving(false)
    }
  }

  const upd = (k: keyof NewInternship, v: any) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="iq-modal-scrim is-open" onClick={(e) => e.target === e.currentTarget && close()}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPoster} />
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
                <span className="muted">Photo / image of the posting</span>
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
              <div className="iq-form-row"><label>Registration closes / Deadline</label><input className="iq-input" type="date" value={form.deadline || ""} onChange={(e) => upd("deadline", e.target.value)} /></div>
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

      {step === "success" && (
        <div className="iq-modal" style={csx("max-width:440px")}>
          <div className="iq-modal__body center">
            <HeroMascot src="/mascot-success.png" size={120} className="mb-4" />
            <h3 className="mb-2">Internship added!</h3>
            <p className="muted mb-6">Nice one. It is saved to your list — time to build your checklist and chase that deadline.</p>
            <div className="row" style={csx("gap:10px;justify-content:center")}>
              <button className="iq-btn iq-btn--ghost" onClick={close}>Close</button>
              <button
                className="iq-btn iq-btn--primary"
                onClick={() => { const id = savedId; close(); if (id) router.push("/internships/" + id) }}
              >
                View internship
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
