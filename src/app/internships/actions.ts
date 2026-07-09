"use server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function addInternship(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("internships").insert({
    user_id: user.id,
    company_name: String(formData.get("company_name") ?? ""),
    role: String(formData.get("role") ?? ""),
    status: "todo",
  })
  revalidatePath("/internships")
}

export async function updateStatus(id: string, status: string) {
  const supabase = await createClient()
  await supabase.from("internships").update({ status }).eq("id", id)
  revalidatePath("/internships")
}

export async function deleteInternship(id: string) {
  const supabase = await createClient()
  await supabase.from("internships").delete().eq("id", id)
  revalidatePath("/internships")
}