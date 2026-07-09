"use client"

import { useState } from "react"
import { Questy } from "@/components/Questy"
import { Icon } from "@/components/Icons"
import { createClient } from "@/lib/supabase/client"
import { csx } from "@/lib/csx"

export default function LoginPage() {
  const [step, setStep] = useState<"welcome" | "signup">("welcome")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function google() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    })
  }

  async function emailLink() {
    setMsg(null)
    if (!email.trim()) { setMsg("Isi email dulu ya."); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
        data: { full_name: name },
      },
    })
    setLoading(false)
    if (error) setMsg(error.message)
    else setSent(true)
  }

  return (
    <section className="iq-auth">
      <div className="iq-auth__hero">
        <span style={csx("font-weight:800;font-size:26px;color:#fff")}>
          Intern<span style={csx("color:var(--yellow)")}>Quest</span>
        </span>
        <div className="iq-auth__tag">Your AI companion for internship hunting 🦥</div>
        <Questy size={200} />
        <div className="iq-dots"><i className="on" /><i /><i /><i /></div>
      </div>
      <div className="iq-auth__panel">
        <div className="iq-auth__card">
          {step === "welcome" && (
            <div className="iq-auth__step is-active">
              <div className="iq-peek"><Questy size={120} /></div>
              <div className="iq-peekcard">
                <h1 style={csx("font-size:26px;margin-bottom:6px;text-align:center")}>Welcome back! 👋</h1>
                <p className="muted mb-6" style={csx("text-align:center")}>Masuk untuk lanjut berburu magang.</p>
                <button className="iq-authbtn" onClick={google} disabled={loading}>
                  <b style={csx("color:#4285F4;font-size:17px")}>G</b> Continue with Google
                </button>
                <div className="iq-divider-or">atau</div>
                <button className="iq-authbtn" onClick={() => setStep("signup")}>
                  <Icon name="ic-doc" /> Continue with Email
                </button>
              </div>
            </div>
          )}
          {step === "signup" && (
            <div className="iq-auth__step is-active">
              <button className="row muted" style={csx("font-weight:700;margin-bottom:16px")} onClick={() => setStep("welcome")}>
                <Icon name="ic-back" className="ic ic-18" /> Kembali
              </button>
              <h1 style={csx("font-size:26px;margin-bottom:8px")}>Masuk / Daftar</h1>
              <p className="muted mb-6">Kami kirim tautan ajaib ke emailmu.</p>
              {sent ? (
                <div className="iq-callout" style={csx("background:var(--green-15);border-color:var(--green-40)")}>
                  <div><b>Cek emailmu! ✉️</b><p className="mt-2">Tautan login sudah dikirim ke {email}.</p></div>
                </div>
              ) : (
                <>
                  <div className="iq-form-row"><label>Nama</label><input className="iq-input" placeholder="Alyssa" value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div className="iq-form-row"><label>Email</label><input className="iq-input" placeholder="kamu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  {msg && <p style={csx("color:var(--red-text);margin-bottom:8px")}>{msg}</p>}
                  <button className="iq-btn iq-btn--primary iq-btn--block mt-2" onClick={emailLink} disabled={loading}>
                    {loading ? "Mengirim…" : "Kirim tautan login"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
