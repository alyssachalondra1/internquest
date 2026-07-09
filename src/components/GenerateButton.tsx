"use client"
import { useState } from "react"

export function GenerateButton({
  type,
  context,
}: {
  type: string
  context: unknown
}) {
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, context }),
    })
    const data = await res.json()
    setOutput(data.output ?? data.error ?? "")
    setLoading(false)
  }

  return (
    <div>
      <button type="button" onClick={generate} disabled={loading}>
        {loading ? "Membuat..." : "Generate"}
      </button>
      {output && (
        <textarea value={output} readOnly rows={10} />
      )}
    </div>
  )
}