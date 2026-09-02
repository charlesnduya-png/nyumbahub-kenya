export const JOB_PARTNER_COMMISSION_RATE = 0.3;

export const JOB_PARTNER_EARNINGS = {
  headline: "30% commission on every paid plan",
  when:
    "You earn as soon as a referred agency or hotel operator completes a monthly plan payment. The commission lands in your wallet immediately — no waiting period. You earn again each month they renew.",
  who: "Share your link with estate agencies, agents, hotel operators, and landlords who subscribe to a paid agency or hotel plan on Your Home.",
  recurring:
    "Commissions repeat every billing cycle for as long as they stay subscribed.",
} as const;

export function jobPartnerCommissionPercent() {
  return Math.round(JOB_PARTNER_COMMISSION_RATE * 100);
}
