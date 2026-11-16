import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

// Only allow same-site absolute paths as the post-login destination, so an
// attacker-supplied `next` cannot redirect the user off-site (open redirect).
function safeNext(raw: string | null): string {
  if (
    !raw ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(raw)
  ) {
    return "/dashboard"
  }
  return raw
}

// Resolve redirects against the configured canonical site URL so they never
// depend on the request Host header. Falls back to the request origin.
function siteBase(requestOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (!configured) return requestOrigin
  try {
    return new URL(configured).origin
  } catch {
    return requestOrigin
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = safeNext(searchParams.get("next"))
  const base = siteBase(origin)

  const supabase = await createClient()

  // PKCE / OAuth flow (Google, and magic links that deliver a ?code=)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, base))
  }

  // Email OTP / magic link flow (links that deliver ?token_hash=&type=)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) return NextResponse.redirect(new URL(next, base))
  }

  // Anything else: the link was invalid or expired.
  return NextResponse.redirect(new URL("/login?error=auth", base))
}
