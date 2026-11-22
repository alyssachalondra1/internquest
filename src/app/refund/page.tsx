import Link from "next/link"
import { csx } from "@/lib/csx"

export const metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "How refunds and cancellations work for Sloe paid plans and top-ups, for purchases in Indonesia and internationally.",
}

export default function RefundPage() {
  return (
    <main style={csx("max-width:780px;margin:0 auto;padding:48px 20px;line-height:1.7")}>
      <p><Link href="/">Back to Sloe</Link></p>
      <h1>Refund &amp; Cancellation Policy</h1>
      <p className="muted">Last updated: November 22, 2026</p>

      <p>
        This policy explains how billing, cancellation, and refunds work for Sloe paid plans and top-ups. It applies to
        every purchase, whether you pay in Indonesian rupiah or in US dollars. Support:
        {" "}<a href="mailto:support@sloe.my.id">support@sloe.my.id</a>.
      </p>

      <h2>1. How Sloe billing works</h2>
      <ul>
        <li>Paid plans (Plus and Pro) are <b>prepaid access passes for one month</b>, not automatic subscriptions.</li>
        <li>We never charge your payment method again on our own. There is no auto-renew: when a pass ends, your account returns to the Free plan unless you buy another pass.</li>
        <li>Top-up packs add a fixed number of AI actions (gems) to your balance. They do not change your plan and do not expire with the month.</li>
      </ul>

      <h2>2. Cancelling</h2>
      <p>
        Because passes are prepaid, there is nothing to cancel: simply do not buy another pass, and your paid access ends
        when the current pass expires. You may delete your account at any time from Settings, and we do not charge a
        cancellation fee.
      </p>

      <h2>3. Refund eligibility</h2>
      <ul>
        <li><b>Paid plans (Plus/Pro):</b> full refund if you ask within <b>14 days</b> of the purchase and you have used fewer than 10 AI actions in that period.</li>
        <li><b>Top-up packs:</b> full refund if you ask within <b>14 days</b> and the gems from that pack are still unused.</li>
        <li><b>Service failure:</b> if a payment succeeded but the paid features never became available, or the Service was unusable, you get a full refund regardless of usage.</li>
      </ul>

      <h2>4. How to request a refund</h2>
      <p>
        Email <a href="mailto:support@sloe.my.id">support@sloe.my.id</a> with the email address you signed up with and
        the order or receipt ID. We reply within 2 business days. Approved refunds are returned to the original payment
        method, usually within 5 to 10 business days depending on the payment provider and your bank.
      </p>

      <h2>5. International purchases — Paddle as Merchant of Record</h2>
      <p>
        Orders paid in US dollars are processed by <b>Paddle</b>, who acts as the <b>Merchant of Record</b>. This means
        Paddle is the seller of record for your order: Paddle calculates and collects any applicable taxes, issues your
        receipt, and processes refunds and chargebacks. You can request a refund through us, or contact Paddle directly
        about your order. Refunds are returned to the payment method you used (card, Apple Pay, or PayPal).
      </p>

      <h2>6. Purchases in Indonesia</h2>
      <p>
        Orders paid in Indonesian rupiah are processed through our payment gateway in Indonesia (QRIS or e-wallet).
        Refunds are sent back through the same channel and to the same account that paid. Depending on your e-wallet
        provider, processing can take up to 10 business days.
      </p>

      <h2>7. Chargebacks</h2>
      <p>
        If something went wrong with a payment, please contact us first at
        {" "}<a href="mailto:support@sloe.my.id">support@sloe.my.id</a>. We resolve nearly every issue within a few days,
        and it is faster than a dispute with your bank. Our contact details are also published so payment providers can
        reach us directly.
      </p>

      <h2>8. Your statutory rights</h2>
      <p>
        Nothing in this policy limits rights you have under the consumer law of your country. If your local law gives
        you a longer withdrawal period or a stronger refund right for digital purchases, that law applies.
      </p>

      <p style={csx("margin-top:32px")}>
        <Link href="/terms">Terms of Service</Link> · <Link href="/privacy">Privacy Policy</Link> ·{" "}
        <Link href="/pricing">Pricing</Link> · <a href="mailto:support@sloe.my.id">support@sloe.my.id</a>
      </p>
    </main>
  )
}
