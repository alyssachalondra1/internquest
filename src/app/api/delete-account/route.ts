import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  // CSRF defense-in-depth: a browser's cross-site POST carries an Origin we can
  // reject. Same-origin requests (and non-browser clients) pass through.
  const origin = request.headers.get("origin")
  if (origin) {
    const requestOrigin = new URL(request.url).origin
    let siteOrigin = requestOrigin
    try {
      if (process.env.NEXT_PUBLIC_SITE_URL) siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
    } catch {
      siteOrigin = requestOrigin
    }
    if (origin !== requestOrigin && origin !== siteOrigin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "not authed" }, { status: 401 })

  // Service-role key lives only in server env (never NEXT_PUBLIC_*) and is used
  // solely in this nodejs route; it is never sent to the client.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error("[delete-account] SUPABASE_SERVICE_ROLE_KEY is not configured")
    return NextResponse.json({ error: "Account deletion is temporarily unavailable." }, { status: 503 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // user.id comes from the verified session, never from the request body, so a
  // caller can only ever delete their own account.
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error("[delete-account] deleteUser failed:", error.message)
    return NextResponse.json({ error: "Could not delete account. Please try again." }, { status: 500 })
  }

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
