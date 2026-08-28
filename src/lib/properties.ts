import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import type { z } from "zod";
import { MAX_LISTING_IMAGES } from "@/lib/listing-media";
import { prisma } from "@/lib/prisma";
import type { propertySearchSchema } from "@/lib/validations/property";
import type { ListingType, PropertyCard, PropertyStatus } from "@/types";

type SearchFilters = z.infer<typeof propertySearchSchema>;

type PropertyWithImages = Prisma.PropertyGetPayload<{
  include: {
    images: true;
    videos: {
      select: { url: true; title: true };
      take: 1;
    };
    rentalRooms: { select: { id: true; status: true } };
    owner: {
      select: {
        id: true;
        name: true;
        role: true;
        verificationStatus: true;
        updatedAt: true;
      };
    };
    agent: {
      select: {
        id: true;
        isVerified: true;
        agencyName: true;
        user: {
          select: {
            id: true;
            name: true;
            verificationStatus: true;
            updatedAt: true;
          };
        };
      };
    };
  };
}>;

const listingHostInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      role: true,
      verificationStatus: true,
      updatedAt: true,
    },
  },
  agent: {
    select: {
      id: true,
      isVerified: true,
      agencyName: true,
      user: {
        select: {
          id: true,
          name: true,
          verificationStatus: true,
          updatedAt: true,
        },
      },
    },
  },
} as const;

function listingAvatarUrl(userId: string, updatedAt?: Date | string | null) {
  const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  return `/api/users/${encodeURIComponent(userId)}/avatar?v=${version}`;
}

const imageInclude = {
  // Listings only need the primary/first photo for cards & related sections.
  images: { orderBy: { order: "asc" as const }, take: 1 },
  videos: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { url: true, title: true },
  },
  rentalRooms: {
    select: { id: true, status: true },
    orderBy: { sortOrder: "asc" as const },
  },
  ...listingHostInclude,
} as const;

const galleryImageInclude = {
  images: { orderBy: { order: "asc" as const }, take: MAX_LISTING_IMAGES },
  videos: true,
  rentalRooms: {
    select: { id: true, status: true },
    orderBy: { sortOrder: "asc" as const },
  },
  ...listingHostInclude,
} as const;

export function resolveListingHost(
  property: Pick<PropertyWithImages, "owner" | "agent">,
) {
  if (property.agent?.user) {
    return {
      id: property.agent.user.id,
      name: property.agent.user.name ?? property.agent.agencyName ?? "Agent",
      image: listingAvatarUrl(
        property.agent.user.id,
        property.agent.user.updatedAt,
      ),
      role: "AGENT" as const,
      isVerified:
        property.agent.isVerified ||
        property.agent.user.verificationStatus === "VERIFIED",
      agencyName: property.agent.agencyName,
      agentProfileId: property.agent.id,
    };
  }

  if (property.owner) {
    return {
      id: property.owner.id,
      name: property.owner.name ?? "Landlord",
      image: listingAvatarUrl(property.owner.id, property.owner.updatedAt),
      role: property.owner.role,
      isVerified: property.owner.verificationStatus === "VERIFIED",
      agencyName: null,
    };
  }

  return null;
}

export function toPropertyCard(property: PropertyWithImages): PropertyCard {
  const primary =
    property.images.find((i) => i.isPrimary) ?? property.images[0] ?? null;
  const rooms = property.rentalRooms ?? [];
  const rentalRoomsTotal = rooms.length > 0 ? rooms.length : undefined;
  const rentalRoomsAvailable =
    rooms.length > 0
      ? rooms.filter((r) => r.status === "AVAILABLE").length
      : undefined;

  return {
    id: property.id,
    title: property.title,
    slug: property.slug,
    price: property.price,
    discountPercent: property.discountPercent ?? 0,
    currency: property.currency,
    listingType: property.listingType,
    propertyType: property.propertyType,
    status: property.status as PropertyStatus,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    country: property.country,
    county: property.county,
    town: property.town,
    estate: property.estate,
    parkingSpaces: property.parkingSpaces,
    furnished: property.furnished,
    swimmingPool: property.swimmingPool,
    security: property.security,
    isFeatured: property.isFeatured,
    isPremium: property.isPremium,
    isVerified: property.isVerified,
    views: property.views,
    publishedAt: property.publishedAt,
    primaryImage: primary,
    images: property.images,
    videos: property.videos ?? [],
    rentalRoomsAvailable,
    rentalRoomsTotal,
    host: resolveListingHost(property),
  };
}

