import Link from "next/link"
import { csx } from "@/lib/csx"

export const metadata = { title: "Privacy Policy" }

export default function PrivacyPage() {
  return (
    <main style={csx("max-width:780px;margin:0 auto;padding:48px 20px;line-height:1.7")}>
      <p><Link href="/">Back to Sloe</Link></p>
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: July 15, 2026</p>

      <p>This Privacy Policy explains how Sloe ("Sloe", "we", "us", or "our") collects, uses, and protects your information when you use our website and app (the "Service"). Sloe helps students find, track, and apply to internships. By using the Service, you agree to the practices described here.</p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><b>Account information:</b> your name and email address, provided when you sign up with email or Google.</li>
        <li><b>Profile content:</b> details you add such as interests, your uploaded CV/resume file and its extracted text, and portfolio information.</li>
        <li><b>Internship data:</b> the internships, links, posters, deadlines, checklists, notes, and application status you save.</li>
        <li><b>Groups content:</b> internship groups you create or join and the opportunities you share within them.</li>
        <li><b>AI inputs and outputs:</b> the prompts, details, and CV content you submit for AI writing, and the text the AI returns.</li>
        <li><b>Gamification data:</b> your XP, level, gems, streaks, and achievements.</li>
        <li><b>Technical data:</b> basic log and device information needed to operate and secure the Service.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide and maintain the Service, including your account and saved data.</li>
        <li>To read internship postings you upload or paste and pre-fill their details for you.</li>
        <li>To generate AI writing tailored to the details and CV you provide.</li>
        <li>To operate gamification features such as levels, streaks, gems, and achievements.</li>
        <li>To secure the Service, prevent abuse, and comply with legal obligations.</li>
      </ul>

      <h2>3. AI processing</h2>
      <p>When you use an AI feature, the information you submit (such as the company, role, additional context, and relevant CV content) is sent to our AI provider to generate the requested text. AI output is a draft and may contain errors; you are responsible for reviewing it before use. We do not use your content to train third-party foundation models.</p>

      <h2>4. Third-party services</h2>
      <p>We rely on trusted providers to run Sloe, and share data with them only as needed to deliver the features you use:</p>
      <ul>
        <li><b>Supabase</b> - authentication, database, and file storage.</li>
        <li><b>Google Gemini API</b> - generates AI text from the prompt and CV content you submit.</li>
        <li><b>Vercel</b> - application hosting and delivery.</li>
        <li><b>Resend</b> - sending account-related emails (such as sign-in confirmations).</li>
      </ul>

      <h2>5. Data sharing</h2>
      <p>We do not sell your personal information. We share data only with the providers above, when required by law, or to protect the rights and safety of our users and the Service. Content you post into a group is visible to other members of that group.</p>

      <h2>6. Data retention and deletion</h2>
      <p>We keep your data while your account is active. You can delete your account at any time from Settings; this permanently removes your profile, saved internships, uploads, AI history, and related data, except where we must retain limited records to meet legal obligations.</p>

      <h2>7. Security</h2>
      <p>We use reputable infrastructure providers and reasonable technical measures to protect your data, including encrypted connections and access controls. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.</p>

      <h2>8. Children's privacy</h2>
      <p>Sloe is intended for students who are old enough to consent to use online services in their country. It is not directed to children under 13, and we do not knowingly collect their data. If you believe a child has provided us data, please contact us so we can remove it.</p>

      <h2>9. Your rights</h2>
      <p>Depending on where you live, you may have the right to access, correct, export, or delete your personal data. You can manage most of this directly in the app, or contact us for help.</p>

      <h2>10. International transfers</h2>
      <p>Our providers may process and store data in countries other than yours. Where required, we rely on appropriate safeguards for such transfers.</p>

      <h2>11. Cookies</h2>
      <p>We use only essential cookies required to keep you signed in. We do not use advertising or third-party tracking cookies.</p>

      <h2>12. Changes to this policy</h2>
      <p>We may update this policy from time to time. We will revise the "Last updated" date above, and significant changes may be highlighted in the app.</p>

      <h2>13. Contact</h2>
      <p>Questions about this policy? Email <a href="mailto:support@sloe.my.id">support@sloe.my.id</a>.</p>

      <p style={csx("margin-top:32px")}><Link href="/terms">Read our Terms of Service</Link></p>
    </main>
  )
}
