"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function saveCv(input: { cv_url: string; cv_text: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from("profiles")
    .update({ cv_url: input.cv_url, cv_text: input.cv_text })
    .eq("id", user.id)
  revalidatePath("/profile")
}

export async function saveInterests(interests: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from("profiles").update({ interests }).eq("id", user.id)
  revalidatePath("/profile")
}

export async function saveAvatar(avatar_url: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from("profiles").update({ avatar_url }).eq("id", user.id)
  revalidatePath("/profile")
  revalidatePath("/", "layout")
}

export async function savePortfolio(input: { portfolio_url: string; portfolio_text: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from("profiles")
    .update({ portfolio_url: input.portfolio_url, portfolio_text: input.portfolio_text })
    .eq("id", user.id)
  revalidatePath("/profile")
}