function buildWhere(filters: Partial<SearchFilters> = {}) {
  const shared = {
    status: "ACTIVE" as const,
    ...(filters.county
      ? { county: { contains: filters.county, mode: "insensitive" as const } }
      : {}),
    ...(filters.country
      ? { country: { equals: filters.country, mode: "insensitive" as const } }
      : {}),
    ...(filters.town
      ? { town: { contains: filters.town, mode: "insensitive" as const } }
      : {}),
    ...(filters.minPrice != null ? { price: { gte: filters.minPrice } } : {}),
    ...(filters.maxPrice != null ? { price: { lte: filters.maxPrice } } : {}),
    ...(filters.bedrooms != null ? { bedrooms: { gte: filters.bedrooms } } : {}),
    ...(filters.bathrooms != null
      ? { bathrooms: { gte: filters.bathrooms } }
      : {}),
    ...(filters.furnished != null ? { furnished: filters.furnished } : {}),
    ...(filters.swimmingPool != null
      ? { swimmingPool: filters.swimmingPool }
      : {}),
    ...(filters.security != null ? { security: filters.security } : {}),
    ...(filters.agentId ? { agentId: filters.agentId } : {}),
  };

  if (filters.category === "land-plots") {
    return {
      ...shared,
      OR: [
        { propertyType: "PLOT" as const },
        { propertyType: "FARM" as const },
        { listingType: "LAND" as const },
      ],
    };
  }

  if (filters.category === "commercial") {
    return {
      ...shared,
      OR: [
        { listingType: "COMMERCIAL" as const },
        { propertyType: "OFFICE" as const },
        { propertyType: "SHOP" as const },
        { propertyType: "WAREHOUSE" as const },
      ],
    };
  }

  return {
    ...shared,
    ...(filters.listingType ? { listingType: filters.listingType } : {}),
    ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
  };
}

export async function searchProperties(filters: SearchFilters) {
  const skip = (filters.page - 1) * filters.limit;

  return unstable_cache(
    async () => {
      try {
        const where = buildWhere(filters);
        const [properties, total] = await Promise.all([
          prisma.property.findMany({
            where,
            skip,
            take: filters.limit,
            orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
            include: imageInclude,
          }),
          prisma.property.count({ where }),
        ]);

        const totalPages = Math.ceil(total / filters.limit);

        return {
          data: properties.map(toPropertyCard),
          total,
          page: filters.page,
          limit: filters.limit,
          totalPages,
          hasMore: filters.page < totalPages,
        };
      } catch {
        return {
          data: [] as PropertyCard[],
          total: 0,
          page: filters.page,
          limit: filters.limit,
          totalPages: 0,
          hasMore: false,
        };
      }
    },
    ["search-properties", JSON.stringify(filters)],
    { revalidate: 60, tags: ["active-listings"] },
  )();
}

async function getActiveProperties(
  options: {
    listingType?: ListingType;
    featured?: boolean;
    limit?: number;
  } = {},
): Promise<PropertyCard[]> {
  const { listingType, featured, limit = 20 } = options;

  return unstable_cache(
    async () => {
      try {
        const properties = await prisma.property.findMany({
          where: {
            status: "ACTIVE",
            ...(listingType ? { listingType } : {}),
            ...(featured ? { isFeatured: true } : {}),
          },
          take: limit,
          orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
          include: imageInclude,
        });

        return properties.map(toPropertyCard);
      } catch {
        return [];
      }
    },
    [
      "active-properties",
      listingType ?? "all",
      featured ? "featured" : "any",
      String(limit),
    ],
    { revalidate: 120, tags: ["active-listings"] },
  )();
}

const FOR_SALE_LISTING_TYPES = ["BUY", "LAND"] as const;

