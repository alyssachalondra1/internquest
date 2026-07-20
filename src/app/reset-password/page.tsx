"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Momo } from "@/components/Momo"
import { createClient } from "@/lib/supabase/client"
import { csx } from "@/lib/csx"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // The recovery link signs the user in with a temporary session (handled by
    // /auth/callback) before they land here, so we just confirm a session
    // exists. If it does not, the link was invalid or has expired.
    supabase.auth.getUser().then(({ data }) => {
      setValidSession(!!data.user)
      setReady(true)
    })
    // React to the recovery event in case the session lands a moment later.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setValidSession(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function submit() {
    setMsg(null)
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      setMsg("The two passwords do not match.")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setMsg(error.message)
      return
    }
    setDone(true)
  }

  return (
    <main style={csx("min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(180deg,#CFE6FF 0%,#E9F3FF 55%,#FFFFFF 100%)")}>
      <div className="iq-auth__card" style={csx("width:420px;max-width:100%")}>
        <div className="center mb-4"><Momo size={96} /></div>
        <span className="iq-wordmark" style={csx("display:block;text-align:center;font-size:24px;margin-bottom:6px")}>Sloe</span>

        {!ready ? (
          <p className="muted center">Loading…</p>
        ) : done ? (
          <>
            <h1 style={csx("font-size:24px;text-align:center;margin-bottom:8px")}>Password updated! 🎉</h1>
            <p className="muted center mb-6">Your new password is ready. Let's get back to the hunt.</p>
            <button className="iq-btn iq-btn--primary iq-btn--block" onClick={() => { router.push("/dashboard"); router.refresh() }}>Go to dashboard</button>
          </>
        ) : validSession ? (
          <>
            <h1 style={csx("font-size:24px;text-align:center;margin-bottom:8px")}>Set a new password</h1>
            <p className="muted center mb-6">Choose a new password for your Sloe account.</p>
            <div className="iq-form-row"><label>New password</label><input className="iq-input" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="iq-form-row"><label>Confirm password</label><input className="iq-input" type="password" placeholder="Re-type your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
            {msg && <p style={csx("color:var(--red-text);margin-bottom:8px;font-size:13px")}>{msg}</p>}
            <button className="iq-btn iq-btn--primary iq-btn--block mt-2" onClick={submit} disabled={loading}>{loading ? "Saving…" : "Update password"}</button>
          </>
        ) : (
          <>
            <h1 style={csx("font-size:24px;text-align:center;margin-bottom:8px")}>Link expired</h1>
            <p className="muted center mb-6">This password reset link is invalid or has expired. Please request a new one from the login page.</p>
            <Link className="iq-btn iq-btn--primary iq-btn--block" href="/login">Back to login</Link>
          </>
        )}
      </div>
    </main>
  )
}
