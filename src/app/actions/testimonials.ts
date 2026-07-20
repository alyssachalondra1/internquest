"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type PublicTestimonial = {
  id: string
  display_name: string
  rating: number
  body: string
  created_at: string
}

export async function saveTestimonial(input: {
  displayName: string
  rating: number
  body: string
}) {
  const displayName = (input.displayName || "").trim()
  const body = (input.body || "").trim()
  const rating = Math.round(Number(input.rating))

  if (!displayName) return { ok: false, error: "Please enter a display name." }
  if (!body) return { ok: false, error: "Please write your review first." }
  if (!(rating >= 1 && rating <= 5)) {
    return { ok: false, error: "Please pick a rating from 1 to 5 stars." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Please sign in to leave a review." }

  const { error } = await supabase.from("testimonials").upsert(
    {
      user_id: user.id,
      display_name: displayName.slice(0, 60),
      rating,
      body: body.slice(0, 600),
    },
    { onConflict: "user_id" },
  )
  if (error) return { ok: false, error: error.message }

  revalidatePath("/")
  return { ok: true }
}
