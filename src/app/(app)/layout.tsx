import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell, type ProfileStats } from "@/components/AppShell"
import { touchStreak, syncAchievementGems } from "@/app/actions/gamification"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await touchStreak()
  await syncAchievementGems()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, level, xp, gems, streak_count, avatar_url")
    .eq("id", user.id)
    .single()

  const { count } = await supabase
    .from("internships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const stats: ProfileStats = {
    full_name: profile?.full_name ?? user.email ?? "there",
    level: profile?.level ?? 1,
    xp: profile?.xp ?? 0,
    gems: profile?.gems ?? 0,
    streak_count: profile?.streak_count ?? 0,
    avatar_url: profile?.avatar_url ?? null,
  }

  return (
    <AppShell profile={stats} internshipCount={count ?? 0}>
      {children}
    </AppShell>
  )
}
