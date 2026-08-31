import { formatPrice } from "@/lib/utils";
import { HOTEL_PLANS, type HotelPlanTierId } from "@/lib/hotel-plans";
import { AGENCY_PLANS, type AgencyPlanProductId } from "@/lib/agency-plans";

export type ListingProductId = "standard" | "featured" | "premium";
export type BoostProductId =
  | "tenant_access_24h"
  | "featured_boost"
  | "featured_boost_plus"
  | "promote_standard"
  | "promote_pro"
  | "promote_max"
  | "verified_badge";
export type AgentProductId = AgencyPlanProductId;
export type HotelPlanProductId =
  | "hotel_plan_starter"
  | "hotel_plan_pro"
  | "hotel_plan_business"
  | "hotel_plan_enterprise";
export type ProductId =
  | ListingProductId
  | BoostProductId
  | AgentProductId
  | HotelPlanProductId;

export interface PricingProduct {
  id: ProductId | string;
  name: string;
  price: number;
  currency: "KES";
  durationDays: number;
  /** When set, used instead of durationDays * 24h (e.g. tenant day pass). */
  durationHours?: number;
  description: string;
  features: string[];
  popular?: boolean;
  category: "listing" | "boost" | "subscription" | "access";
  listingFlags?: {
    isFeatured?: boolean;
    isPremium?: boolean;
    isSponsored?: boolean;
  };
  maxListings?: number;
}

/** Platform fee on confirmed BnB bookings (of booking total). Range 5–15%. */
export const BNB_BOOKING_COMMISSION_RATE = 0.1; // 10%

/** KES 150 unlocks chat, reserve, WhatsApp/call for 24 hours. */
export const TENANT_ACCESS_PRODUCT_ID = "tenant_access_24h" as const;
export const TENANT_ACCESS_PRICE = 150;
export const TENANT_ACCESS_HOURS = 24;

/** KES 1,600 verified seller badge for 90 days on professional profiles. */
export const VERIFIED_BADGE_PRODUCT_ID = "verified_badge" as const;
export const VERIFIED_BADGE_PRICE = 1600;
export const VERIFIED_BADGE_DAYS = 90;

export const LISTING_PRODUCTS: PricingProduct[] = [
  {
    id: "standard",
    name: "Lister Basic",
    price: 1000,
    currency: "KES",
    durationDays: 30,
    category: "subscription",
    description: "For landlords who need more than the free 3 listings.",
    features: [
      "Up to 15 active listings",
      "Appears in search results",
      "WhatsApp & contact leads",
      "Admin quality review",
    ],
    maxListings: 15,
  },
  {
    id: "featured",
    name: "Lister Pro",
    price: 2500,
    currency: "KES",
    durationDays: 30,
    category: "subscription",
    popular: true,
    description: "More inventory plus featured placement on new listings.",
    features: [
      "Up to 40 active listings",
      "Featured badge on new listings",
      "Priority in county search",
      "Homepage featured row",
    ],
    listingFlags: { isFeatured: true },
    maxListings: 40,
  },
  {
    id: "premium",
    name: "Lister Max",
    price: 5000,
    currency: "KES",
    durationDays: 30,
    category: "subscription",
    description: "Maximum visibility for high-volume landlords.",
    features: [
      "Up to 100 active listings",
      "Sponsored search placement",
      "Premium badge",
      "Priority support",
    ],
    listingFlags: {
      isFeatured: true,
      isPremium: true,
      isSponsored: true,
    },
    maxListings: 100,
  },
];

