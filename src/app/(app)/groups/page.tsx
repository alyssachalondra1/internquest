import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GroupsClient } from "@/components/GroupsClient"

export const dynamic = "force-dynamic"

export default async function GroupsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: groups } = await supabase.rpc("my_groups")
  return <GroupsClient groups={groups || []} currentUserId={user.id} />
}
