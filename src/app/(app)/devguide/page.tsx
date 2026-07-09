import { csx } from "@/lib/csx"

export default function DevGuidePage() {
  return (
    <section className="iq-screen is-active">
      <div className="iq-card iq-card__pad mb-6">
        <h2 style={csx("font-size:20px")} className="mb-2">Dev &amp; Naming Guide</h2>
        <p className="muted">Konvensi route, komponen &amp; data model InternQuest.</p>
      </div>
      <div className="iq-card iq-card__pad mb-6">
        <h3 className="mb-4">1. Routes (App Router)</h3>
        <table className="iq-table">
          <tbody>
            <tr><th>Screen</th><th>Route</th></tr>
            <tr><td>Login / Sign up</td><td><code>/login</code></td></tr>
            <tr><td>Dashboard</td><td><code>/dashboard</code></td></tr>
            <tr><td>Internships</td><td><code>/internships</code></td></tr>
            <tr><td>Internship Detail</td><td><code>/internships/[id]</code></td></tr>
            <tr><td>Calendar</td><td><code>/calendar</code></td></tr>
            <tr><td>AI Assistant</td><td><code>/ai</code></td></tr>
            <tr><td>Achievements</td><td><code>/achievements</code></td></tr>
            <tr><td>Profile</td><td><code>/profile</code></td></tr>
            <tr><td>Settings</td><td><code>/settings</code></td></tr>
          </tbody>
        </table>
      </div>
      <div className="iq-card iq-card__pad mb-6">
        <h3 className="mb-4">2. Status &amp; Enum</h3>
        <table className="iq-table">
          <tbody>
            <tr><th>Enum</th><th>Values</th></tr>
            <tr><td><code>status</code></td><td>todo, applied, interview, offer, rejected, archived</td></tr>
            <tr><td><code>XpEvent</code></td><td>ADD(+10), CHECKLIST(+15), APPLY(+25), INTERVIEW(+50), OFFER(+150)</td></tr>
          </tbody>
        </table>
      </div>
      <div className="iq-card iq-card__pad">
        <h3 className="mb-4">3. Data Model (Supabase)</h3>
        <table className="iq-table">
          <tbody>
            <tr><th>Table</th><th>Field utama</th></tr>
            <tr><td><code>profiles</code></td><td>id, email, full_name, level, xp, gems, streak_count</td></tr>
            <tr><td><code>internships</code></td><td>company_name, role, location, work_type, is_paid, deadline, start_date, duration_months, status, notes</td></tr>
            <tr><td><code>checklist_items</code></td><td>internship_id, label, is_done</td></tr>
            <tr><td><code>ai_generations</code></td><td>internship_id, answer_type, tone, length, content, model</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
