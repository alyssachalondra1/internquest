"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function DeleteAccountButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function remove() {
    const yes = confirm("Yakin hapus akun? Semua data (internship, CV, progres) dihapus permanen dan tidak bisa dikembalikan.")
    if (!yes) return
    setBusy(true)
    const res = await fetch("/api/delete-account", { method: "POST" })
    setBusy(false)
    if (res.ok) {
      router.push("/login")
      router.refresh()
    } else {
      alert("Gagal menghapus akun. Coba lagi.")
    }
  }

  return (
    <button type="button" onClick={remove} disabled={busy}>
      {busy ? "Menghapus..." : "Hapus akun & semua data"}
    </button>
  )
}