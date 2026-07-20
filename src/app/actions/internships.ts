"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { addXp, addGems, syncAchievementGems } from "./gamification"

const DEFAULT_CHECKLIST = ["CV", "Transcript", "Motivation Letter", "Portfolio"]

// Columns that may not exist yet if the database has not been migrated. If the
// insert fails because one of these is missing, we strip it and retry so saving
// always works.
const OPTIONAL_COLUMNS = ["open_date", "deadline_type", "timing_note"]

export type NewInternship = {
  company_name: string
  role?: string
  location?: string
  work_type?: string
  is_paid?: boolean
  poster_url?: string | null
  source_url?: string | null
  open_date?: string | null
  deadline?: string | null
  deadline_type?: string | null
  timing_note?: string | null
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

  const insertData: Record<string, any> = { ...data, user_id: user.id, status: "todo" }
  let ins = await supabase.from("internships").insert(insertData).select("id").single()
  // Retry while the DB complains about an optional column that hasn't been
  // migrated yet, dropping that column each time.
  let guard = 0
  while (ins.error && guard < OPTIONAL_COLUMNS.length) {
    const msg = ins.error.message || ""
    const col = OPTIONAL_COLUMNS.find((c) => msg.includes(c) && c in insertData)
    if (!col) break
    delete insertData[col]
    ins = await supabase.from("internships").insert(insertData).select("id").single()
    guard++
  }
  if (ins.error) throw new Error(ins.error.message)
  const row = ins.data!

  await supabase.from("checklist_items").insert(
    DEFAULT_CHECKLIST.map((label) => ({
      internship_id: row.id,
      user_id: user.id,
      label,
      is_done: false,
    })),
  )

  await addXp(10)
  await addGems(3)
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
  if (status === "screening") await addXp(40)
  if (status === "test") await addXp(50)
  if (status === "interview") await addXp(75)
  if (status === "offer") await addXp(150)
  if (status === "applied") await addGems(5)
  if (status === "screening") await addGems(5)
  if (status === "test") await addGems(6)
  if (status === "interview") await addGems(10)
  if (status === "offer") await addGems(30)
  // Bonus gems each time the applied count reaches a multiple of 5.
  if (status === "applied") {
    const { count } = await supabase
      .from("internships")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["applied", "interview", "offer"])
    if (count && count % 5 === 0) await addGems(15)
  }
  await syncAchievementGems()
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
  if (isDone) await addGems(2)
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
