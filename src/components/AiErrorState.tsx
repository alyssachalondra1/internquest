"use client"

import { Icon } from "@/components/Icons"

/* On-brand, friendly error state so users never see raw technical errors.
   Shows a sad Momo, a short human message, and an optional retry action. */
export function AiErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
  compact = false,
}: {
  message?: string | null
  onRetry?: () => void
  retryLabel?: string
  compact?: boolean
}) {
  return (
    <div className={"iq-aierr" + (compact ? " iq-aierr--compact" : "")}>
      <SadMomo size={compact ? 54 : 78} />
      <p className="iq-aierr__msg">
        {message || "Oops, something went wrong on our side. Please try again in a moment."}
      </p>
      {onRetry && (
        <button className="iq-btn iq-btn--primary iq-btn--sm" onClick={onRetry} type="button">
          <Icon name="ic-refresh" className="ic ic-16" /> {retryLabel}
        </button>
      )}
    </div>
  )
}

function SadMomo({ size = 78 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="30" cy="36" r="8" fill="#8FB9E8" />
      <circle cx="70" cy="36" r="8" fill="#8FB9E8" />
      <ellipse cx="50" cy="58" rx="34" ry="32" fill="#8FB9E8" />
      <ellipse cx="50" cy="56" rx="24" ry="24" fill="#FBEFD9" />
      <ellipse cx="39" cy="52" rx="8.5" ry="11.5" fill="#C8A46A" opacity="0.45" />
      <ellipse cx="61" cy="52" rx="8.5" ry="11.5" fill="#C8A46A" opacity="0.45" />
      <path d="M32 44 Q39 41 45 45" stroke="#6E5230" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M55 45 Q61 41 68 44" stroke="#6E5230" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="39" cy="55" r="4.2" fill="#3A3550" />
      <circle cx="61" cy="55" r="4.2" fill="#3A3550" />
      <path d="M34 60 q-3.5 6 0 8.5 q3.5 -2.5 0 -8.5 Z" fill="#8FB9E8" />
      <ellipse cx="50" cy="63" rx="3" ry="2" fill="#6E5230" />
      <path d="M43 72 Q50 66 57 72" stroke="#6E5230" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