export async function searchListingsByLocation(input: {
  listingTypes: readonly ListingType[];
  country?: string;
  county?: string;
  town?: string;
  limit?: number;
}) {
  const limit = input.limit ?? 24;
  const listingKey = [...input.listingTypes].sort().join(",");
  const country = input.country ?? "";
  const county = input.county ?? "";
  const town = input.town ?? "";

  return unstable_cache(
    async () => {
      const where = {
        status: "ACTIVE" as const,
        listingType: { in: [...input.listingTypes] },
        ...(input.country
          ? { country: { equals: input.country, mode: "insensitive" as const } }
          : {}),
        ...(input.county
          ? { county: { equals: input.county, mode: "insensitive" as const } }
          : {}),
        ...(input.town
          ? { town: { contains: input.town, mode: "insensitive" as const } }
          : {}),
      };

      try {
        const [properties, total, stats] = await Promise.all([
          prisma.property.findMany({
            where,
            take: limit,
            orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
            include: imageInclude,
          }),
          prisma.property.count({ where }),
          prisma.property.aggregate({
            where,
            _min: { price: true },
            _max: { price: true },
          }),
        ]);

        return {
          data: properties.map(toPropertyCard),
          total,
          minPrice: stats._min.price,
          maxPrice: stats._max.price,
        };
      } catch {
        return {
          data: [] as PropertyCard[],
          total: 0,
          minPrice: null as number | null,
          maxPrice: null as number | null,
        };
      }
    },
    ["listings-by-location", listingKey, country, county, town, String(limit)],
    { revalidate: 3600, tags: ["listings-by-location", "active-listings"] },
  )();
}

export async function searchForSaleByLocation(input: {
  country?: string;
  county?: string;
  town?: string;
  limit?: number;
}) {
  return searchListingsByLocation({
    listingTypes: FOR_SALE_LISTING_TYPES,
    country: input.country,
    county: input.county,
    town: input.town,
    limit: input.limit,
  });
}

export async function getForSaleCountsByCounty() {
  return unstable_cache(
    async () => {
      try {
        const rows = await prisma.property.groupBy({
          by: ["county"],
          where: {
            status: "ACTIVE",
            listingType: { in: [...FOR_SALE_LISTING_TYPES] },
          },
          _count: { _all: true },
        });
        const counts: Record<string, number> = {};
        for (const row of rows) {
          counts[row.county.trim().toLowerCase()] = row._count._all;
        }
        return counts;
      } catch {
        return {} as Record<string, number>;
      }
    },
    ["for-sale-counts-county"],
    { revalidate: 3600, tags: ["listing-counts", "active-listings"] },
  )();
}

export async function getListingCountsByCountry(
  listingTypes: readonly ListingType[] = FOR_SALE_LISTING_TYPES,
) {
  const listingKey = [...listingTypes].sort().join(",");
  return unstable_cache(
    async () => {
      try {
        const rows = await prisma.property.groupBy({
          by: ["country"],
          where: {
            status: "ACTIVE",
            listingType: { in: [...listingTypes] },
          },
          _count: { _all: true },
        });
        const counts: Record<string, number> = {};
        for (const row of rows) {
          const name = row.country?.trim().toLowerCase();
          if (name) counts[name] = row._count._all;
        }
        return counts;
      } catch {
        return {} as Record<string, number>;
      }
    },
    ["listing-counts-country", listingKey],
    { revalidate: 3600, tags: ["listing-counts", "active-listings"] },
  )();
}

export async function countActiveProperties(listingType?: ListingType) {
  return unstable_cache(
    async () => {
      try {
        return await prisma.property.count({
          where: {
            status: "ACTIVE",
            ...(listingType ? { listingType } : {}),
          },
        });
      } catch {
        return 0;
      }
    },
    ["count-active", listingType ?? "all"],
    { revalidate: 120, tags: ["active-listings"] },
  )();
}

export function getFeaturedPropertiesForHome(limit = 8) {
  return getActiveProperties({ featured: true, limit });
}

export function getRentalPropertiesForHome(limit = 8) {
  return getActiveProperties({ listingType: "RENT", limit });
}

export function getBnbPropertiesForHome(limit = 8) {
  return getActiveProperties({ listingType: "HOLIDAY", limit });
}

