"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Questy } from "@/components/Questy"
import { Icon } from "@/components/Icons"
import { createClient } from "@/lib/supabase/client"
import { csx } from "@/lib/csx"

const TAGLINES = [
  "Teman AI-mu untuk berburu magang",
  "Kelola semua lamaran dalam satu tempat",
  "Bikin motivation letter dalam hitungan detik",
  "Naik level tiap kali kamu melamar",
]

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"welcome" | "password" | "magic">("welcome")
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [sent, setSent] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % TAGLINES.length), 3000)
    return () => clearInterval(t)
  }, [])

  async function google() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    })
  }

  async function passwordAuth() {
    setMsg(null)
    if (!email.trim() || !password.trim()) {
      setMsg("Isi email dan kata sandi dulu ya.")
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/auth/callback" },
      })
      setLoading(false)
      if (error) {
        setMsg(error.message)
        return
      }
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setMsg("Akun dibuat. Cek email untuk verifikasi, lalu masuk kembali.")
        setMode("signin")
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) {
        setMsg("Email atau kata sandi salah.")
        return
      }
      router.push("/dashboard")
      router.refresh()
    }
  }

  async function emailLink() {
    setMsg(null)
    if (!email.trim()) {
      setMsg("Isi email dulu ya.")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/auth/callback", data: { full_name: name } },
    })
    setLoading(false)
    if (error) setMsg(error.message)
    else setSent(true)
  }

  return (
    <section className="iq-auth">
      <div className="iq-auth__hero" style={csx("background:var(--blue-15)")}>
        <span style={csx("font-weight:800;font-size:28px;color:var(--blue-text)")}>
          Intern<span style={csx("color:var(--pink-text)")}>Quest</span>
        </span>
        <div className="iq-auth__tag" style={csx("min-height:28px")}>{TAGLINES[slide]} 🦥</div>
        <Questy size={200} />
        <div className="iq-dots">
          {TAGLINES.map((_, i) => (
            <i key={i} className={i === slide ? "on" : ""} />
          ))}
        </div>
      </div>
      <div className="iq-auth__panel">
        <div className="iq-auth__card">
          {step === "welcome" && (
            <div className="iq-auth__step is-active">
              <div className="iq-peek"><Questy size={120} /></div>
              <div className="iq-peekcard">
                <h1 style={csx("font-size:26px;margin-bottom:6px;text-align:center")}>Selamat datang! 👋</h1>
                <p className="muted mb-6" style={csx("text-align:center")}>Masuk untuk lanjut berburu magang.</p>
                <button className="iq-authbtn" onClick={google} disabled={loading}>
                  <b style={csx("color:#4285F4;font-size:17px")}>G</b> Lanjut dengan Google
                </button>
                <button className="iq-authbtn" onClick={() => { setStep("password"); setMsg(null) }}>
                  <Icon name="ic-user" /> Masuk dengan Email &amp; Kata Sandi
                </button>
                <div className="iq-divider-or">atau</div>
                <button className="iq-authbtn" onClick={() => { setStep("magic"); setMsg(null) }}>
                  <Icon name="ic-doc" /> Kirim Tautan Login ke Email
                </button>
              </div>
            </div>
          )}

          {step === "password" && (
            <div className="iq-auth__step is-active">
              <button className="row muted" style={csx("font-weight:700;margin-bottom:16px")} onClick={() => setStep("welcome")}>
                <Icon name="ic-back" className="ic ic-18" /> Kembali
              </button>
              <h1 style={csx("font-size:26px;margin-bottom:8px")}>{mode === "signup" ? "Buat Akun" : "Masuk"}</h1>
              <p className="muted mb-6">
                {mode === "signup" ? "Daftar dengan email dan kata sandi." : "Masuk dengan email dan kata sandi kamu."}
              </p>
              {mode === "signup" && (
                <div className="iq-form-row"><label>Nama</label><input className="iq-input" placeholder="Nama kamu" value={name} onChange={(e) => setName(e.target.value)} /></div>
              )}
              <div className="iq-form-row"><label>Email</label><input className="iq-input" type="email" placeholder="kamu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="iq-form-row"><label>Kata sandi</label><input className="iq-input" type="password" placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && passwordAuth()} /></div>
              {msg && <p style={csx("color:var(--red-text);margin-bottom:8px;font-size:13px")}>{msg}</p>}
              <button className="iq-btn iq-btn--primary iq-btn--block mt-2" onClick={passwordAuth} disabled={loading}>
                {loading ? "Memproses…" : mode === "signup" ? "Daftar" : "Masuk"}
              </button>
              <p className="muted center mt-4" style={csx("font-size:13px")}>
                {mode === "signup" ? "Sudah punya akun? " : "Belum punya akun? "}
                <button className="iq-link" style={csx("display:inline;color:var(--blue-text);font-weight:700")} onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMsg(null) }}>
                  {mode === "signup" ? "Masuk di sini" : "Daftar di sini"}
                </button>
              </p>
            </div>
          )}

          {step === "magic" && (
            <div className="iq-auth__step is-active">
              <button className="row muted" style={csx("font-weight:700;margin-bottom:16px")} onClick={() => setStep("welcome")}>
                <Icon name="ic-back" className="ic ic-18" /> Kembali
              </button>
              <h1 style={csx("font-size:26px;margin-bottom:8px")}>Tautan Login</h1>
              <p className="muted mb-6">Kami kirim tautan login ke emailmu.</p>
              {sent ? (
                <div className="iq-callout" style={csx("background:var(--green-15);border-color:var(--green-40)")}>
                  <div><b>Cek emailmu! ✉️</b><p className="mt-2">Tautan login sudah dikirim ke {email}.</p></div>
                </div>
              ) : (
                <>
                  <div className="iq-form-row"><label>Nama</label><input className="iq-input" placeholder="Nama kamu" value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div className="iq-form-row"><label>Email</label><input className="iq-input" type="email" placeholder="kamu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  {msg && <p style={csx("color:var(--red-text);margin-bottom:8px;font-size:13px")}>{msg}</p>}
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
