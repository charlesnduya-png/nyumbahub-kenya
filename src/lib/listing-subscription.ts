import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ALL_PRODUCTS,
  getProduct,
  type ProductId,
} from "@/lib/pricing";
import {
  FREE_TIER_MAX_LISTINGS,
  LISTINGS_ARE_FREE,
  PRICING_MUTED,
} from "@/lib/listing-flags";

export { FREE_TIER_MAX_LISTINGS, LISTINGS_ARE_FREE, PRICING_MUTED };

export const MONTHLY_LISTING_PRODUCT_IDS = new Set([
  "standard",
  "featured",
  "premium",
  "agent_basic",
  "agent_pro",
  "agent_premium",
  "agent_enterprise",
]);

export function isMonthlyListingProduct(productId: string) {
  return MONTHLY_LISTING_PRODUCT_IDS.has(productId);
}

export function productIdToSubscriptionPlan(
  productId: string,
): SubscriptionPlan {
  switch (productId) {
    case "featured":
      return "PREMIUM";
    case "premium":
      return "PREMIUM";
    case "agent_pro":
      return "AGENT_PRO";
    case "agent_premium":
      return "AGENT_ENTERPRISE";
    case "agent_enterprise":
      return "AGENT_ENTERPRISE";
    case "agent_basic":
    case "standard":
    default:
      return "BASIC";
  }
}

export function listingFlagsForPlan(plan: SubscriptionPlan) {
  switch (plan) {
    case "PREMIUM":
    case "AGENT_PRO":
      return { isFeatured: true as const };
    case "AGENT_ENTERPRISE":
      return {
        isFeatured: true as const,
        isPremium: true as const,
        isSponsored: true as const,
      };
    default:
      return {};
  }
}

export function listingFlagsForProduct(productId: string) {
  const product = getProduct(productId);
  if (product?.listingFlags) return product.listingFlags;
  return listingFlagsForPlan(productIdToSubscriptionPlan(productId));
}

export async function getActiveListingSubscription(userId: string) {
  const now = new Date();
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    orderBy: { endDate: "desc" },
  });
}

export async function countProfessionalListings(userId: string) {
  return prisma.property.count({
    where: {
      ownerId: userId,
      status: { notIn: ["ARCHIVED", "SOLD", "RENTED", "EXPIRED"] },
    },
  });
}

export async function getFreeTierListingUsage(userId: string) {
  const used = await countProfessionalListings(userId);
  const limit = FREE_TIER_MAX_LISTINGS;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    atLimit: used >= limit,
  };
}

function maxListingsForPlan(plan: SubscriptionPlan): number | null {
  const caps = ALL_PRODUCTS.filter(
    (p) =>
      isMonthlyListingProduct(p.id) &&
      productIdToSubscriptionPlan(p.id) === plan &&
      typeof p.maxListings === "number",
  ).map((p) => p.maxListings as number);
  return caps.length > 0 ? Math.max(...caps) : null;
}

async function maxListingsForSubscription(subscription: {
  id: string;
  plan: SubscriptionPlan;
}) {
  const payment = await prisma.payment.findFirst({
    where: {
      subscriptionId: subscription.id,
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
  });

  const productId = (payment?.metadata as { productId?: string } | null)?.productId;
  if (productId && isMonthlyListingProduct(productId)) {
    const product = getProduct(productId);
    if (product) {
      if (typeof product.maxListings === "number") return product.maxListings;
      return null;
    }
  }

  return maxListingsForPlan(subscription.plan);
}

/**
 * Admins bypass. When LISTINGS_ARE_FREE / payments off, pros list within free cap.
 * Active subscriptions raise the cap via product maxListings.
 */
export async function assertCanCreateListing(input: {
  userId: string;
  role?: string | null;
}) {
  if (input.role === "ADMIN") {
    return {
      ok: true as const,
      used: 0,
      limit: null as number | null,
      remaining: null as number | null,
    };
  }

  const used = await countProfessionalListings(input.userId);

  // Launch free mode — no paid plan required
  if (LISTINGS_ARE_FREE) {
    const limit = FREE_TIER_MAX_LISTINGS;
    if (used >= limit) {
      return {
        ok: false as const,
        used,
        limit,
        remaining: 0,
        error: `You can list up to ${limit} properties for now. Archive one to add another.`,
        code: "LISTING_LIMIT_REACHED" as const,
      };
    }
    return {
      ok: true as const,
      used,
      limit,
      remaining: Math.max(0, limit - used),
    };
  }

  const subscription = await getActiveListingSubscription(input.userId);

  if (subscription) {
    const paidLimit = await maxListingsForSubscription(subscription);
    if (paidLimit == null) {
      return {
        ok: true as const,
        used,
        limit: null,
        remaining: null,
      };
    }
    if (used >= paidLimit) {
      return {
        ok: false as const,
        used,
        limit: paidLimit,
        remaining: 0,
        error: `Your plan allows up to ${paidLimit} active listings. Archive one or upgrade.`,
        code: "LISTING_LIMIT_REACHED" as const,
      };
    }
    return {
      ok: true as const,
      used,
      limit: paidLimit,
      remaining: Math.max(0, paidLimit - used),
    };
  }

  const limit = FREE_TIER_MAX_LISTINGS;
  if (used >= limit) {
    return {
      ok: false as const,
      used,
      limit,
      remaining: 0,
      error: `Free accounts can list up to ${limit} properties. Upgrade your plan or archive an existing listing.`,
      code: "LISTING_LIMIT_REACHED" as const,
    };
  }

  return {
    ok: true as const,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function activateListingSubscription(input: {
  userId: string;
  productId: string;
  amount: number;
  paymentId?: string;
  durationDays?: number;
}) {
  const product = getProduct(input.productId);
  const durationDays = input.durationDays ?? product?.durationDays ?? 30;
  const startDate = new Date();
  const plan = productIdToSubscriptionPlan(input.productId);

  const existing = await prisma.subscription.findFirst({
    where: {
      userId: input.userId,
      status: "ACTIVE",
      OR: [{ endDate: null }, { endDate: { gt: startDate } }],
    },
    orderBy: { endDate: "desc" },
  });

  const baseStart =
    existing?.endDate && existing.endDate > startDate
      ? existing.endDate
      : startDate;
  const nextEnd = new Date(
    baseStart.getTime() + durationDays * 24 * 60 * 60 * 1000,
  );

  if (existing) {
    const updated = await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        plan,
        status: "ACTIVE",
        endDate: nextEnd,
        amount: input.amount,
        autoRenew: true,
      },
    });

    if (input.paymentId) {
      await prisma.payment
        .update({
          where: { id: input.paymentId },
          data: { subscriptionId: updated.id, status: "COMPLETED" },
        })
        .catch(() => null);
    }

    return updated;
  }

  const created = await prisma.subscription.create({
    data: {
      userId: input.userId,
      plan,
      status: "ACTIVE",
      startDate,
      endDate: nextEnd,
      amount: input.amount,
      currency: "KES",
      autoRenew: true,
    },
  });

  if (input.paymentId) {
    await prisma.payment
      .update({
        where: { id: input.paymentId },
        data: { subscriptionId: created.id, status: "COMPLETED" },
      })
      .catch(() => null);
  }

  return created;
}

export type ProductIdMonthly = Extract<
  ProductId,
  | "standard"
  | "featured"
  | "premium"
  | "agent_basic"
  | "agent_pro"
  | "agent_premium"
  | "agent_enterprise"
>;