export function getHotelPropertiesForHome(limit = 8) {
  return getActiveProperties({ listingType: "HOTEL", limit });
}

export function getLatestPropertiesForHome(limit = 8) {
  return getActiveProperties({ limit });
}

const propertyDetailInclude = {
  images: { orderBy: { order: "asc" as const }, take: 1 },
  videos: true,
  amenities: {
    take: 80,
    include: { amenity: { select: { name: true, icon: true, category: true } } },
  },
  nearbyPlaces: {
    take: 6,
    select: { id: true, name: true, type: true, distance: true },
  },
  rentalRooms: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      label: true,
      floor: true,
      price: true,
      status: true,
    },
  },
  rentalPlot: {
    select: {
      id: true,
      name: true,
      county: true,
      town: true,
      estate: true,
    },
  },
  owner: {
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      verificationStatus: true,
      updatedAt: true,
    },
  },
  agent: {
    select: {
      id: true,
      isVerified: true,
      agencyName: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          verificationStatus: true,
          updatedAt: true,
        },
      },
    },
  },
} as const;

async function fetchPropertyBySlug(slug: string) {
  return prisma.property.findUnique({
    where: { slug },
    include: propertyDetailInclude,
  });
}

export const getPropertyBySlug = cache(async (slug: string) => {
  try {
    const property = await unstable_cache(
      () => fetchPropertyBySlug(slug),
      [`property-detail-${slug}`],
      { revalidate: 60, tags: [`property:${slug}`] },
    )();

    if (property) return { property };
  } catch {
    // database unavailable
  }

  return null;
});

export function revalidatePropertySlug(slug: string) {
  revalidateTag(`property:${slug}`);
  revalidateTag("active-listings");
  revalidateTag("listings-by-location");
  revalidateTag("listing-counts");
  revalidatePath("/");
  revalidatePath("/rent");
  revalidatePath("/bnb");
  revalidatePath("/properties");
  revalidatePath("/property-for-sale");
  revalidatePath(`/properties/${slug}`);
}

export async function getPropertyBySlugFresh(slug: string) {
  try {
    const property = await fetchPropertyBySlug(slug);
    if (property) return { property };
  } catch {
    // database unavailable
  }
  return null;
}

export async function getRelatedProperties(
  slug: string,
  county: string,
  limit = 3,
): Promise<PropertyCard[]> {
  return unstable_cache(
    async () => {
      try {
        const properties = await prisma.property.findMany({
          where: {
            status: "ACTIVE",
            county: { equals: county, mode: "insensitive" },
            slug: { not: slug },
          },
          take: limit,
          orderBy: { publishedAt: "desc" },
          include: imageInclude,
        });

        return properties.map(toPropertyCard);
      } catch {
        return [];
      }
    },
    ["related-properties", slug, county, String(limit)],
    { revalidate: 300, tags: ["active-listings"] },
  )();
}

export async function getPropertiesByIds(ids: string[]): Promise<PropertyCard[]> {
  if (ids.length === 0) return [];

  try {
    const properties = await prisma.property.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ id: { in: ids } }, { slug: { in: ids } }],
      },
      include: imageInclude,
    });

    const order = new Map(ids.map((id, index) => [id, index]));
    return properties
      .map(toPropertyCard)
      .sort(
        (a, b) =>
          (order.get(a.id) ?? order.get(a.slug) ?? 99) -
          (order.get(b.id) ?? order.get(b.slug) ?? 99),
      );
  } catch {
    return [];
  }
}

export async function getOwnerListings(ownerId: string) {
  try {
    const properties = await prisma.property.findMany({
      where: {
        OR: [{ ownerId }, { agent: { userId: ownerId } }],
      },
      orderBy: { updatedAt: "desc" },
      include: galleryImageInclude,
    });

    return properties.map((property) => ({
      ...toPropertyCard(property),
      description: property.description,
      latitude: property.latitude,
      longitude: property.longitude,
      address: property.address,
      videos: property.videos ?? [],
    }));
  } catch {
    return [];
  }
}

export async function getAllPropertiesForAdmin() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      include: imageInclude,
    });

    return properties.map(toPropertyCard);
  } catch {
    return [] as PropertyCard[];
  }
}
