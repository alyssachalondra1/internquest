"use server"

import { createClient } from "@/lib/supabase/server"

/** Award XP to the current user via the add_xp RPC (also recomputes level). */
export async function addXp(amount: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.rpc("add_xp", { p_user: user.id, p_amount: amount })
}

/** Award gems to the current user (read current value, then increment). */
export async function addGems(amount: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase.from("profiles").select("gems").eq("id", user.id).single()
  const current = (data?.gems as number | null) ?? 0
  await supabase.from("profiles").update({ gems: current + amount }).eq("id", user.id)
}

/**
 * Daily streak: counts one visit per calendar day (Asia/Jakarta). Opening the
 * app on consecutive days grows the streak; a missed day resets it to 1.
 * Also grants login gems (20 on the very first visit, +2 each new day).
 * Safe to call on every page load: it only writes once per day.
 */
export async function touchStreak() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from("profiles")
      .select("streak_count, gems, last_active_date")
      .eq("id", user.id)
      .single()
    if (error) return
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
    const last = (data as any)?.last_active_date as string | null
    if (last === today) return
    const prevStreak = (data?.streak_count as number | null) ?? 0
    const prevGems = (data?.gems as number | null) ?? 0
    let streak = 1
    let bonus = 20 // welcome gems on the very first visit
    if (last) {
      const diff = Math.round((Date.parse(today) - Date.parse(last)) / 86400000)
      streak = diff === 1 ? prevStreak + 1 : 1
      bonus = 5 // daily login gems
    }
    // Milestone: every 7-day streak grants a big bonus.
    if (streak > 0 && streak % 7 === 0) bonus += 15
    await supabase
      .from("profiles")
      .update({ streak_count: streak, last_active_date: today, gems: prevGems + bonus })
      .eq("id", user.id)
  } catch {
    // profiles.last_active_date may not exist yet; ignore until migrated
  }
}

/**
 * Achievement gems: grants a one-time gem reward for each newly unlocked badge.
 * The set of already-rewarded badges is stored in profiles.awarded_achievements
 * so gems are never granted twice. Mirrors the badge logic on the Achievements
 * page. Safe to call on page loads and after status changes.
 */
export async function syncAchievementGems() {
  const ACHIEVEMENT_GEMS = 25
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("level, streak_count, gems, awarded_achievements")
      .eq("id", user.id)
      .single()
    if (error) return
    const { data: internships } = await supabase
      .from("internships")
      .select("status")
      .eq("user_id", user.id)
    const { count: genCount } = await supabase
      .from("ai_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
    const items = (internships || []) as Array<{ status: string }>
    const applied = items.filter((i) => ["applied", "interview", "offer"].includes(i.status)).length
    const level = (profile?.level as number | null) ?? 1
    const streak = (profile?.streak_count as number | null) ?? 0
    const gens = genCount ?? 0
    const unlocked: string[] = []
    if (applied >= 1) unlocked.push("First Application")
    if (streak >= 7) unlocked.push("7 Day Streak")
    if (gens >= 10) unlocked.push("Active AI User")
    if (applied >= 10) unlocked.push("10 Applications")
    if (items.some((i) => ["interview", "offer"].includes(i.status))) unlocked.push("Interview Star")
    if (items.some((i) => i.status === "offer")) unlocked.push("Offer Getter")
    if (level >= 10) unlocked.push("Level 10")
    const already = Array.isArray((profile as any)?.awarded_achievements)
      ? ((profile as any).awarded_achievements as string[])
      : []
    const fresh = unlocked.filter((k) => !already.includes(k))
    if (fresh.length === 0) return
    const prevGems = (profile?.gems as number | null) ?? 0
    await supabase
      .from("profiles")
      .update({
        gems: prevGems + fresh.length * ACHIEVEMENT_GEMS,
        awarded_achievements: [...already, ...fresh],
      })
      .eq("id", user.id)
  } catch {
    // profiles.awarded_achievements may not exist yet; ignore until migrated
  }
}
