import Link from "next/link"
import { Icon } from "@/components/Icons"
import { PLAN_PERK } from "@/lib/plans"

/* The one place "you hit a limit on Free" is explained: reason, what the paid
   plans cost, and the way out. Used by Groups and the profile portfolio gate,
   and by the AI quota state, so the wording and the price stay in one file.
   No hooks — safe to render from a client component as well as a server page. */
export function UpgradeNotice({ reason, className }: { reason: string; className?: string }) {
  return (
    <div className={"iq-upsell" + (className ? " " + className : "")} role="status">
      <span className="iq-upsell__ic">
        <Icon name="ic-lock" className="ic ic-16" />
      </span>
      <div className="iq-upsell__copy">
        <p className="iq-upsell__reason">{reason}</p>
        <p className="iq-upsell__price">
          {PLAN_PERK.plus} {PLAN_PERK.pro}
        </p>
      </div>
      <Link className="iq-btn iq-btn--primary iq-btn--sm" href="/pricing">
        See plans
      </Link>
    </div>
  )
}
