import { prisma } from "@/lib/prisma";
import {
  getActiveListingSubscription,
  listingFlagsForPlan,
  listingFlagsForProduct,
} from "@/lib/listing-subscription";
import { getProduct } from "@/lib/pricing";
import { revalidatePropertySlug } from "@/lib/properties";

const LISTING_BOOST_PRODUCT_IDS = new Set([
  "featured_boost",
  "featured_boost_plus",
  "promote_standard",
  "promote_pro",
  "promote_max",
]);

export function isListingBoostProduct(productId: string) {
  return LISTING_BOOST_PRODUCT_IDS.has(productId);
}

/**
 * Clear paid promo flags when expiresAt has passed (or was never set and
 * the owner no longer has a featured-granting subscription).
 * Owners with an active featured plan keep flags and get expiresAt refreshed.
 */
export async function expireListingPromotions(now = new Date()) {
  const candidates = await prisma.property.findMany({
    where: {
      OR: [{ isFeatured: true }, { isSponsored: true }, { isPremium: true }],
      AND: [
        {
          OR: [{ expiresAt: { lte: now } }, { expiresAt: null }],
        },
      ],
    },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      expiresAt: true,
      isFeatured: true,
      isSponsored: true,
      isPremium: true,
    },
  });

  let demoted = 0;
  let refreshed = 0;
  const demotedIds: string[] = [];

  for (const listing of candidates) {
    // Still within a timed promo window — leave alone.
    if (listing.expiresAt && listing.expiresAt > now) continue;

    const subscription = await getActiveListingSubscription(listing.ownerId);
    const planFlags = subscription
      ? listingFlagsForPlan(subscription.plan)
      : ({} as {
          isFeatured?: boolean;
          isSponsored?: boolean;
          isPremium?: boolean;
        });
    const keepFeatured = Boolean(planFlags.isFeatured);
    const keepSponsored = Boolean(planFlags.isSponsored);
    const keepPremium = Boolean(planFlags.isPremium);

    if (keepFeatured || keepSponsored || keepPremium) {
      await prisma.property.update({
        where: { id: listing.id },
        data: {
          isFeatured: keepFeatured,
          isSponsored: keepSponsored,
          isPremium: keepPremium,
          expiresAt: subscription?.endDate ?? listing.expiresAt,
        },
      });
      refreshed += 1;
      revalidatePropertySlug(listing.slug);
      continue;
    }

    if (!listing.isFeatured && !listing.isSponsored && !listing.isPremium) {
      continue;
    }

    await prisma.property.update({
      where: { id: listing.id },
      data: {
        isFeatured: false,
        isSponsored: false,
        isPremium: false,
      },
    });
    demoted += 1;
    demotedIds.push(listing.id);
    revalidatePropertySlug(listing.slug);
  }

  return {
    checked: candidates.length,
    demoted,
    refreshed,
    demotedIds,
    at: now.toISOString(),
  };
}

export async function activateListingBoost(input: {
  userId: string;
  productId: string;
  paymentId?: string;
  propertyId?: string | null;
  amount?: number;
}) {
  const product = getProduct(input.productId);
  if (!product || !isListingBoostProduct(input.productId)) {
    return { updated: 0, propertyIds: [] as string[] };
  }

  const flags = listingFlagsForProduct(input.productId);
  const durationDays = product.durationDays ?? 14;
  const now = new Date();
  const boostUntil = new Date(
    now.getTime() + durationDays * 24 * 60 * 60 * 1000,
  );

  const needsSpecificListing = input.productId.startsWith("promote_");
  if (needsSpecificListing && !input.propertyId) {
    throw new Error("Select a listing to promote");
  }

  const listings = await prisma.property.findMany({
    where: {
      ownerId: input.userId,
      status: "ACTIVE",
      ...(input.propertyId ? { id: input.propertyId } : {}),
    },
    select: { id: true, slug: true, expiresAt: true },
  });

  if (listings.length === 0) {
    if (input.propertyId) {
      throw new Error("Listing not found or not active yet");
    }
    return { updated: 0, propertyIds: [] as string[] };
  }

  for (const listing of listings) {
    const nextExpires =
      listing.expiresAt && listing.expiresAt > now
        ? new Date(
            listing.expiresAt.getTime() + durationDays * 24 * 60 * 60 * 1000,
          )
        : boostUntil;

    await prisma.property.update({
      where: { id: listing.id },
      data: {
        ...(flags.isFeatured ? { isFeatured: true } : {}),
        ...(flags.isSponsored ? { isSponsored: true } : {}),
        ...(flags.isPremium ? { isPremium: true } : {}),
        expiresAt: nextExpires,
      },
    });

    revalidatePropertySlug(listing.slug);
  }

  if (input.paymentId) {
    const existing = await prisma.payment.findUnique({
      where: { id: input.paymentId },
      select: { metadata: true },
    });
    const prior = (existing?.metadata as Record<string, unknown>) ?? {};

    await prisma.payment
      .update({
        where: { id: input.paymentId },
        data: {
          metadata: {
            ...prior,
            productId: input.productId,
            propertyId: input.propertyId ?? null,
            boostedPropertyIds: listings.map((l) => l.id),
            boostActivatedAt: now.toISOString(),
          },
        },
      })
      .catch(() => null);
  }

  return {
    updated: listings.length,
    propertyIds: listings.map((l) => l.id),
    expiresAt: boostUntil.toISOString(),
  };
}
