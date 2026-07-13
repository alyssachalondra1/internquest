"use client"

import { useEffect, useRef, useState } from "react"
import { Icon } from "@/components/Icons"
import { Questy } from "@/components/Questy"
import { createClient } from "@/lib/supabase/client"
import { addGroupInternship, listMyInternships, type NewGroupInternship, type PickInternship } from "@/app/actions/groups"
import { csx } from "@/lib/csx"

type Step = "method" | "extracting" | "picker" | "review"
type Mode = "poster" | "link" | "jd" | "manual" | "mine"

type Form = {
  company_name: string
  role: string
  location: string
  source_url: string
  open_date: string
  deadline: string
  start_date: string
  duration_months: string
  notes: string
}

const EMPTY: Form = {
  company_name: "",
  role: "",
  location: "",
  source_url: "",
  open_date: "",
  deadline: "",
  start_date: "",
  duration_months: "",
  notes: "",
}

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
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || file), "image/jpeg", quality))
  } catch {
    return file
  }
}

export function GroupAddModal({
  groupId,
  open,
  onClose,
  onAdded,
}: {
  groupId: string
  open: boolean
  onClose: () => void
  onAdded: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("method")
  const [mode, setMode] = useState<Mode>("manual")
  const [form, setForm] = useState<Form>(EMPTY)
  const [text, setText] = useState("")
  const [mine, setMine] = useState<PickInternship[]>([])
  const [loadingMine, setLoadingMine] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStep("method")
      setMode("manual")
      setForm(EMPTY)
      setText("")
      setError(null)
    }
  }, [open])

  if (!open) return null

  const upd = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  function close() {
    onClose()
  }

  async function openMine() {
    setMode("mine")
    setStep("picker")
    setLoadingMine(true)
    try {
      const rows = await listMyInternships()
      setMine(rows)
    } catch {
      setMine([])
    } finally {
      setLoadingMine(false)
    }
  }

  function pick(it: PickInternship) {
    setForm({
      company_name: it.company_name || "",
      role: it.role || "",
      location: it.location || "",
      source_url: it.source_url || "",
      open_date: it.open_date || "",
      deadline: it.deadline || "",
      start_date: it.start_date || "",
      duration_months: it.duration_months != null ? String(it.duration_months) : "",
      notes: it.notes || "",
    })
    setStep("review")
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
        open_date: d.open_date || "",
        deadline: d.deadline || "",
        start_date: d.start_date || "",
        duration_months: d.duration_months ? String(d.duration_months) : "",
        notes: d.notes || "",
        source_url: d.source_url || payload.source_url || "",
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
      const up = await supabase.storage.from("posters").upload(path, blob, { contentType: "image/jpeg", upsert: true })
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
    setError(null)
    try {
      if (!form.company_name.trim()) throw new Error("Company name is required")
      const data: NewGroupInternship = {
        company_name: form.company_name.trim(),
        role: form.role.trim() || null,
        location: form.location.trim() || null,
        source_url: form.source_url.trim() || null,
        open_date: form.open_date || null,
        deadline: form.deadline || null,
        start_date: form.start_date || null,
        duration_months: form.duration_months ? Number(form.duration_months) : null,
        notes: form.notes.trim() || null,
      }
      await addGroupInternship(groupId, data)
      onAdded()
      close()
    } catch (e: any) {
      setError(e?.message || "Could not save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="iq-modal-scrim is-open" onClick={(e) => e.target === e.currentTarget && close()}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPoster} />

      {step === "method" && (
        <div className="iq-modal">
          <div className="iq-modal__head">
            <h3>Add internship to group</h3>
            <button className="iq-modal__x" onClick={close}>✕</button>
          </div>
          <div className="iq-modal__body">
            {error && <p style={csx("color:var(--red-text);margin-bottom:12px")}>{error}</p>}
            <p className="muted mb-6">Choose how you want to add it. Only the internship details are shared with the group.</p>
            <div className="iq-grid iq-grid--2">
              <button className="iq-method" onClick={openMine}>
                <span className="iq-method__ic" style={csx("background:var(--pink-15);color:var(--pink-text)")}><Icon name="ic-list" /></span>
                <b>From My Internships</b>
                <span className="muted">Pick one you already saved</span>
              </button>
              <button className="iq-method" onClick={() => { setMode("poster"); fileRef.current?.click() }}>
                <span className="iq-method__ic" style={csx("background:var(--yellow-15);color:var(--yellow-text)")}><Icon name="ic-upload" /></span>
                <b>Upload Poster</b>
                <span className="muted">Photo / image of the posting</span>
              </button>
              <button className="iq-method" onClick={() => { setMode("link"); setForm(EMPTY); setText(""); setStep("review") }}>
                <span className="iq-method__ic" style={csx("background:var(--blue-15);color:var(--blue-text)")}><Icon name="ic-link" /></span>
                <b>Paste Link</b>
                <span className="muted">LinkedIn / website</span>
              </button>
              <button className="iq-method" onClick={() => { setMode("jd"); setForm(EMPTY); setText(""); setStep("review") }}>
                <span className="iq-method__ic" style={csx("background:var(--green-15);color:var(--green-text)")}><Icon name="ic-doc" /></span>
                <b>Paste JD</b>
                <span className="muted">Copy and paste the text</span>
              </button>
              <button className="iq-method" onClick={() => { setMode("manual"); setForm(EMPTY); setStep("review") }}>
                <span className="iq-method__ic" style={csx("background:var(--pink-15);color:var(--pink-text)")}><Icon name="ic-edit" /></span>
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
            <Questy size={70} className="mb-4" />
            <h3 className="mb-2">Reading the details…</h3>
            <p className="muted">One moment, AI is putting the posting details together.</p>
          </div>
        </div>
      )}

      {step === "picker" && (
        <div className="iq-modal">
          <div className="iq-modal__head">
            <h3>Pick from your internships</h3>
            <button className="iq-modal__x" onClick={close}>✕</button>
          </div>
          <div className="iq-modal__body">
            <button className="iq-btn iq-btn--ghost iq-btn--sm mb-4" onClick={() => setStep("method")}>
              <Icon name="ic-back" className="ic ic-16" /> Back
            </button>
            {loadingMine ? (
              <p className="muted">Loading your internships…</p>
            ) : mine.length === 0 ? (
              <p className="muted">You have not saved any internships yet.</p>
            ) : (
              <div className="stack-2">
                {mine.map((it) => (
                  <button key={it.id} className="iq-check" style={csx("justify-content:space-between")} onClick={() => pick(it)}>
                    <span>
                      <b>{it.company_name}</b>
                      {it.role ? <span className="muted"> · {it.role}</span> : null}
                    </span>
                    <Icon name="ic-arrow-right" className="ic ic-16" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="iq-modal">
          <div className="iq-modal__head">
            <h3>{mode === "manual" || mode === "mine" ? "Confirm the details" : "Review & Save"}</h3>
            <button className="iq-modal__x" onClick={close}>✕</button>
          </div>
          <div className="iq-modal__body">
            {error && <p style={csx("color:var(--red-text);margin-bottom:12px")}>{error}</p>}
            {(mode === "link" || mode === "jd") && (
              <div className="iq-form-row">
                <label>{mode === "link" ? "Paste the posting link" : "Paste the job description text"}</label>
                <textarea className="iq-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === "link" ? "https://…" : "Paste the JD here…"} />
                <button className="iq-btn iq-btn--blue iq-btn--sm mt-2" onClick={() => runExtract(mode === "link" ? { source_url: text } : { text })}>
                  <Icon name="ic-ai" className="ic ic-16" /> Read with AI
                </button>
              </div>
            )}
            <div className="iq-grid iq-grid--2">
              <div className="iq-form-row"><label>Company</label><input className="iq-input" value={form.company_name} onChange={(e) => upd("company_name", e.target.value)} /></div>
              <div className="iq-form-row"><label>Role</label><input className="iq-input" value={form.role} onChange={(e) => upd("role", e.target.value)} /></div>
              <div className="iq-form-row"><label>Location</label><input className="iq-input" value={form.location} onChange={(e) => upd("location", e.target.value)} /></div>
              <div className="iq-form-row"><label>Registration opens</label><input className="iq-input" type="date" value={form.open_date} onChange={(e) => upd("open_date", e.target.value)} /></div>
              <div className="iq-form-row"><label>Registration closes / Deadline</label><input className="iq-input" type="date" value={form.deadline} onChange={(e) => upd("deadline", e.target.value)} /></div>
              <div className="iq-form-row"><label>Internship start</label><input className="iq-input" type="date" value={form.start_date} onChange={(e) => upd("start_date", e.target.value)} /></div>
              <div className="iq-form-row"><label>Duration (months)</label><input className="iq-input" type="number" value={form.duration_months} onChange={(e) => upd("duration_months", e.target.value)} /></div>
            </div>
            <div className="iq-form-row"><label>Application link (optional)</label><input className="iq-input" value={form.source_url} onChange={(e) => upd("source_url", e.target.value)} placeholder="https://… apply / register link" /></div>
            <div className="iq-form-row"><label>Notes / Requirements</label><textarea className="iq-textarea" value={form.notes} onChange={(e) => upd("notes", e.target.value)} /></div>
            <div className="row" style={csx("justify-content:flex-end;gap:10px")}>
              <button className="iq-btn iq-btn--ghost" onClick={close}>Cancel</button>
              <button className="iq-btn iq-btn--primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Add to group"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
