import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GroupDetailClient } from "@/components/GroupDetailClient"

export const dynamic = "force-dynamic"

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: group } = await supabase
    .from("study_groups")
    .select("id, name, join_code, owner_id, created_at")
    .eq("id", id)
    .maybeSingle()
  if (!group) notFound()

  const { data: members } = await supabase.rpc("group_members_view", { p_group: id })
  const { data: internships } = await supabase
    .from("group_internships")
    .select("*")
    .eq("group_id", id)
    .order("created_at", { ascending: false })

  return (
    <GroupDetailClient
      group={group}
      members={members || []}
      internships={internships || []}
      currentUserId={user.id}
    />
  )
}
