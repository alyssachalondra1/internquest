import type { Metadata } from "next"
import "./globals.css"
import { IconSprite } from "@/components/Icons"

export const metadata: Metadata = {
  title: "InternQuest",
  description: "Your AI companion for internship hunting",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <IconSprite />
        {children}
      </body>
    </html>
  )
}
