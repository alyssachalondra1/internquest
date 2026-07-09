import { createClient } from "@/lib/supabase/server"
import { InternshipsClient } from "@/components/InternshipsClient"
import type { Internship } from "@/lib/helpers"

export const dynamic = "force-dynamic"

export default async function InternshipsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: internships } = await supabase
    .from("internships")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  const { data: checks } = await supabase
    .from("checklist_items")
    .select("internship_id, is_done")
    .eq("user_id", user!.id)

  const progress: Record<string, { done: number; total: number; pct: number }> = {}
  for (const it of (internships || []) as Internship[]) {
    const rows = (checks || []).filter((c) => c.internship_id === it.id)
    const done = rows.filter((c) => c.is_done).length
    progress[it.id] = { done, total: rows.length, pct: rows.length ? Math.round((done / rows.length) * 100) : 0 }
  }

  return <InternshipsClient items={(internships || []) as Internship[]} progress={progress} />
}
