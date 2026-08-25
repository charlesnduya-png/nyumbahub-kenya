import type { ListingType } from "@/types";

/** Nightly stays that use the BnB booking flow (dates, host approval, membership price). */
export const STAY_LISTING_TYPES = ["HOLIDAY", "HOTEL"] as const;

export type StayListingType = (typeof STAY_LISTING_TYPES)[number];

export function isStayListing(
  listingType: string | null | undefined,
): listingType is StayListingType {
  return listingType === "HOLIDAY" || listingType === "HOTEL";
}

export function stayPriceSuffix(listingType: string | null | undefined) {
  return isStayListing(listingType) ? "/night" : "";
}

export function stayLabel(listingType: string | null | undefined) {
  if (listingType === "HOTEL") return "Hotel";
  if (listingType === "HOLIDAY") return "BnB";
  return "Stay";
}
