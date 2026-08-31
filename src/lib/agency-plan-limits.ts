import { prisma } from "@/lib/prisma";
import {
  AGENCY_PLANS,
  type AgencyPlanDefinition,
  type AgencyPlanTierId,
} from "@/lib/agency-plans";
import { AGENT_PRODUCTS, getProduct, type PricingProduct } from "@/lib/pricing";

/** Admin override: unlimited active listings for this account. */
export const UNLIMITED_LISTING_OVERRIDE = -1;

export type AgencyListingLimitUpdate = {
  tier: AgencyPlanTierId;
  maxListings: number | null;
};

export async function getAgencyListingLimitOverrides() {
  return prisma.agencyPlanListingConfig.findMany({
    orderBy: { tier: "asc" },
  });
}

export async function getEffectiveAgencyPlans(): Promise<AgencyPlanDefinition[]> {
  const overrides = await getAgencyListingLimitOverrides();
  const map = new Map(overrides.map((row) => [row.tier, row.maxListings]));

  return AGENCY_PLANS.map((plan) => {
    if (!map.has(plan.id)) return plan;
    return {
      ...plan,
      maxListings: map.get(plan.id) ?? plan.maxListings,
    };
  });
}

export async function getEffectiveFreeMaxListings(): Promise<number> {
  const plans = await getEffectiveAgencyPlans();
  return plans.find((p) => p.id === "FREE")?.maxListings ?? 3;
}

export async function getEffectiveAgentProduct(
  productId: string,
): Promise<PricingProduct | undefined> {
  const base = getProduct(productId);
  if (!base) return undefined;

  const tier = AGENCY_PLANS.find((p) => p.productId === productId)?.id;
  if (!tier) return base;

  const plans = await getEffectiveAgencyPlans();
  const plan = plans.find((p) => p.id === tier);
  if (!plan) return base;

  return {
    ...base,
    maxListings: plan.maxListings ?? undefined,
    features: plan.features,
  };
}

export async function updateAgencyPlanListingLimits(
  updates: AgencyListingLimitUpdate[],
): Promise<AgencyPlanDefinition[]> {
  const validTiers = new Set(AGENCY_PLANS.map((p) => p.id));

  for (const row of updates) {
    if (!validTiers.has(row.tier)) {
      throw new Error(`Invalid agency plan tier: ${row.tier}`);
    }
    if (row.tier === "FREE" && (row.maxListings == null || row.maxListings < 0)) {
      throw new Error("Free tier needs a non-negative listing cap");
    }
    if (
      row.tier !== "FREE" &&
      row.maxListings != null &&
      row.maxListings < 0 &&
      row.maxListings !== UNLIMITED_LISTING_OVERRIDE
    ) {
      throw new Error(`Invalid listing cap for ${row.tier}`);
    }
  }

  await prisma.$transaction(
    updates.map((row) =>
      prisma.agencyPlanListingConfig.upsert({
        where: { tier: row.tier },
        create: {
          tier: row.tier,
          maxListings: row.maxListings,
        },
        update: {
          maxListings: row.maxListings,
        },
      }),
    ),
  );

  return getEffectiveAgencyPlans();
}

export function formatListingLimitValue(maxListings: number | null | undefined) {
  if (maxListings == null || maxListings === UNLIMITED_LISTING_OVERRIDE) {
    return "Unlimited";
  }
  return String(maxListings);
}

export function isUnlimitedListingLimit(limit: number | null | undefined) {
  return limit == null || limit === UNLIMITED_LISTING_OVERRIDE;
}

/** Resolve the effective cap for a user, considering admin override. */
export async function resolveUserListingLimit(input: {
  userId: string;
  role?: string | null;
  listingLimitOverride?: number | null;
  planLimit?: number | null;
}): Promise<number | null> {
  if (input.role === "ADMIN") return null;

  const override =
    input.listingLimitOverride !== undefined
      ? input.listingLimitOverride
      : (
          await prisma.user.findUnique({
            where: { id: input.userId },
            select: { listingLimitOverride: true },
          })
        )?.listingLimitOverride;

  if (override === UNLIMITED_LISTING_OVERRIDE) return null;
  if (typeof override === "number" && override >= 0) return override;

  return input.planLimit ?? null;
}

export async function getAgentProductsWithLiveLimits(): Promise<PricingProduct[]> {
  const plans = await getEffectiveAgencyPlans();
  return AGENT_PRODUCTS.map((product) => {
    const tier = AGENCY_PLANS.find((p) => p.productId === product.id)?.id;
    const plan = tier ? plans.find((p) => p.id === tier) : null;
    if (!plan) return product;
    return {
      ...product,
      maxListings: plan.maxListings ?? undefined,
      features: plan.features,
    };
  });
}
