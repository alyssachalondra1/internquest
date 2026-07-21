import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { IconSprite } from "@/components/Icons"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sloe.my.id"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sloe \u2014 Your AI internship companion",
    template: "%s \u00b7 Sloe",
  },
  description:
    "Sloe helps students find, track, and win internships with AI-powered writing, deadlines, internship groups, and a friendly gamified workspace.",
  applicationName: "Sloe",
  openGraph: {
    type: "website",
    siteName: "Sloe",
    title: "Sloe \u2014 Your AI internship companion",
    description:
      "Find, track, and win internships with AI help, deadlines, and a friendly gamified workspace.",
    url: SITE_URL,
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
    title: "Sloe \u2014 Your AI internship companion",
    description:
      "Find, track, and win internships with AI help, deadlines, and a friendly gamified workspace.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <IconSprite />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
