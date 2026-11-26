/* Polar billing config for international (USD) checkout. Polar is the merchant
   of record, so it handles VAT and accepts cards, Apple Pay, Google Pay and
   Google Pay. The three prices live in Polar as our own products; only their ids
   are needed here. Everything in this file is safe on the client: the access
   token is NOT read here, and fulfilment only happens in the webhook.

   Setup steps: docs/payments/polar-setup.md */

import type { PlanId } from "@/lib/plans"

/* Sandbox and production are separate Polar environments with separate tokens.
   Omit POLAR_ENVIRONMENT (or set "production") for live, "sandbox" for tests. */
export const POLAR_ENVIRONMENT = process.env.POLAR_ENVIRONMENT === "sandbox" ? "sandbox" : "production"

export const POLAR_PRODUCT_ID: Record<PlanId, string> = {
  plus: process.env.POLAR_PRODUCT_PLUS ?? "",
  pro: process.env.POLAR_PRODUCT_PRO ?? "",
  topup: process.env.POLAR_PRODUCT_TOPUP ?? "",
}

/** USD checkout is offered only when the token and all three products exist. */
export function polarConfigured(): boolean {
  return Boolean(
    process.env.POLAR_ACCESS_TOKEN &&
      POLAR_PRODUCT_ID.plus &&
      POLAR_PRODUCT_ID.pro &&
      POLAR_PRODUCT_ID.topup,
  )
}
