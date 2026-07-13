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

export async function createGroup(name: string) {
  const { supabase } = await requireUser()
  const clean = name.trim()
  if (!clean) throw new Error("Group name is required")
  const { data, error } = await supabase.rpc("create_group", { p_name: clean })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  revalidatePath("/groups")
  return row?.id as string
}

export async function joinGroup(code: string) {
  const { supabase } = await requireUser()
  const clean = code.trim().toUpperCase()
  if (!clean) throw new Error("Please enter a code")
  const { data, error } = await supabase.rpc("join_group_by_code", { p_code: clean })
  if (error) throw new Error(/not found/i.test(error.message) ? "No group found for that code" : error.message)
  revalidatePath("/groups")
  return data as string
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
