import Link from "next/link"
import { csx } from "@/lib/csx"

export const metadata = { title: "Terms of Service" }

export default function TermsPage() {
  return (
    <main style={csx("max-width:780px;margin:0 auto;padding:48px 20px;line-height:1.7")}>
      <p><Link href="/">Back to Sloe</Link></p>
      <h1>Terms of Service</h1>
      <p className="muted">Last updated: July 13, 2026</p>

      <p>By creating an account or using Sloe (the "Service"), you agree to these Terms. If you do not agree, please do not use the Service.</p>

      <h2>The service</h2>
      <p>Sloe is a tool that helps students discover, organize, and apply to internships, including optional AI-assisted writing. The Service is provided for personal, non-commercial use.</p>

      <h2>Your account</h2>
      <ul>
        <li>You are responsible for the accuracy of the information you provide and for keeping your login secure.</li>
        <li>You must be old enough to consent to use online services in your country.</li>
        <li>You may not misuse the Service, attempt to break its security, or use it for unlawful purposes.</li>
      </ul>

      <h2>AI-generated content</h2>
      <p>AI features produce draft text to assist you. You are responsible for reviewing, editing, and verifying any AI output before you use it. Sloe does not guarantee accuracy and is not responsible for how you use generated content.</p>

      <h2>Your content</h2>
      <p>You keep ownership of the content you upload (such as your CV and notes). You grant us permission to process it solely to provide the Service to you.</p>

      <h2>Availability</h2>
      <p>The Service is offered "as is" and "as available". We may change, suspend, or discontinue features at any time, and we do not guarantee uninterrupted access.</p>

      <h2>Limitation of liability</h2>
      <p>To the fullest extent permitted by law, Sloe is not liable for any indirect or consequential damages, or for the outcomes of internship applications.</p>

      <h2>Termination</h2>
      <p>You may delete your account at any time from Settings. We may suspend accounts that violate these Terms.</p>

      <h2>Changes</h2>
      <p>We may update these Terms. Continued use after changes means you accept the updated Terms.</p>

      <h2>Contact</h2>
      <p>Questions? Email <a href="mailto:alyssachalondra@student.uns.ac.id">alyssachalondra@student.uns.ac.id</a>.</p>

      <p style={csx("margin-top:32px")}><Link href="/privacy">Read our Privacy Policy</Link></p>
    </main>
  )
}
