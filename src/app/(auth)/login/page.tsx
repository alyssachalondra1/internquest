import { GoogleButton } from "@/components/GoogleButton"
import { EmailAuthForm } from "@/components/EmailAuthForm"

export default function LoginPage() {
  return (
    <main>
      <h1>Masuk ke InternQuest</h1>
      <GoogleButton />
      <hr />
      <EmailAuthForm />
    </main>
  )
}