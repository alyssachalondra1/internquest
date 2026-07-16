"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Momo } from "@/components/Momo"
import { HeroMascot } from "@/components/HeroMascot"
import { Icon } from "@/components/Icons"
import { createClient } from "@/lib/supabase/client"
import { csx } from "@/lib/csx"

const TAGLINES = [
  "Your AI companion for the internship hunt",
  "Manage every application in one place",
  "Write a motivation letter in seconds",
  "Level up every time you apply",
]

// One custom illustration per slide (transparent PNG, square, ~512x512).
// Order matches TAGLINES above.
const SLIDE_IMAGES = [
  "/mascot-auth-1.png",
  "/mascot-auth-2.png",
  "/mascot-auth-3.png",
  "/mascot-auth-4.png",
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

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get("mode") === "signup") {
      setMode("signup")
      setStep("password")
    }
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
      setMsg("Please enter your email and password first.")
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
        setMsg("Account created. Check your email to verify, then sign in again.")
        setMode("signin")
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) {
        setMsg("Incorrect email or password.")
        return
      }
      router.push("/dashboard")
      router.refresh()
    }
  }

  async function emailLink() {
    setMsg(null)
    if (!email.trim()) {
      setMsg("Please enter your email first.")
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
      <div className="iq-auth__hero" style={csx("background:linear-gradient(180deg,#CFE6FF 0%,#E9F3FF 55%,#FFFFFF 100%)")}>
        <span className="iq-wordmark" style={csx("font-size:28px")}>Sloe</span>
        <div key={"tag-" + slide} className="iq-auth__tag iq-slidein" style={csx("min-height:28px")}>{TAGLINES[slide]} 🦥</div>
        <HeroMascot key={"slide-" + slide} src={SLIDE_IMAGES[slide]} size={200} className="iq-auth__mascot iq-slidein" />
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
              <div className="iq-peek"><HeroMascot src="/mascot-quest.png" size={120} /></div>
              <div className="iq-peekcard">
                <h1 style={csx("font-size:26px;margin-bottom:6px;text-align:center")}>Welcome!</h1>
                <p className="muted mb-6" style={csx("text-align:center")}>Sign in to keep hunting for internships.</p>
                <button className="iq-authbtn" onClick={google} disabled={loading}>
                  <b style={csx("color:#4285F4;font-size:17px")}>G</b> Continue with Google
                </button>
                <button className="iq-authbtn" onClick={() => { setStep("password"); setMsg(null) }}>
                  <Icon name="ic-user" /> Sign in with Email &amp; Password
                </button>
                <div className="iq-divider-or">or</div>
                <button className="iq-authbtn" onClick={() => { setStep("magic"); setMsg(null) }}>
                  <Icon name="ic-doc" /> Send a login link to my email
                </button>
              </div>
            </div>
          )}

          {step === "password" && (
            <div className="iq-auth__step is-active">
              <button className="row muted" style={csx("font-weight:700;margin-bottom:16px")} onClick={() => setStep("welcome")}>
                <Icon name="ic-back" className="ic ic-18" /> Back
              </button>
              <h1 style={csx("font-size:26px;margin-bottom:8px")}>{mode === "signup" ? "Create Account" : "Sign In"}</h1>
              <p className="muted mb-6">
                {mode === "signup" ? "Sign up with your email and password." : "Sign in with your email and password."}
              </p>
              {mode === "signup" && (
                <div className="iq-form-row"><label>Name</label><input className="iq-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} /></div>
              )}
              <div className="iq-form-row"><label>Email</label><input className="iq-input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="iq-form-row"><label>Password</label><input className="iq-input" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && passwordAuth()} /></div>
              {msg && <p style={csx("color:var(--red-text);margin-bottom:8px;font-size:13px")}>{msg}</p>}
              <button className="iq-btn iq-btn--primary iq-btn--block mt-2" onClick={passwordAuth} disabled={loading}>
                {loading ? "Working…" : mode === "signup" ? "Sign Up" : "Sign In"}
              </button>
              <p className="muted center mt-4" style={csx("font-size:13px")}>
                {mode === "signup" ? "Already have an account? " : "Do not have an account yet? "}
                <button className="iq-link" style={csx("display:inline;color:var(--blue-text);font-weight:700")} onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMsg(null) }}>
                  {mode === "signup" ? "Sign in here" : "Sign up here"}
                </button>
              </p>
            </div>
          )}

          {step === "magic" && (
            <div className="iq-auth__step is-active">
              <button className="row muted" style={csx("font-weight:700;margin-bottom:16px")} onClick={() => setStep("welcome")}>
                <Icon name="ic-back" className="ic ic-18" /> Back
              </button>
              <h1 style={csx("font-size:26px;margin-bottom:8px")}>Login Link</h1>
              <p className="muted mb-6">We will send a login link to your email.</p>
              {sent ? (
                <div className="iq-callout" style={csx("background:var(--green-15);border-color:var(--green-40)")}>
                  <div><b>Check your email! ✉️</b><p className="mt-2">A login link has been sent to {email}.</p></div>
                </div>
              ) : (
                <>
                  <div className="iq-form-row"><label>Name</label><input className="iq-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div className="iq-form-row"><label>Email</label><input className="iq-input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  {msg && <p style={csx("color:var(--red-text);margin-bottom:8px;font-size:13px")}>{msg}</p>}
                  <button className="iq-btn iq-btn--primary iq-btn--block mt-2" onClick={emailLink} disabled={loading}>
                    {loading ? "Sending…" : "Send login link"}
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
