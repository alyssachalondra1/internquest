"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { csx } from "@/lib/csx"

export function MatchCard({
  internshipId,
  initialScore,
  initialReasons,
  hasCv,
}: {
  internshipId: string
  initialScore: number | null
  initialReasons: string | null
  hasCv: boolean
}) {
  const router = useRouter()
  const [score, setScore] = useState<number | null>(initialScore)
  const [reasons, setReasons] = useState<string>(initialReasons || "")
  const [tips, setTips] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internship_id: internshipId }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Gagal menghitung")
      setScore(json.score)
      setReasons(json.reasons || "")
      setTips(json.tips || "")
      router.refresh()
    } catch (e: any) {
      setErr(e?.message || "Gagal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="iq-card iq-card__pad">
      <div className="row mb-4">
        <Icon name="ic-target" className="ic ic-22" style={csx("color:var(--green-text)")} />
        <h3>Kecocokan CV &amp; Minat</h3>
      </div>
      {!hasCv ? (
        <p className="muted">
          Upload CV dulu di halaman <b>Profile</b> agar AI bisa menghitung seberapa cocok kamu dengan lowongan ini.
        </p>
      ) : (
        <>
          {score !== null && (
            <>
              <div className="iq-match__score">{score}%</div>
              <div className="iq-match__bar"><i style={csx("width:" + score + "%")} /></div>
              {reasons && <p className="muted" style={csx("font-size:13px")}>{reasons}</p>}
              {tips && <p className="mt-2" style={csx("font-size:13px;color:var(--blue-text)")}>💡 {tips}</p>}
            </>
          )}
          {score === null && <p className="muted mb-4">Belum dihitung. Klik tombol di bawah untuk cek kecocokan.</p>}
          {err && <p style={csx("color:var(--red-text);font-size:12px;margin-top:6px")}>{err}</p>}
          <button className="iq-btn iq-btn--green iq-btn--block iq-btn--sm mt-4" onClick={run} disabled={loading}>
            <Icon name="ic-ai" className="ic ic-16" /> {loading ? "Menghitung…" : score === null ? "Hitung kecocokan" : "Hitung ulang"}
          </button>
        </>
      )}
    </div>
  )
}
