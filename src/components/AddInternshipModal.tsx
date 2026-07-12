"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { Questy } from "@/components/Questy"
import { createClient } from "@/lib/supabase/client"
import { createInternship, type NewInternship } from "@/app/actions/internships"
import { csx } from "@/lib/csx"

type Step = "method" | "extracting" | "review"

const EMPTY: NewInternship = {
  company_name: "",
  role: "",
  location: "",
  work_type: "",
  is_paid: false,
  deadline: "",
  start_date: "",
  duration_months: null,
  notes: "",
  poster_url: null,
  source_url: null,
}

// Kompres + resize gambar poster sebelum upload agar upload & pembacaan AI jauh lebih cepat.
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
  const [mode, setMode] = useState<"poster" | "link" | "jd" | "manual">("manual")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function reset() {
    setStep("method")
    setForm(EMPTY)
    setText("")
    setError(null)
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
      if (!json.ok) throw new Error(json.error || "Gagal membaca lowongan")
      const d = json.data || {}
      setForm({
        ...EMPTY,
        company_name: d.company_name || "",
        role: d.role || "",
        location: d.location || "",
        work_type: d.work_type || "",
        is_paid: !!d.is_paid,
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
      setError(e?.message || "Terjadi kesalahan")
      setStep("method")
    }
  }

  async function onPickPoster(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setMode("poster")
    setStep("extracting")
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Sesi habis, silakan login lagi")
      const blob = await compressImage(file)
      const path = user.id + "/" + Date.now() + ".jpg"
      const up = await supabase.storage
        .from("posters")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true })
      if (up.error) throw new Error(up.error.message)
      const { data: pub } = supabase.storage.from("posters").getPublicUrl(path)
      await runExtract({ poster_url: pub.publicUrl })
    } catch (e: any) {
      setError(e?.message || "Upload gagal")
      setStep("method")
    }
  }

  async function save() {
    setSaving(true)
    try {
      if (!form.company_name.trim()) throw new Error("Nama perusahaan wajib diisi")
      const id = await createInternship({
        ...form,
        duration_months: form.duration_months ? Number(form.duration_months) : null,
        deadline: form.deadline || null,
        start_date: form.start_date || null,
      })
      close()
      router.push("/internships/" + id)
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const upd = (k: keyof NewInternship, v: any) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="iq-modal-scrim is-open" onClick={(e) => e.target === e.currentTarget && close()}>
      {step === "method" && (
        <div className="iq-modal">
          <div className="iq-modal__head">
            <h3>Add Internship</h3>
            <button className="iq-modal__x" onClick={close}>✕</button>
          </div>
          <div className="iq-modal__body">
            {error && <p style={csx("color:var(--red-text);margin-bottom:12px")}>{error}</p>}
            <p className="muted mb-6">Pilih cara menambahkan.</p>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPoster} />
            <div className="iq-grid iq-grid--2">
              <button className="iq-method" onClick={() => fileRef.current?.click()}>
                <span className="iq-method__ic" style={csx("background:var(--pink-15);color:var(--pink-text)")}>
                  <Icon name="ic-upload" />
                </span>
                <b>Upload Poster</b>
                <span className="muted">Foto / gambar lowongan</span>
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
                <span className="muted">Copy-paste teks</span>
              </button>
              <button className="iq-method" onClick={() => { setMode("manual"); setStep("review"); setForm(EMPTY) }}>
                <span className="iq-method__ic" style={csx("background:var(--green-15);color:var(--green-text)")}>
                  <Icon name="ic-edit" />
                </span>
                <b>Isi Manual</b>
                <span className="muted">Ketik sendiri</span>
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
            <h3 className="mb-2">Membaca informasi…</h3>
            <p className="muted">Sebentar ya, AI sedang menyusun detail lowongan.</p>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="iq-modal">
          <div className="iq-modal__head">
            <h3>{mode === "manual" ? "Isi Detail" : "Review & Save"}</h3>
            <button className="iq-modal__x" onClick={close}>✕</button>
          </div>
          <div className="iq-modal__body">
            {error && <p style={csx("color:var(--red-text);margin-bottom:12px")}>{error}</p>}
            {(mode === "link" || mode === "jd") && (
              <div className="iq-form-row">
                <label>{mode === "link" ? "Tempel link lowongan" : "Tempel teks job description"}</label>
                <textarea
                  className="iq-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={mode === "link" ? "https://…" : "Paste JD di sini…"}
                />
                <button
                  className="iq-btn iq-btn--blue iq-btn--sm mt-2"
                  onClick={() => runExtract(mode === "link" ? { source_url: text } : { text })}
                >
                  <Icon name="ic-ai" className="ic ic-16" /> Baca dengan AI
                </button>
                {mode === "link" && (
                  <p className="muted mt-2" style={csx("font-size:12px")}>
                    Catatan: LinkedIn sering memblokir pembacaan otomatis. Kalau hasilnya kurang lengkap, pakai opsi Tempel JD lalu salin-tempel teks lowongannya.
                  </p>
                )}
              </div>
            )}
            <div className="iq-grid iq-grid--2">
              <div className="iq-form-row"><label>Perusahaan</label><input className="iq-input" value={form.company_name} onChange={(e) => upd("company_name", e.target.value)} /></div>
              <div className="iq-form-row"><label>Posisi</label><input className="iq-input" value={form.role || ""} onChange={(e) => upd("role", e.target.value)} /></div>
              <div className="iq-form-row"><label>Lokasi</label><input className="iq-input" value={form.location || ""} onChange={(e) => upd("location", e.target.value)} /></div>
              <div className="iq-form-row"><label>Deadline</label><input className="iq-input" type="date" value={form.deadline || ""} onChange={(e) => upd("deadline", e.target.value)} /></div>
              <div className="iq-form-row"><label>Mulai magang</label><input className="iq-input" type="date" value={form.start_date || ""} onChange={(e) => upd("start_date", e.target.value)} /></div>
              <div className="iq-form-row"><label>Durasi (bulan)</label><input className="iq-input" type="number" value={form.duration_months ?? ""} onChange={(e) => upd("duration_months", e.target.value)} /></div>
            </div>
            <div className="iq-form-row"><label>Link Pendaftaran (opsional)</label><input className="iq-input" value={form.source_url || ""} onChange={(e) => upd("source_url", e.target.value)} placeholder="https://… tautan daftar/lamar" /></div>
            <div className="iq-form-row"><label>Catatan / Requirements</label><textarea className="iq-textarea" value={form.notes || ""} onChange={(e) => upd("notes", e.target.value)} /></div>
            <div className="row" style={csx("justify-content:flex-end;gap:10px")}>
              <button className="iq-btn iq-btn--ghost" onClick={close}>Batal</button>
              <button className="iq-btn iq-btn--primary" onClick={save} disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
