"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateInternshipStatus } from "@/app/actions/internships"
import { STATUSES } from "@/lib/helpers"

const NEXT: Record<string, { to: string; label: string }> = {
  todo: { to: "applied", label: "Tandai sudah Apply" },
  applied: { to: "interview", label: "Masuk tahap Interview" },
  interview: { to: "offer", label: "Dapat Offer! 🎉" },
}

export function StatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const next = NEXT[status]

  function set(to: string) {
    start(async () => {
      await updateInternshipStatus(id, to)
      router.refresh()
    })
  }

  return (
    <div className="stack-2 mt-6">
      {next && (
        <button className="iq-btn iq-btn--green iq-btn--block" disabled={pending} onClick={() => set(next.to)}>
          {next.label}
        </button>
      )}
      <select className="iq-select" value={status} onChange={(e) => set(e.target.value)} disabled={pending}>
        {STATUSES.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
    </div>
  )
}
