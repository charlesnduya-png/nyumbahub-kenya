import type { HotelPlanTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hotelProductIdToTier } from "@/lib/pricing";
import {
  getHotelPlan,
  normalizeHotelPlanTier,
  type HotelPlanTierId,
  canCreateHotelPackages,
  isHotelSectionMuted,
} from "@/lib/hotel-plans";

export type HotelPlanUsage = {
  tier: HotelPlanTierId;
  planName: string;
  limits: ReturnType<typeof getHotelPlan>["limits"];
  packagesUsed: number;
  eventRequestsThisMonth: number;
  endDate: string | null;
};

function monthStart(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getHotelPlanTier(userId: string): Promise<HotelPlanTierId> {
  const row = await prisma.hotelAccountPlan.findUnique({
    where: { userId },
  });
  if (!row) return "FREE";
  if (row.endDate && row.endDate < new Date()) return "FREE";
  return normalizeHotelPlanTier(row.tier);
}

export async function getHotelPlanUsage(userId: string): Promise<HotelPlanUsage> {
  const tier = await getHotelPlanTier(userId);
  const plan = getHotelPlan(tier);
  const row = await prisma.hotelAccountPlan.findUnique({ where: { userId } });

  const [packagesUsed, eventRequestsThisMonth] = await Promise.all([
    prisma.hotelPackage.count({ where: { ownerId: userId, isActive: true } }),
    prisma.hotelServiceRequest.count({
      where: {
        ownerId: userId,
        category: "EVENT_BOOKING_REQUEST",
        createdAt: { gte: monthStart() },
      },
    }),
  ]);

  return {
    tier,
    planName: plan.name,
    limits: plan.limits,
    packagesUsed,
    eventRequestsThisMonth,
    endDate: row?.endDate?.toISOString() ?? null,
  };
}

export async function setHotelPlanTier(
  userId: string,
  tier: HotelPlanTier,
  durationDays = 30,
): Promise<void> {
  const endDate =
    tier === "FREE"
      ? null
      : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.hotelAccountPlan.upsert({
    where: { userId },
    create: { userId, tier, endDate },
    update: { tier, endDate, startDate: new Date() },
  });
}

export async function assertCanCreateHotelPackage(userId: string) {
  const usage = await getHotelPlanUsage(userId);
  if (!canCreateHotelPackages(usage.tier)) {
    return {
      ok: false as const,
      error: "Hotel packages require a paid hotel plan. Upgrade in Hotels → Plans.",
      code: "HOTEL_PLAN_REQUIRED" as const,
    };
  }
  const max = usage.limits.maxHotelPackages;
  if (max !== null && usage.packagesUsed >= max) {
    return {
      ok: false as const,
      error: `Your ${usage.planName} plan allows up to ${max} active packages. Upgrade to Pro for more.`,
      code: "HOTEL_PACKAGE_LIMIT" as const,
    };
  }
  return { ok: true as const, usage };
}

export async function assertHotelSectionAccess(
  userId: string,
  sectionKey: string,
) {
  const usage = await getHotelPlanUsage(userId);
  if (isHotelSectionMuted(usage.tier, sectionKey)) {
    return {
      ok: false as const,
      error: `This section requires a paid hotel plan. Upgrade in Hotels → Plans.`,
      code: "HOTEL_SECTION_MUTED" as const,
      usage,
    };
  }
  return { ok: true as const, usage };
}

export async function assertCanReceiveEventRequest(userId: string) {
  const usage = await getHotelPlanUsage(userId);
  const cap = usage.limits.eventRequestsPerMonth;
  if (cap === 0) {
    return {
      ok: false as const,
      error: "Event booking requests require a paid hotel plan.",
      code: "HOTEL_PLAN_REQUIRED" as const,
    };
  }
  if (cap !== null && usage.eventRequestsThisMonth >= cap) {
    return {
      ok: false as const,
      error: `Starter plan allows ${cap} event requests per month. Upgrade to Pro for unlimited.`,
      code: "HOTEL_EVENT_LIMIT" as const,
    };
  }
  return { ok: true as const, usage };
}

export function assertHotelImageCount(tier: HotelPlanTierId, count: number) {
  const max = getHotelPlan(tier).limits.maxImages;
  if (count > max) {
    return {
      ok: false as const,
      error: `Your ${getHotelPlan(tier).name} plan allows up to ${max} photos per hotel listing.`,
      code: "HOTEL_IMAGE_LIMIT" as const,
    };
  }
  return { ok: true as const, max };
}

export async function activateHotelPlanFromPayment(input: {
  userId: string;
  productId: string;
}) {
  const tier = hotelProductIdToTier(input.productId);
  if (!tier) return;

  const plan = getHotelPlan(tier);
  await setHotelPlanTier(
    input.userId,
    tier as HotelPlanTier,
    plan.durationDays,
  );
}
