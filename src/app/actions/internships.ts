"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { addXp } from "./gamification"

const DEFAULT_CHECKLIST = ["CV", "Transcript", "Motivation Letter", "Portfolio"]

export type NewInternship = {
  company_name: string
  role?: string
  location?: string
  work_type?: string
  is_paid?: boolean
  poster_url?: string | null
  source_url?: string | null
  deadline?: string | null
  start_date?: string | null
  duration_months?: number | null
  notes?: string | null
}

export async function createInternship(data: NewInternship) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: row, error } = await supabase
    .from("internships")
    .insert({ ...data, user_id: user.id, status: "todo" })
    .select("id")
    .single()
  if (error) throw new Error(error.message)

  await supabase.from("checklist_items").insert(
    DEFAULT_CHECKLIST.map((label) => ({
      internship_id: row.id,
      user_id: user.id,
      label,
      is_done: false,
    })),
  )

  await addXp(10)
  revalidatePath("/internships")
  revalidatePath("/dashboard")
  return row.id as string
}

export async function updateInternshipStatus(id: string, status: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await supabase.from("internships").update({ status }).eq("id", id).eq("user_id", user.id)
  if (status === "applied") await addXp(25)
  if (status === "interview") await addXp(50)
  if (status === "offer") await addXp(150)
  revalidatePath("/internships/" + id)
  revalidatePath("/internships")
  revalidatePath("/dashboard")
}

export async function toggleChecklistItem(itemId: string, isDone: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await supabase.from("checklist_items").update({ is_done: isDone }).eq("id", itemId).eq("user_id", user.id)
  if (isDone) await addXp(15)
  revalidatePath("/internships", "layout")
}

export async function addChecklistItem(internshipId: string, label: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await supabase
    .from("checklist_items")
    .insert({ internship_id: internshipId, user_id: user.id, label, is_done: false })
  revalidatePath("/internships/" + internshipId)
}

export async function deleteInternship(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await supabase.from("internships").delete().eq("id", id).eq("user_id", user.id)
  revalidatePath("/internships")
}
