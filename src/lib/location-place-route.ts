import type { Metadata } from "next";

import {
  intentDescription,
  intentFaqs,
  intentHubPath,
  intentKeywords,
  intentPlacePath,
  intentTitle,
  listingTypeForIntent,
  type LocationMarketIntent,
} from "@/lib/location-seo";
import { searchListingsByLocation } from "@/lib/properties";
import {
  getPropertyForSalePlace,
  placeSearchFilters,
} from "@/lib/property-for-sale";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqPageJsonLd,
  itemListJsonLd,
} from "@/lib/seo";

export async function locationPlaceMetadata(
  slug: string,
  intent: LocationMarketIntent,
): Promise<Metadata> {
  const place = getPropertyForSalePlace(slug);
  if (!place) {
    return { title: "Place not found", robots: { index: false } };
  }
  return buildPageMetadata({
    title: intentTitle(intent, place),
    description: intentDescription(intent, place),
    path: intentPlacePath(intent, place.slug),
    keywords: intentKeywords(intent, place),
  });
}

export async function locationPlacePageData(
  slug: string,
  intent: LocationMarketIntent,
) {
  const place = getPropertyForSalePlace(slug);
  if (!place) return null;

  const result = await searchListingsByLocation({
    listingTypes: listingTypeForIntent(intent),
    ...placeSearchFilters(place),
    limit: 24,
  });

  const hubLabel =
    intent === "rent" ? "Rent" : intent === "bnb" ? "BnB" : "Property for sale";

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: hubLabel, path: intentHubPath(intent) },
      { name: place.name, path: intentPlacePath(intent, place.slug) },
    ]),
    itemListJsonLd(
      intentTitle(intent, place),
      result.data.map((listing) => ({
        name: listing.title,
        path: `/properties/${listing.slug}`,
      })),
    ),
    faqPageJsonLd(intentFaqs(intent, place)),
  ];

  return { place, result, jsonLd };
}
