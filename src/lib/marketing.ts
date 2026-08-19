import { prisma } from "@/lib/prisma";
import type { PropertyType } from "@/types";

export interface BrowseCategory {
  label: string;
  slug: string;
  propertyType: PropertyType | "BNB";
  listingCount: number;
  image: string;
}

export interface TopLocation {
  name: string;
  slug: string;
  county: string;
  listingCount: number;
  image: string;
}

const unsplash = (id: string, width = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const CATEGORY_CONFIG: Omit<BrowseCategory, "listingCount">[] = [
  {
    label: "Apartments",
    slug: "apartments",
    propertyType: "APARTMENT",
    image: unsplash("photo-1502672260266-1c1ef2d93688", 600),
  },
  {
    label: "Houses & Villas",
    slug: "houses-villas",
    propertyType: "HOUSE",
    image: unsplash("photo-1600596542815-ffad4c1539a9", 600),
  },
  {
    label: "Land & Plots",
    slug: "land-plots",
    propertyType: "PLOT",
    image: unsplash("photo-1500382017468-9049fed747ef", 600),
  },
  {
    label: "Commercial",
    slug: "commercial",
    propertyType: "OFFICE",
    image: unsplash("photo-1486406146926-c627a92ad1ab", 600),
  },
  {
    label: "BnB & Holiday",
    slug: "bnb",
    propertyType: "BNB",
    image: unsplash("photo-1582268611958-ebfd161ef9cf", 600),
  },
  {
    label: "Maisonettes",
    slug: "maisonettes",
    propertyType: "MAISONETTE",
    image: unsplash("photo-1600607687939-ce8a6c25118c", 600),
  },
];

const LOCATION_CONFIG: Omit<TopLocation, "listingCount">[] = [
  {
    name: "Nairobi",
    slug: "nairobi",
    county: "Nairobi",
    image: unsplash("photo-1600585154340-be6161a56a0c"),
  },
  {
    name: "Mombasa",
    slug: "mombasa",
    county: "Mombasa",
    image: unsplash("photo-1544551763-46a013bb70d5"),
  },
  {
    name: "Kisumu",
    slug: "kisumu",
    county: "Kisumu",
    image: unsplash("photo-1564013799919-ab600027ffc6"),
  },
  {
    name: "Nakuru",
    slug: "nakuru",
    county: "Nakuru",
    image: unsplash("photo-1500382017468-9049fed747ef"),
  },
  {
    name: "Kiambu",
    slug: "kiambu",
    county: "Kiambu",
    image: unsplash("photo-1600607687939-ce8a6c25118c"),
  },
  {
    name: "Eldoret",
    slug: "eldoret",
    county: "Uasin Gishu",
    image: unsplash("photo-1564013799919-ab600027ffc6"),
  },
];

export async function getBrowseCategories(): Promise<BrowseCategory[]> {
  try {
    const [byType, bnbCount, landCount, commercialCount] = await Promise.all([
      prisma.property.groupBy({
        by: ["propertyType"],
        where: { status: "ACTIVE" },
        _count: { _all: true },
      }),
      prisma.property.count({
        where: { status: "ACTIVE", listingType: "HOLIDAY" },
      }),
      prisma.property.count({
        where: {
          status: "ACTIVE",
          OR: [
            { propertyType: "PLOT" },
            { propertyType: "FARM" },
            { listingType: "LAND" },
          ],
        },
      }),
      prisma.property.count({
        where: {
          status: "ACTIVE",
          OR: [
            { listingType: "COMMERCIAL" },
            { propertyType: "OFFICE" },
            { propertyType: "SHOP" },
            { propertyType: "WAREHOUSE" },
          ],
        },
      }),
    ]);

    const counts = new Map(
      byType.map((row) => [row.propertyType, row._count._all]),
    );

    return CATEGORY_CONFIG.map((cat) => ({
      ...cat,
      listingCount:
        cat.slug === "land-plots"
          ? landCount
          : cat.slug === "commercial"
            ? commercialCount
            : cat.propertyType === "BNB"
              ? bnbCount
              : (counts.get(cat.propertyType as PropertyType) ?? 0),
    }));
  } catch {
    return CATEGORY_CONFIG.map((cat) => ({ ...cat, listingCount: 0 }));
  }
}

export async function getTopLocations(limit = 6): Promise<TopLocation[]> {
  try {
    const byCounty = await prisma.property.groupBy({
      by: ["county"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
      orderBy: { _count: { county: "desc" } },
      take: limit,
    });

    const countMap = new Map(
      byCounty.map((row) => [row.county.toLowerCase(), row._count._all]),
    );

    const fromDb = LOCATION_CONFIG.filter((loc) =>
      countMap.has(loc.county.toLowerCase()),
    ).map((loc) => ({
      ...loc,
      listingCount: countMap.get(loc.county.toLowerCase()) ?? 0,
    }));

    if (fromDb.length > 0) {
      return fromDb.sort((a, b) => b.listingCount - a.listingCount).slice(0, limit);
    }

    return byCounty.map((row) => ({
      name: row.county,
      slug: row.county.toLowerCase().replace(/\s+/g, "-"),
      county: row.county,
      listingCount: row._count._all,
      image: unsplash("photo-1600585154340-be6161a56a0c"),
    }));
  } catch {
    return [];
  }
}
