import { prisma } from "@/lib/prisma";
import {
  HOTEL_PLANS,
  HOTEL_PLAN_TIER_IDS,
  type HotelPlanProduct,
  type HotelPlanTierId,
} from "@/lib/hotel-plans";
import {
  getProduct,
  hotelProductIdToTier,
  isHotelPlanProduct,
  type PricingProduct,
} from "@/lib/pricing";

export type HotelPlanPriceUpdate = {
  tier: HotelPlanTierId;
  price: number;
  currency?: string;
};

export async function getHotelPlanPriceOverrides() {
  return prisma.hotelPlanPriceConfig.findMany({
    orderBy: { tier: "asc" },
  });
}

export async function getEffectiveHotelPlans(): Promise<HotelPlanProduct[]> {
  const overrides = await getHotelPlanPriceOverrides();
  const map = new Map(overrides.map((row) => [row.tier, row]));

  return HOTEL_PLANS.map((plan) => {
    const override = map.get(plan.id);
    if (!override) return plan;
    return {
      ...plan,
      price: override.price,
      currency: (override.currency || plan.currency) as "KES",
    };
  });
}

export async function getEffectiveHotelPlan(
  tier: HotelPlanTierId | string,
): Promise<HotelPlanProduct> {
  const plans = await getEffectiveHotelPlans();
  return plans.find((p) => p.id === tier) ?? plans[0];
}

export async function updateHotelPlanPrices(
  updates: HotelPlanPriceUpdate[],
): Promise<HotelPlanProduct[]> {
  const validTiers = new Set(HOTEL_PLAN_TIER_IDS);

  for (const row of updates) {
    if (!validTiers.has(row.tier)) {
      throw new Error(`Invalid hotel plan tier: ${row.tier}`);
    }
    if (row.tier === "FREE" && row.price !== 0) {
      throw new Error("Free hotel plan must stay at KES 0");
    }
    if (row.tier !== "FREE" && row.price <= 0) {
      throw new Error(`Price for ${row.tier} must be greater than zero`);
    }
  }

  await prisma.$transaction(
    updates.map((row) =>
      prisma.hotelPlanPriceConfig.upsert({
        where: { tier: row.tier },
        create: {
          tier: row.tier,
          price: row.price,
          currency: row.currency?.trim() || "KES",
        },
        update: {
          price: row.price,
          currency: row.currency?.trim() || "KES",
        },
      }),
    ),
  );

  return getEffectiveHotelPlans();
}

export async function resolveProductWithLivePricing(
  product: PricingProduct,
): Promise<PricingProduct> {
  if (!isHotelPlanProduct(product.id)) return product;
  const tier = hotelProductIdToTier(product.id);
  if (!tier) return product;
  const plan = await getEffectiveHotelPlan(tier);
  return {
    ...product,
    price: plan.price,
    currency: plan.currency,
  };
}

export async function getProductWithLivePricing(
  id: string,
): Promise<PricingProduct | undefined> {
  const base = getProduct(id);
  if (!base) return undefined;
  return resolveProductWithLivePricing(base);
}
