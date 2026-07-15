import Link from "next/link"
import { csx } from "@/lib/csx"

export const metadata = { title: "Terms of Service" }

export default function TermsPage() {
  return (
    <main style={csx("max-width:780px;margin:0 auto;padding:48px 20px;line-height:1.7")}>
      <p><Link href="/">Back to Sloe</Link></p>
      <h1>Terms of Service</h1>
      <p className="muted">Last updated: July 15, 2026</p>

      <p>Welcome to Sloe. These Terms of Service ("Terms") govern your use of the Sloe website and app (the "Service"). By creating an account or using the Service, you agree to these Terms. If you do not agree, please do not use the Service.</p>

      <h2>1. Who can use Sloe</h2>
      <p>You must be old enough to consent to use online services in your country. You confirm that the information you provide is accurate and that you use Sloe for your own studies and internship search.</p>

      <h2>2. The service</h2>
      <p>Sloe is a tool that helps students discover, organize, and apply to internships, including optional AI-assisted writing, deadline tracking, checklists, internship groups, and a gamified progress system. The Service is provided for personal, non-commercial use.</p>

      <h2>3. Your account</h2>
      <ul>
        <li>You are responsible for the information you provide and for keeping your login credentials secure.</li>
        <li>You are responsible for activity that happens under your account.</li>
        <li>Notify us promptly if you believe your account has been compromised.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <ul>
        <li>Do not misuse the Service, attempt to break its security, or disrupt its operation.</li>
        <li>Do not use the Service for unlawful purposes or to upload content you do not have the right to share.</li>
        <li>Do not upload harmful, offensive, or infringing content, including into groups.</li>
      </ul>

      <h2>5. AI-generated content</h2>
      <p>AI features produce draft text to assist you. You are responsible for reviewing, editing, and verifying any AI output before you rely on or submit it. Sloe does not guarantee the accuracy, suitability, or originality of generated content and is not responsible for how you use it.</p>

      <h2>6. Your content</h2>
      <p>You keep ownership of the content you upload (such as your CV, notes, and posts). You grant us a limited license to store and process it solely to provide the Service to you and, for group posts, to display them to other members of that group.</p>

      <h2>7. Internship information</h2>
      <p>Internship details read from posters, links, or text may be incomplete or inaccurate. Always confirm deadlines and requirements with the official source before applying. Sloe is not affiliated with the companies or programs you save.</p>

      <h2>8. Virtual items</h2>
      <p>XP, levels, gems, streaks, and achievements exist for motivation and engagement only. They have no monetary value, cannot be exchanged for cash, and may be adjusted or reset as we improve the Service.</p>

      <h2>9. Third-party services and links</h2>
      <p>The Service relies on third-party providers and may link to external sites. We are not responsible for the content or practices of those third parties.</p>

      <h2>10. Availability and changes</h2>
      <p>The Service is offered "as is" and "as available". We may add, change, suspend, or discontinue features at any time, and we do not guarantee uninterrupted or error-free access.</p>

      <h2>11. Disclaimers and limitation of liability</h2>
      <p>To the fullest extent permitted by law, Sloe is provided without warranties of any kind, and we are not liable for any indirect, incidental, or consequential damages, or for the outcomes of your internship applications.</p>

      <h2>12. Termination</h2>
      <p>You may delete your account at any time from Settings. We may suspend or terminate accounts that violate these Terms or misuse the Service.</p>

      <h2>13. Changes to these Terms</h2>
      <p>We may update these Terms from time to time. We will revise the "Last updated" date above, and continued use after changes means you accept the updated Terms.</p>

      <h2>14. Contact</h2>
      <p>Questions? Email <a href="mailto:alyssachalondra@student.uns.ac.id">alyssachalondra@student.uns.ac.id</a>.</p>

      <p style={csx("margin-top:32px")}><Link href="/privacy">Read our Privacy Policy</Link></p>
    </main>
  )
}
