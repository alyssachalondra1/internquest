"use client"

import { useState } from "react"
import { csx } from "@/lib/csx"

/* Auto-fetches a company logo (Clearbit → Google favicon → colored monogram fallback). */
export function CompanyLogo({
  domain,
  name,
  brandColor = "#8B8B96",
  large = false,
}: {
  domain?: string | null
  name?: string | null
  brandColor?: string
  large?: boolean
}) {
  const [step, setStep] = useState(0)
  const letter = (name || "?").trim().charAt(0).toUpperCase() || "?"
  let src = ""
  if (domain && step === 0) src = "https://logo.clearbit.com/" + domain
  else if (domain && step === 1) src = "https://www.google.com/s2/favicons?domain=" + domain + "&sz=64"
  return (
    <span className={"iq-logo-box" + (large ? " iq-logo-box--lg" : "")}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || ""} style={csx("display:block")} onError={() => setStep((s) => s + 1)} />
      ) : (
        <span className="iq-mono" style={csx("background:" + brandColor)}>
          {letter}
        </span>
      )}
    </span>
  )
}