export const BOOST_PRODUCTS: PricingProduct[] = [
  {
    id: "tenant_access_24h",
    name: "24-hour viewing pass",
    price: TENANT_ACCESS_PRICE,
    currency: "KES",
    durationDays: 1,
    durationHours: TENANT_ACCESS_HOURS,
    category: "access",
    description:
      "Unlock chat, reserve, and WhatsApp/call with landlords for 24 hours.",
    features: [
      "Chat with agents & landlords",
      "Reserve rentals & book BnBs",
      "WhatsApp / call contact details",
      "Valid for 24 hours",
    ],
  },
  {
    id: "featured_boost",
    name: "Featured listing",
    price: 500,
    currency: "KES",
    durationDays: 14,
    category: "boost",
    description: "Feature badge and county search priority for 14 days.",
    features: ["Featured badge", "County search priority", "14 days"],
    listingFlags: { isFeatured: true },
  },
  {
    id: "featured_boost_plus",
    name: "Featured listing Plus",
    price: 1000,
    currency: "KES",
    durationDays: 30,
    category: "boost",
    popular: true,
    description: "Full-month featured placement for maximum enquiries.",
    features: ["Featured badge", "County search priority", "30 days"],
    listingFlags: { isFeatured: true },
  },
  {
    id: "promote_standard",
    name: "Property promotion",
    price: 1000,
    currency: "KES",
    durationDays: 14,
    category: "boost",
    description: "Sponsored push for an existing live listing.",
    features: ["Sponsored badge", "Search boost", "14 days"],
    listingFlags: { isSponsored: true, isFeatured: true },
  },
  {
    id: "promote_pro",
    name: "Property promotion Pro",
    price: 2500,
    currency: "KES",
    durationDays: 30,
    category: "boost",
    popular: true,
    description: "Homepage row + sponsored search for 30 days.",
    features: [
      "Homepage placement",
      "Sponsored badge",
      "Featured search",
      "30 days",
    ],
    listingFlags: {
      isFeatured: true,
      isPremium: true,
      isSponsored: true,
    },
  },
  {
    id: "promote_max",
    name: "Property promotion Max",
    price: 5000,
    currency: "KES",
    durationDays: 30,
    category: "boost",
    description: "Maximum push for high-value or slow-moving stock.",
    features: [
      "Top homepage placement",
      "Sponsored + premium badges",
      "Priority support",
      "30 days",
    ],
    listingFlags: {
      isFeatured: true,
      isPremium: true,
      isSponsored: true,
    },
  },
  {
    id: VERIFIED_BADGE_PRODUCT_ID,
    name: "Verified seller badge",
    price: VERIFIED_BADGE_PRICE,
    currency: "KES",
    durationDays: VERIFIED_BADGE_DAYS,
    category: "boost",
    description: "Trust badge on your professional profile for 90 days.",
    features: ["Verified mark", "Higher buyer trust", "90 days"],
  },
];

export const PUBLIC_BOOST_PRODUCTS = BOOST_PRODUCTS.filter(
  (p) =>
    p.id !== "tenant_access_24h" &&
    p.id !== VERIFIED_BADGE_PRODUCT_ID,
);

export const AGENT_PRODUCTS: PricingProduct[] = AGENCY_PLANS.filter(
  (plan) => plan.productId,
).map((plan) => ({
  id: plan.productId!,
  name: plan.name,
  price: plan.price,
  currency: plan.currency,
  durationDays: plan.durationDays,
  category: "subscription" as const,
  description: plan.description,
  features: plan.features,
  popular: plan.popular,
  maxListings: plan.maxListings ?? undefined,
}));

const PAID_HOTEL_TIER_TO_PRODUCT: Record<
  Exclude<HotelPlanTierId, "FREE">,
  HotelPlanProductId
> = {
  STARTER: "hotel_plan_starter",
  PRO: "hotel_plan_pro",
  BUSINESS: "hotel_plan_business",
  ENTERPRISE: "hotel_plan_enterprise",
};

export function hotelTierToProductId(
  tier: HotelPlanTierId,
): HotelPlanProductId | null {
  if (tier === "FREE") return null;
  return PAID_HOTEL_TIER_TO_PRODUCT[tier];
}

export function hotelProductIdToTier(productId: string): HotelPlanTierId | null {
  const match = Object.entries(PAID_HOTEL_TIER_TO_PRODUCT).find(
    ([, id]) => id === productId,
  );
  return match ? (match[0] as HotelPlanTierId) : null;
}

export function isHotelPlanProduct(productId: string): productId is HotelPlanProductId {
  return productId.startsWith("hotel_plan_");
}

export const HOTEL_PLAN_PRODUCTS: PricingProduct[] = HOTEL_PLANS.filter(
  (plan) => plan.price > 0,
).map((plan) => ({
  id: hotelTierToProductId(plan.id)!,
  name: `Hotel ${plan.name}`,
  price: plan.price,
  currency: "KES" as const,
  durationDays: plan.durationDays,
  category: "subscription" as const,
  description: plan.description,
  features: plan.features,
  popular: plan.popular,
}));

export const ALL_PRODUCTS: PricingProduct[] = [
  ...LISTING_PRODUCTS,
  ...BOOST_PRODUCTS,
  ...AGENT_PRODUCTS,
  ...HOTEL_PLAN_PRODUCTS,
];

export function getProduct(id: string): PricingProduct | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}

export function formatProductPrice(product: PricingProduct) {
  return formatPrice(product.price, { currency: product.currency });
}

export function bnbCommissionAmount(bookingTotal: number) {
  return Math.round(bookingTotal * BNB_BOOKING_COMMISSION_RATE);
}

export const MONETIZATION_COPY = {
  buyersFree:
    "Buyers and tenants browse free. Professionals get 3 free listings, then pay to scale.",
  flow: "Start free (up to 3 listings) → upgrade monthly or boost a listing → Admin reviews each listing.",
  bnbCommission: `${Math.round(BNB_BOOKING_COMMISSION_RATE * 100)}% platform fee on confirmed BnB bookings.`,
};
