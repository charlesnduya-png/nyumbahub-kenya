export const JOB_PARTNER_COMMISSION_RATE = 0.3;

export const JOB_PARTNER_EARNINGS = {
  headline: "30% commission on every paid plan",
  when:
    "You earn as soon as a referred agency or hotel operator completes a monthly plan payment. The commission lands in your wallet immediately — no waiting period. You earn again each month they renew.",
  who: "Share your link with estate agencies, agents, hotel operators, and landlords anywhere — Kenya, Africa, and other countries — who subscribe to a paid agency or hotel plan on Your Home.",
  recurring:
    "Commissions repeat every billing cycle for as long as they stay subscribed.",
  international:
    "Open to partners worldwide. Refer professionals in any country Your Home serves; you do not need to live in Kenya to join or earn.",
  currency:
    "Earnings are tracked in your wallet currency (usually KES or the plan payment currency). Withdraw via PayPal, Wise, bank transfer, or local mobile money — providers convert to your local currency at payout.",
  payouts:
    "Cash out with PayPal, Wise, Payoneer, Revolut, Chipper Cash, bank transfer (local or SWIFT), or mobile money (M-Pesa, MoMo, Wave, EcoCash, and more).",
} as const;

export function jobPartnerCommissionPercent() {
  return Math.round(JOB_PARTNER_COMMISSION_RATE * 100);
}
