"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { csx } from "@/lib/csx"

export function DeleteAccountButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function remove() {
    const yes = confirm(
      "Yakin hapus akun? Semua data (internship, CV, progres, gems) dihapus permanen dan tidak bisa dikembalikan.",
    )
    if (!yes) return
    setErr(null)
    setBusy(true)
    try {
      const res = await fetch("/api/delete-account", { method: "POST" })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        router.push("/login")
        router.refresh()
      } else {
        setErr(json.error || "Gagal menghapus akun. Coba lagi.")
        setBusy(false)
      }
    } catch {
      setErr("Gagal menghubungi server. Coba lagi.")
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        className="iq-btn iq-btn--ghost iq-btn--sm"
        onClick={remove}
        disabled={busy}
        style={csx("color:var(--red-text);border-color:var(--red-40)")}
      >
        {busy ? "Menghapus..." : "Hapus akun & semua data"}
      </button>
      {err && (
        <p className="mt-2" style={csx("color:var(--red-text);font-size:12px")}>
          {err}
        </p>
      )}
    </div>
  )
}
