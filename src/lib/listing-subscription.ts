import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getEffectiveAgentProduct,
  getEffectiveFreeMaxListings,
  resolveUserListingLimit,
  UNLIMITED_LISTING_OVERRIDE,
} from "@/lib/agency-plan-limits";
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

export { FREE_TIER_MAX_LISTINGS, LISTINGS_ARE_FREE, PRICING_MUTED, UNLIMITED_LISTING_OVERRIDE };

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
  const limit = await getEffectiveFreeMaxListings();
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
    const product = await getEffectiveAgentProduct(productId);
    if (product) {
      if (typeof product.maxListings === "number") return product.maxListings;
      return null;
    }
    const fallback = getProduct(productId);
    if (fallback) {
      if (typeof fallback.maxListings === "number") return fallback.maxListings;
      return null;
    }
  }

  return maxListingsForPlan(subscription.plan);
}

type ListingAccessResult =
  | {
      ok: true;
      used: number;
      limit: number | null;
      remaining: number | null;
    }
  | {
      ok: false;
      used: number;
      limit: number;
      remaining: 0;
      error: string;
      code: "LISTING_LIMIT_REACHED";
    };

function limitReached(
  used: number,
  limit: number,
  error: string,
): ListingAccessResult {
  return {
    ok: false,
    used,
    limit,
    remaining: 0,
    error,
    code: "LISTING_LIMIT_REACHED",
  };
}

/**
 * Admins bypass. When LISTINGS_ARE_FREE / payments off, pros list within free cap.
 * Active subscriptions raise the cap via product maxListings.
 * Admin listingLimitOverride on the user account takes precedence when set.
 */
export async function assertCanCreateListing(input: {
  userId: string;
  role?: string | null;
}): Promise<ListingAccessResult> {
  if (input.role === "ADMIN") {
    return {
      ok: true,
      used: 0,
      limit: null,
      remaining: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { listingLimitOverride: true },
  });

  const used = await countProfessionalListings(input.userId);
  const freeLimit = await getEffectiveFreeMaxListings();

  const applyLimit = async (planLimit: number | null): Promise<ListingAccessResult> => {
    const effectiveLimit = await resolveUserListingLimit({
      userId: input.userId,
      role: input.role,
      listingLimitOverride: user?.listingLimitOverride,
      planLimit,
    });

    if (effectiveLimit == null) {
      return {
        ok: true,
        used,
        limit: null,
        remaining: null,
      };
    }

    if (used >= effectiveLimit) {
      return limitReached(
        used,
        effectiveLimit,
        `You can list up to ${effectiveLimit} active properties. Archive one or ask admin to raise your limit.`,
      );
    }

    return {
      ok: true,
      used,
      limit: effectiveLimit,
      remaining: Math.max(0, effectiveLimit - used),
    };
  };

  if (LISTINGS_ARE_FREE) {
    return applyLimit(freeLimit);
  }

  const subscription = await getActiveListingSubscription(input.userId);

  if (subscription) {
    const paidLimit = await maxListingsForSubscription(subscription);
    return applyLimit(paidLimit);
  }

  return applyLimit(freeLimit);
}

export async function activateListingSubscription(input: {
  userId: string;
  productId: string;
  amount: number;
  paymentId?: string;
  durationDays?: number;
}) {
  const product =
    (await getEffectiveAgentProduct(input.productId)) ??
    getProduct(input.productId);
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
