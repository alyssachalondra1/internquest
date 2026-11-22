import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell, type ProfileStats } from "@/components/AppShell"
import { getUnseenAchievements } from "@/app/actions/gamification"
import { readQuota } from "@/lib/quota"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, level, xp, gems, streak_count, avatar_url")
    .eq("id", user.id)
    .single()

  const { count } = await supabase
    .from("internships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const newAchievements = await getUnseenAchievements()

  // The pill shows the AI balance that actually gets spent: this month's
  // allowance plus any top-up gems. `profiles.gems` alone is only the top-up side.
  const quota = await readQuota(supabase, user.id)

  const stats: ProfileStats = {
    full_name: profile?.full_name ?? user.email ?? "there",
    level: profile?.level ?? 1,
    xp: profile?.xp ?? 0,
    gems: quota.credits,
    streak_count: profile?.streak_count ?? 0,
    avatar_url: profile?.avatar_url ?? null,
  }

  return (
    <AppShell
      profile={stats}
      internshipCount={count ?? 0}
      achievementCount={newAchievements.length}
      newAchievements={newAchievements}
    >
      {children}
    </AppShell>
  )
}
