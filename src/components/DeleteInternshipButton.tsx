"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { deleteInternship } from "@/app/actions/internships"
import { csx } from "@/lib/csx"

export function DeleteInternshipButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function remove() {
    if (!confirm('Hapus "' + name + '"? Tindakan ini tidak bisa dibatalkan.')) return
    start(async () => {
      await deleteInternship(id)
      router.push("/internships")
      router.refresh()
    })
  }

  return (
    <button className="iq-btn iq-btn--ghost iq-btn--sm" style={csx("color:var(--red-text)")} onClick={remove} disabled={pending}>
      <Icon name="ic-logout" className="ic ic-16" /> {pending ? "Menghapus…" : "Hapus internship"}
    </button>
  )
}
