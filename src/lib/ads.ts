import type { AdPlacement } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const AD_PLACEMENTS = [
  "HOME_BANNER",
  "SIDEBAR",
  "SEARCH_SPONSORED",
  "PROPERTY_DETAIL",
] as const;

export type SiteAdPlacement = (typeof AD_PLACEMENTS)[number];

export const AD_PLACEMENT_LABELS: Record<SiteAdPlacement, string> = {
  HOME_BANNER: "Homepage banner",
  SIDEBAR: "Search sidebar",
  SEARCH_SPONSORED: "Sponsored in search",
  PROPERTY_DETAIL: "Property page",
};

export type PublicAd = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: SiteAdPlacement;
};

export function isAdPlacement(value: string): value is SiteAdPlacement {
  return (AD_PLACEMENTS as readonly string[]).includes(value);
}

export function normalizeAdLink(
  value?: string | null,
): string | null | "__invalid__" {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return trimmed;
    }
  } catch {
    return "__invalid__";
  }
  return "__invalid__";
}

export function endOfAdDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function serializeAd(ad: {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: AdPlacement;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  clicks: number;
  impressions: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: ad.id,
    title: ad.title,
    imageUrl: ad.imageUrl,
    linkUrl: ad.linkUrl,
    placement: ad.placement,
    isActive: ad.isActive,
    startDate: ad.startDate?.toISOString() ?? null,
    endDate: ad.endDate?.toISOString() ?? null,
    clicks: ad.clicks,
    impressions: ad.impressions,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  };
}

export async function getActiveAds(
  placement: SiteAdPlacement,
  take = 3,
): Promise<PublicAd[]> {
  const now = new Date();
  try {
    const ads = await prisma.advertisement.findMany({
      where: {
        placement,
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        placement: true,
      },
    });
    return ads.filter((ad) => Boolean(ad.imageUrl));
  } catch {
    return [];
  }
}
