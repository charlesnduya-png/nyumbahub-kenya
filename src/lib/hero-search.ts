import { citiesForCountry } from "@/lib/africa-markets";
import { isKenyaCountry } from "@/lib/african-countries";
import { KENYA_COUNTIES } from "@/lib/kenya";
import type { ListingType } from "@/types";

export type HeroSearchValues = {
  listingType: ListingType;
  query?: string;
  country?: string;
  county?: string;
  town?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
};

export function placesForHeroCountry(country: string): string[] {
  if (!country) return [];
  if (isKenyaCountry(country)) return [...KENYA_COUNTIES];
  return citiesForCountry(country);
}

export function buildHeroSearchParams(input: HeroSearchValues): URLSearchParams {
  const params = new URLSearchParams();
  const query = input.query?.trim();
  if (query) params.set("query", query);

  if (input.listingType === "LAND") {
    params.set("category", "land-plots");
  } else if (input.listingType === "COMMERCIAL") {
    params.set("category", "commercial");
  } else {
    params.set("listingType", input.listingType);
  }

  const country = input.country?.trim();
  if (country) params.set("country", country);

  const county = input.county?.trim();
  const town = input.town?.trim();

  if (country && isKenyaCountry(country)) {
    if (county) params.set("county", county);
    if (town) params.set("town", town);
  } else if (town) {
    params.set("town", town);
  }

  if (input.minPrice) params.set("minPrice", input.minPrice);
  if (input.maxPrice) params.set("maxPrice", input.maxPrice);
  if (input.bedrooms && input.bedrooms !== "Any") {
    params.set("bedrooms", input.bedrooms.replace("+", ""));
  }

  return params;
}