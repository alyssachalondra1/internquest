import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SignOutButton } from "@/components/SignOutButton"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <main>
      <h1>Halo, {profile?.full_name ?? user.email} 👋</h1>
      <p>
        Level {profile?.level ?? 1} · {profile?.xp ?? 0} XP · 🔥{" "}
        {profile?.streak_count ?? 0} hari
      </p>
      <SignOutButton />
    </main>
  )
}