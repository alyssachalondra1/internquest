/* Paddle Billing config for international (USD) checkout. Paddle is the
   merchant of record, so it handles VAT and accepts cards, Apple Pay and
   PayPal. Everything here is public on purpose: the client token and price ids
   are meant to reach the browser. Fulfilment happens only in the webhook.

   Setup steps: docs/payments/paddle-setup.md */

export const PADDLE_ENV = process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox"
export const PADDLE_IS_SANDBOX = PADDLE_ENV !== "production"
export const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ""
export const PADDLE_PRICE_ID: Record<"plus" | "pro" | "topup", string> = {
  plus: process.env.NEXT_PUBLIC_PADDLE_PRICE_PLUS ?? "",
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO ?? "",
  topup: process.env.NEXT_PUBLIC_PADDLE_PRICE_TOPUP ?? "",
}

/** Checkout is offered only when every price we sell in USD exists. */
export function paddleConfigured(): boolean {
  return Boolean(PADDLE_CLIENT_TOKEN && PADDLE_PRICE_ID.plus && PADDLE_PRICE_ID.pro && PADDLE_PRICE_ID.topup)
}
