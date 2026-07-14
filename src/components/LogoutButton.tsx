"use client"

import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { createClient } from "@/lib/supabase/client"

export function LogoutButton() {
  const router = useRouter()
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }
  return (
    <button className="iq-btn iq-btn--ghost iq-btn--block" onClick={signOut}>
      <Icon name="ic-logout" className="ic ic-18" /> Log out
    </button>
  )
}
