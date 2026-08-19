import { formatPrice } from "@/lib/utils";

export type ListingProductId = "standard" | "featured" | "premium";
export type BoostProductId =
  | "mpesa_test"
  | "tenant_access_24h"
  | "featured_boost"
  | "featured_boost_plus"
  | "promote_standard"
  | "promote_pro"
  | "promote_max"
  | "verified_badge";
export type AgentProductId = "agent_basic" | "agent_pro" | "agent_enterprise";
export type ProductId = ListingProductId | BoostProductId | AgentProductId;

export interface PricingProduct {
  id: ProductId;
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
    id: "mpesa_test",
    name: "M-Pesa test",
    price: 50,
    currency: "KES",
    durationDays: 1,
    category: "boost",
    description: "KES 50 STK test charge — for payment integration checks only.",
    features: ["Triggers M-Pesa STK prompt", "No listing boost applied"],
  },
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
    id: "verified_badge",
    name: "Verified seller badge",
    price: 1500,
    currency: "KES",
    durationDays: 90,
    category: "boost",
    description: "Trust badge on your professional profile for 90 days.",
    features: ["Verified mark", "Higher buyer trust", "90 days"],
  },
];

export const PUBLIC_BOOST_PRODUCTS = BOOST_PRODUCTS.filter(
  (p) => p.id !== "mpesa_test" && p.id !== "tenant_access_24h",
);

export const AGENT_PRODUCTS: PricingProduct[] = [
  {
    id: "agent_basic",
    name: "Agent Basic",
    price: 1000,
    currency: "KES",
    durationDays: 30,
    category: "subscription",
    description: "For solo agents starting on Your Home.",
    features: [
      "Up to 15 active listings",
      "Lead inbox",
      "Basic CRM",
      "M-Pesa billing",
    ],
    maxListings: 15,
  },
  {
    id: "agent_pro",
    name: "Agent Pro",
    price: 2500,
    currency: "KES",
    durationDays: 30,
    category: "subscription",
    popular: true,
    description: "Best for active agents closing deals every week.",
    features: [
      "Up to 40 active listings",
      "Full CRM & viewings",
      "Verified agent badge",
      "Priority support",
    ],
    maxListings: 40,
  },
  {
    id: "agent_enterprise",
    name: "Agency",
    price: 5000,
    currency: "KES",
    durationDays: 30,
    category: "subscription",
    description: "For agencies with multiple agents and inventory.",
    features: [
      "Up to 100 active listings",
      "Team-ready workflow",
      "Featured agent profile",
      "Reports & analytics",
    ],
    maxListings: 100,
  },
];

export const ALL_PRODUCTS: PricingProduct[] = [
  ...LISTING_PRODUCTS,
  ...BOOST_PRODUCTS,
  ...AGENT_PRODUCTS,
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
