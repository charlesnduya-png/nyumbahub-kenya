import { formatPrice } from "@/lib/utils";

export type ListingProductId = "standard" | "featured" | "premium";
export type BoostProductId = "featured_boost" | "premium_boost" | "verified_badge";
export type AgentProductId = "agent_basic" | "agent_pro" | "agent_enterprise";
export type ProductId = ListingProductId | BoostProductId | AgentProductId;

export interface PricingProduct {
  id: ProductId;
  name: string;
  price: number;
  currency: "KES";
  durationDays: number;
  description: string;
  features: string[];
  popular?: boolean;
  category: "listing" | "boost" | "subscription";
  /** Listing flags applied after payment + admin approval */
  listingFlags?: {
    isFeatured?: boolean;
    isPremium?: boolean;
    isSponsored?: boolean;
  };
  maxListings?: number;
}

export const LISTING_PRODUCTS: PricingProduct[] = [
  {
    id: "standard",
    name: "Standard Listing",
    price: 2000,
    currency: "KES",
    durationDays: 30,
    category: "listing",
    description: "Publish one property for 30 days after admin approval.",
    features: [
      "1 active listing for 30 days",
      "Appears in search results",
      "WhatsApp & contact leads",
      "Admin quality review",
    ],
  },
  {
    id: "featured",
    name: "Featured Listing",
    price: 4500,
    currency: "KES",
    durationDays: 30,
    category: "listing",
    popular: true,
    description: "Top of county search + featured badge for more enquiries.",
    features: [
      "Everything in Standard",
      "Featured badge",
      "Priority in county search",
      "Homepage featured row",
    ],
    listingFlags: { isFeatured: true },
  },
  {
    id: "premium",
    name: "Premium / Sponsored",
    price: 9000,
    currency: "KES",
    durationDays: 30,
    category: "listing",
    description: "Maximum visibility for high-value homes and land.",
    features: [
      "Everything in Featured",
      "Sponsored search placement",
      "Premium badge",
      "Priority support",
    ],
    listingFlags: {
      isFeatured: true,
      isPremium: true,
      isSponsored: true,
    },
  },
];

export const BOOST_PRODUCTS: PricingProduct[] = [
  {
    id: "featured_boost",
    name: "Featured boost",
    price: 3500,
    currency: "KES",
    durationDays: 30,
    category: "boost",
    description: "Boost an existing live listing to the top of search.",
    features: ["Featured badge", "County search priority", "30 days"],
    listingFlags: { isFeatured: true },
  },
  {
    id: "premium_boost",
    name: "Premium boost",
    price: 7000,
    currency: "KES",
    durationDays: 30,
    category: "boost",
    popular: true,
    description: "Homepage carousel + sponsored badge.",
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

export const AGENT_PRODUCTS: PricingProduct[] = [
  {
    id: "agent_basic",
    name: "Agent Basic",
    price: 4999,
    currency: "KES",
    durationDays: 30,
    category: "subscription",
    description: "For solo agents starting on NyumbaHub.",
    features: [
      "Up to 10 active listings",
      "Lead inbox",
      "Basic CRM",
      "M-Pesa billing",
    ],
    maxListings: 10,
  },
  {
    id: "agent_pro",
    name: "Agent Pro",
    price: 9999,
    currency: "KES",
    durationDays: 30,
    category: "subscription",
    popular: true,
    description: "Best for active agents closing deals every week.",
    features: [
      "Up to 30 active listings",
      "Full CRM & viewings",
      "Verified agent badge",
      "Priority support",
    ],
    maxListings: 30,
  },
  {
    id: "agent_enterprise",
    name: "Agency",
    price: 24999,
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

export const MONETIZATION_COPY = {
  buyersFree: "Buyers and tenants browse free. Professionals pay to list.",
  flow: "Pay with M-Pesa → Admin reviews listing → Goes live when approved.",
};
