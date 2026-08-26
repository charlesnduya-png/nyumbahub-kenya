import { describe, expect, it } from "vitest";
import { AFRICAN_COUNTRIES } from "@/lib/african-countries";
import {
  buildHeroSearchParams,
  placesForHeroCountry,
} from "@/lib/hero-search";

describe("homepage hero search", () => {
  it("offers every African country a place list, with Kenya counties", () => {
    expect(AFRICAN_COUNTRIES).toHaveLength(54);
    expect(placesForHeroCountry("Kenya")).toContain("Nairobi");
    expect(placesForHeroCountry("Nigeria")).toContain("Lagos");
    expect(placesForHeroCountry("Ghana")).toContain("Accra");
    expect(placesForHeroCountry("South Africa")).toContain("Cape Town");
  });

  it("sends country (not a Kenya county) for other African markets", () => {
    const params = buildHeroSearchParams({
      listingType: "RENT",
      country: "Nigeria",
      town: "Lagos",
    });
    expect(params.get("country")).toBe("Nigeria");
    expect(params.get("town")).toBe("Lagos");
    expect(params.get("county")).toBeNull();
    expect(params.get("listingType")).toBe("RENT");
  });

  it("keeps Kenya county and town filters", () => {
    const params = buildHeroSearchParams({
      listingType: "BUY",
      country: "Kenya",
      county: "Nairobi",
      town: "Westlands",
    });
    expect(params.get("country")).toBe("Kenya");
    expect(params.get("county")).toBe("Nairobi");
    expect(params.get("town")).toBe("Westlands");
  });
});