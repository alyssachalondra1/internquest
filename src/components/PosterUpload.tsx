"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Extracted = {
  company_name?: string
  role?: string
  location?: string
  deadline?: string
  start_date?: string
  duration_months?: number
  work_type?: string
  is_paid?: boolean
}

export function PosterUpload() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Extracted | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // 1) upload poster ke Storage
    const path = `${user.id}/${Date.now()}-${file.name}`
    await supabase.storage.from("posters").upload(path, file)
    const {
      data: { publicUrl },
    } = supabase.storage.from("posters").getPublicUrl(path)

    // 2) ubah file jadi base64, kirim ke API extract
    const imageBase64 = await fileToBase64(file)
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType: file.type }),
    })
    const data: Extracted = await res.json()

    // 3) simpan ke tabel internships
    await supabase.from("internships").insert({
      user_id: user.id,
      poster_url: publicUrl,
      company_name: data.company_name ?? "Tanpa nama",
      role: data.role ?? null,
      location: data.location ?? null,
      deadline: data.deadline || null,
      start_date: data.start_date || null,
      duration_months: data.duration_months ?? null,
      work_type: data.work_type ?? null,
      is_paid: data.is_paid ?? null,
      status: "todo",
    })

    setResult(data)
    setLoading(false)
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile} />
      {loading && <p>Membaca poster...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.split(",")[1]) // buang prefix "data:...;base64,"
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}