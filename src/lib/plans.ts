/* Plan catalogue — single source for price, label and the perk line used in
   upsell copy. Client-safe on purpose: the checkout lib (server) and the
   upsell UI (client) both read it. Values mirror Decisions Log/Pricing_Strategy.md. */

export type PlanId = "plus" | "pro" | "topup"
export type SubPlanId = Exclude<PlanId, "topup">

export const PLAN_PRICE: Record<PlanId, number> = { plus: 19900, pro: 39900, topup: 10000 }
export const PLAN_PRICE_TEXT: Record<PlanId, string> = { plus: "Rp19.900", pro: "Rp39.900", topup: "Rp10.000" }
export const PLAN_LABEL: Record<PlanId, string> = {
  plus: "Sloe Plus",
  pro: "Sloe Pro",
  topup: "30 AI actions top-up",
}

/* USD list prices for international buyers. LOCKED 22 Nov 2026: with Polar's
   5% + $0.50 merchant-of-record fee and tax-inclusive VAT they keep a 62-81%
   margin, so they are now the final prices. */
export const PLAN_PRICE_USD: Record<PlanId, number> = { plus: 499, pro: 999, topup: 299 }
export const PLAN_PRICE_USD_TEXT: Record<PlanId, string> = { plus: "$4.99", pro: "$9.99", topup: "$2.99" }

/** One line per plan, shown at the moment a free user is stopped by a limit. */
export const PLAN_PERK: Record<SubPlanId, string> = {
  plus: "Plus Rp19.900 a month: 100 AI actions, unlimited screenshot reads, 10 groups and the portfolio builder.",
  pro: "Pro Rp39.900 a month: 300 AI actions, unlimited groups and members.",
}
