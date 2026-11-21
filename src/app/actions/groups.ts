"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type NewGroupInternship = {
  company_name: string
  role?: string | null
  location?: string | null
  source_url?: string | null
  open_date?: string | null
  deadline?: string | null
  start_date?: string | null
  duration_months?: number | null
  notes?: string | null
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return { supabase, user }
}

export type GroupResult =
  | { ok: true; id: string }
  | { ok: false; error: string; needsUpgrade?: boolean }

/* Business rejections (plan limits) are RETURNED, never thrown: Next replaces any
   error thrown out of a Server Action with a generic "Server Components render"
   message in production, so a thrown limit is indistinguishable from a crash.
   SQL raises GROUP_CREATE_LIMIT / GROUP_JOIN_LIMIT with the plan's allowance. */
function planLimit(message: string): { error: string; needsUpgrade: true } | null {
  const hit = message.match(/^GROUP_(CREATE|JOIN)_LIMIT: your plan allows (?:joining )?(\d+) groups/)
  if (!hit) return null
  const verb = hit[1] === "CREATE" ? "create" : "join"
  return {
    error: `Your current plan lets you ${verb} ${hit[2]} groups and you have used all of them. Delete a group you no longer need, or move to a paid plan.`,
    needsUpgrade: true,
  }
}

export async function createGroup(name: string): Promise<GroupResult> {
  const { supabase } = await requireUser()
  const clean = name.trim()
  if (!clean) return { ok: false, error: "Give the group a name first." }
  const { data, error } = await supabase.rpc("create_group", { p_name: clean })
  if (error) return { ok: false, ...(planLimit(error.message) ?? { error: error.message }) }
  const row = Array.isArray(data) ? data[0] : data
  if (!row?.id) return { ok: false, error: "The group was not created. Please try again." }
  revalidatePath("/groups")
  return { ok: true, id: row.id as string }
}

export async function joinGroup(code: string): Promise<GroupResult> {
  const { supabase } = await requireUser()
  const clean = code.trim().toUpperCase()
  if (!clean) return { ok: false, error: "Enter the code you were given." }
  const { data, error } = await supabase.rpc("join_group_by_code", { p_code: clean })
  if (error) {
    if (/not found/i.test(error.message)) return { ok: false, error: "No group found for that code." }
    return { ok: false, ...(planLimit(error.message) ?? { error: error.message }) }
  }
  revalidatePath("/groups")
  return { ok: true, id: data as string }
}

export async function leaveGroup(groupId: string) {
  const { supabase, user } = await requireUser()
  await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id)
  revalidatePath("/groups")
  redirect("/groups")
}

export async function deleteGroup(groupId: string) {
  const { supabase, user } = await requireUser()
  await supabase.from("study_groups").delete().eq("id", groupId).eq("owner_id", user.id)
  revalidatePath("/groups")
  redirect("/groups")
}

export async function removeMember(groupId: string, memberId: string) {
  const { supabase } = await requireUser()
  await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", memberId)
  revalidatePath("/groups/" + groupId)
}

export async function addGroupInternship(groupId: string, data: NewGroupInternship) {
  const { supabase, user } = await requireUser()
  const insert = { ...data, group_id: groupId, added_by: user.id }
  const { error } = await supabase.from("group_internships").insert(insert)
  if (error) throw new Error(error.message)
  revalidatePath("/groups/" + groupId)
}

export async function deleteGroupInternship(groupId: string, id: string) {
  const { supabase } = await requireUser()
  await supabase.from("group_internships").delete().eq("id", id)
  revalidatePath("/groups/" + groupId)
}

export type PickInternship = {
  id: string
  company_name: string
  role: string | null
  location: string | null
  source_url: string | null
  open_date: string | null
  deadline: string | null
  start_date: string | null
  duration_months: number | null
  notes: string | null
}

// Returns the caller's own private internships so they can copy one into a group.
// Only the internship details are exposed; CV, portfolio, AI output and checklists are never included.
export async function listMyInternships(): Promise<PickInternship[]> {
  const { supabase, user } = await requireUser()
  const { data } = await supabase
    .from("internships")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  return (data || []).map((r: any) => ({
    id: r.id,
    company_name: r.company_name,
    role: r.role ?? null,
    location: r.location ?? null,
    source_url: r.source_url ?? null,
    open_date: r.open_date ?? null,
    deadline: r.deadline ?? null,
    start_date: r.start_date ?? null,
    duration_months: r.duration_months ?? null,
    notes: r.notes ?? null,
  }))
}
