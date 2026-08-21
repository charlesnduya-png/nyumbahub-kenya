import { describe, expect, it } from "vitest";
import {
  LISTING_FEATURE_GROUPS,
  LISTING_FEATURES,
  flagsFromListingFeatures,
  listingFeatureSlugsFromAmenities,
  sanitizeListingFeatureSlugs,
} from "@/lib/listing-features";

describe("listing features catalog", () => {
  it("has unique slugs and names", () => {
    const slugs = LISTING_FEATURES.map((feature) => feature.slug);
    const names = LISTING_FEATURES.map((feature) => feature.name.toLowerCase());
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(names).size).toBe(names.length);
    expect(LISTING_FEATURE_GROUPS).toHaveLength(5);
  });

  it("covers the requested luxury, parking, and premium tags", () => {
    const slugs = new Set(LISTING_FEATURES.map((feature) => feature.slug));
    for (const slug of [
      "family-tv-room",
      "home-office-study",
      "fireplace",
      "balcony",
      "laundry-room",
      "guest-house",
      "garage",
      "covered-parking",
      "ample-parking",
      "un-embassy-approved",
      "diplomatic-area",
      "near-international-school",
      "near-shopping-centres",
    ]) {
      expect(slugs.has(slug), slug).toBe(true);
    }
  });

  it("maps amenity rows back to slugs", () => {
    expect(
      listingFeatureSlugsFromAmenities([
        { amenity: { name: "Family / TV room", icon: "family-tv-room" } },
        { amenity: { name: "Swimming Pool", icon: "waves" } },
      ]),
    ).toEqual(["family-tv-room", "swimming-pool"]);
  });

  it("derives legacy boolean flags", () => {
    expect(
      flagsFromListingFeatures(["furnished", "swimming-pool", "garage"]),
    ).toEqual({
      furnished: true,
      swimmingPool: true,
      security: false,
      parking: true,
    });
  });

  it("drops unknown slugs", () => {
    expect(sanitizeListingFeatureSlugs(["balcony", "hot-tub", "garage"])).toEqual([
      "balcony",
      "garage",
    ]);
  });
});
