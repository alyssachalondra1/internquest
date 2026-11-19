import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { IconSprite } from "@/components/Icons"
import { THEME_SCRIPT } from "@/lib/theme-script"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sloe.my.id"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sloe",
    template: "%s \u00b7 Sloe",
  },
  description:
    "Sloe helps you find, track, and win jobs and roles with AI-powered writing, deadlines, peer groups, and a friendly gamified workspace.",
  applicationName: "Sloe",
  openGraph: {
    type: "website",
    siteName: "Sloe",
    title: "Sloe \u2014 your job hunt companion",
    description:
      "Find, track, and win jobs and roles with AI help, deadlines, and a friendly gamified workspace.",
    url: SITE_URL,
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
    title: "Sloe \u2014 your job hunt companion",
    description:
      "Find, track, and win jobs and roles with AI help, deadlines, and a friendly gamified workspace.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <IconSprite />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
