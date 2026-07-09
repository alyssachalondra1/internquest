import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { addInternship } from "./actions"

export default async function InternshipsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: internships } = await supabase
    .from("internships")
    .select("*")
    .order("deadline", { ascending: true })

  return (
    <main>
      <h1>Internship-ku</h1>

      <form action={addInternship}>
        <input name="company_name" placeholder="Nama perusahaan" required />
        <input name="role" placeholder="Posisi" />
        <button type="submit">Tambah</button>
      </form>

      <ul>
        {internships?.map((item) => (
          <li key={item.id}>
            <strong>{item.company_name}</strong> — {item.role}{" "}
            <em>({item.status})</em>
          </li>
        ))}
      </ul>
    </main>
  )
}