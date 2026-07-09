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
