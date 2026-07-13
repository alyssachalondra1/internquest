import Link from "next/link"
import { csx } from "@/lib/csx"

export const metadata = { title: "Privacy Policy" }

export default function PrivacyPage() {
  return (
    <main style={csx("max-width:780px;margin:0 auto;padding:48px 20px;line-height:1.7")}>
      <p><Link href="/">Back to Sloe</Link></p>
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: July 13, 2026</p>

      <p>Sloe ("we", "us") helps students find, track, and apply to internships. This policy explains what we collect and how we use it.</p>

      <h2>Information we collect</h2>
      <ul>
        <li><b>Account information:</b> your name and email address, obtained when you sign up with email or Google.</li>
        <li><b>Profile content:</b> information you add such as interests, uploaded CV/resume files, and portfolio text.</li>
        <li><b>Internship data:</b> the internships, deadlines, checklists, and notes you save.</li>
        <li><b>Usage data:</b> basic activity needed to run features like streaks, XP, and gems.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To provide and maintain the service (accounts, saved internships, reminders).</li>
        <li>To generate AI writing tailored to the details and CV you provide.</li>
        <li>To operate gamification features (levels, streaks, achievements).</li>
      </ul>

      <h2>Third-party services</h2>
      <p>We rely on trusted providers to run Sloe:</p>
      <ul>
        <li><b>Supabase</b> - authentication, database, and file storage.</li>
        <li><b>Google Gemini API</b> - generates AI text from the prompt and CV content you submit.</li>
        <li><b>Vercel</b> - application hosting.</li>
      </ul>
      <p>Your content is sent to these providers only as needed to deliver the feature you requested.</p>

      <h2>Data retention and deletion</h2>
      <p>Your data is kept while your account is active. You can delete your account at any time from Settings; this permanently removes your profile, saved internships, uploads, and AI history.</p>

      <h2>Cookies</h2>
      <p>We use only essential cookies required to keep you signed in. We do not use advertising cookies.</p>

      <h2>Contact</h2>
      <p>Questions about this policy? Email <a href="mailto:alyssachalondra@student.uns.ac.id">alyssachalondra@student.uns.ac.id</a>.</p>

      <p style={csx("margin-top:32px")}><Link href="/terms">Read our Terms of Service</Link></p>
    </main>
  )
}
