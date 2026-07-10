"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function saveGeneration(input: {
  internship_id?: string | null
  answer_type: string
  tone?: string
  length?: string
  content: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from("ai_generations").insert({
    user_id: user.id,
    internship_id: input.internship_id ?? null,
    answer_type: input.answer_type,
    tone: input.tone ?? null,
    length: input.length ?? null,
    content: input.content,
    model: "gemini-3.5-flash",
  })
  revalidatePath("/ai")
}
