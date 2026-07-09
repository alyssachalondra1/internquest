"use client"
import { createClient } from "@/lib/supabase/client"

export function GoogleButton() {
  const supabase = createClient()

  async function login() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <button type="button" onClick={login}>
      Continue with Google
    </button>
  )
}