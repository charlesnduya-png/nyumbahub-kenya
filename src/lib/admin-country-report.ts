import { DEFAULT_LISTING_COUNTRY } from "@/lib/african-countries";
import { isStayListing } from "@/lib/listing-kinds";

export interface CountryReportListing {
  country?: string | null;
  status: string;
  views: number;
  createdAt: string;
  listingType: string;
}

export interface CountryStat {
  country: string;
  listings: number;
  active: number;
  pending: number;
  views: number;
  buy: number;
  rent: number;
}

export interface WeekTrendPoint {
  label: string;
  start: string;
  kenya: number;
  restOfAfrica: number;
  total: number;
}

export interface CountryListingsReport {
  total: number;
  countriesLive: number;
  kenya: number;
  restOfAfrica: number;
  active: number;
  pending: number;
  views: number;
  byCountry: CountryStat[];
  weekly: WeekTrendPoint[];
}

function countryName(value?: string | null) {
  const name = value?.trim();
  return name && name.length > 0 ? name : DEFAULT_LISTING_COUNTRY;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  return d;
}

export function buildCountryListingsReport(
  listings: CountryReportListing[],
  weeks = 12,
): CountryListingsReport {
  const byCountry = new Map<string, CountryStat>();

  for (const listing of listings) {
    const country = countryName(listing.country);
    const current = byCountry.get(country) ?? {
      country,
      listings: 0,
      active: 0,
      pending: 0,
      views: 0,
      buy: 0,
      rent: 0,
    };
    current.listings += 1;
    current.views += listing.views ?? 0;
    if (listing.status === "ACTIVE") current.active += 1;
    if (listing.status === "PENDING") current.pending += 1;
    if (listing.listingType === "BUY" || listing.listingType === "LAND") {
      current.buy += 1;
    }
    if (listing.listingType === "RENT" || isStayListing(listing.listingType)) {
      current.rent += 1;
    }
    byCountry.set(country, current);
  }

  const sorted = [...byCountry.values()].sort(
    (a, b) => b.listings - a.listings || a.country.localeCompare(b.country),
  );

  const kenya = byCountry.get(DEFAULT_LISTING_COUNTRY)?.listings ?? 0;
  const total = listings.length;

  const weekly: WeekTrendPoint[] = [];
  const now = startOfWeek(new Date());
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = new Date(now);
    start.setDate(now.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const startMs = start.getTime();
    const endMs = end.getTime();

    let kenyaCount = 0;
    let restCount = 0;
    for (const listing of listings) {
      const created = new Date(listing.createdAt).getTime();
      if (Number.isNaN(created) || created < startMs || created >= endMs) {
        continue;
      }
      if (countryName(listing.country) === DEFAULT_LISTING_COUNTRY) {
        kenyaCount += 1;
      } else {
        restCount += 1;
      }
    }

    weekly.push({
      label: start.toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
      }),
      start: start.toISOString(),
      kenya: kenyaCount,
      restOfAfrica: restCount,
      total: kenyaCount + restCount,
    });
  }

  return {
    total,
    countriesLive: sorted.length,
    kenya,
    restOfAfrica: total - kenya,
    active: listings.filter((l) => l.status === "ACTIVE").length,
    pending: listings.filter((l) => l.status === "PENDING").length,
    views: listings.reduce((sum, l) => sum + (l.views ?? 0), 0),
    byCountry: sorted,
    weekly,
  };
}
