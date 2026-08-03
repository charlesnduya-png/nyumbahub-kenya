import { describe, expect, it } from "vitest";
import { filterMockProperties, mockProperties } from "@/data/mock";

describe("property search filters", () => {
  it("has Kenyan sample inventory", () => {
    expect(mockProperties.length).toBeGreaterThan(3);
    expect(mockProperties.some((p) => p.county === "Nairobi")).toBe(true);
  });

  it("filters by listing type and county", () => {
    const rentals = filterMockProperties({ listingType: "RENT" });
    expect(rentals.data.every((p) => p.listingType === "RENT")).toBe(true);

    const nairobi = filterMockProperties({ county: "Nairobi" });
    expect(nairobi.data.every((p) => p.county === "Nairobi")).toBe(true);
  });
});
