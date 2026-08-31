export type AgencyPlanTierId = "FREE" | "BASIC" | "PRO" | "PREMIUM" | "ENTERPRISE";

export type AgencyPlanProductId =
  | "agent_basic"
  | "agent_pro"
  | "agent_premium"
  | "agent_enterprise";

export type AgencyPlanDefinition = {
  id: AgencyPlanTierId;
  name: string;
  price: number;
  currency: "KES";
  durationDays: number;
  maxListings: number | null;
  bestFor: string;
  description: string;
  features: string[];
  popular?: boolean;
  productId?: AgencyPlanProductId;
};

export const AGENCY_PLANS: AgencyPlanDefinition[] = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    currency: "KES",
    durationDays: 30,
    maxListings: 3,
    bestFor: "New agents",
    description: "Start listing on Your Home with no monthly fee.",
    features: [
      "Up to 3 active listings",
      "Lead inbox & enquiries",
      "Admin quality review",
      "M-Pesa-ready when you upgrade",
    ],
  },
  {
    id: "BASIC",
    name: "Basic Agency",
    price: 1500,
    currency: "KES",
    durationDays: 30,
    maxListings: 20,
    bestFor: "Small agencies",
    productId: "agent_basic",
    description: "For growing agents who need more inventory than the free tier.",
    features: [
      "Up to 20 active listings",
      "Lead inbox & basic CRM",
      "WhatsApp & in-app enquiries",
      "M-Pesa billing",
    ],
  },
  {
    id: "PRO",
    name: "Pro Agency",
    price: 3500,
    currency: "KES",
    durationDays: 30,
    maxListings: 75,
    bestFor: "Established agencies",
    productId: "agent_pro",
    popular: true,
    description: "Best for active agencies closing deals every week.",
    features: [
      "Up to 75 active listings",
      "Full CRM & viewing scheduler",
      "Verified agent badge",
      "Priority search placement",
    ],
  },
  {
    id: "PREMIUM",
    name: "Premium Agency",
    price: 7500,
    currency: "KES",
    durationDays: 30,
    maxListings: 250,
    bestFor: "Large agencies",
    productId: "agent_premium",
    description: "High-volume agencies with teams and large portfolios.",
    features: [
      "Up to 250 active listings",
      "Featured agent profile",
      "Homepage & county priority",
      "Team-ready workflow",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 15000,
    currency: "KES",
    durationDays: 30,
    maxListings: null,
    bestFor: "Property companies",
    productId: "agent_enterprise",
    description: "Unlimited listings and custom support for property companies.",
    features: [
      "Unlimited / custom listing volume",
      "Dedicated account support",
      "Reports & analytics",
      "Custom onboarding available",
    ],
  },
];

export const FREE_AGENCY_PLAN = AGENCY_PLANS.find((plan) => plan.id === "FREE")!;

export function getAgencyFreeMaxListings() {
  return FREE_AGENCY_PLAN.maxListings ?? 3;
}

export function formatAgencyListingCap(maxListings: number | null) {
  if (maxListings == null) return "Unlimited / custom";
  return `${maxListings} listing${maxListings === 1 ? "" : "s"}`;
}

export function agencyProductIdToTier(
  productId: string,
): AgencyPlanTierId | null {
  const match = AGENCY_PLANS.find((plan) => plan.productId === productId);
  return match?.id ?? null;
}

export function agencyTierToProductId(
  tier: AgencyPlanTierId,
): AgencyPlanProductId | null {
  if (tier === "FREE") return null;
  return AGENCY_PLANS.find((plan) => plan.id === tier)?.productId ?? null;
}
