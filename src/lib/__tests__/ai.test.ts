import { describe, expect, it } from "vitest";
import { generatePropertyDescription, suggestPrice } from "@/lib/ai";

describe("AI helpers (fallback mode)", () => {
  it("generates a Kenyan-oriented description without API key", async () => {
    const text = await generatePropertyDescription({
      title: "3BR Apartment Kilimani",
      listingType: "BUY",
      propertyType: "APARTMENT",
      county: "Nairobi",
      town: "Kilimani",
      bedrooms: 3,
      bathrooms: 2,
      price: 18500000,
    });
    expect(text.toLowerCase()).toMatch(/kilimani|nairobi|apartment|bedroom/);
    expect(text.length).toBeGreaterThan(40);
  });

  it("suggests a price range", async () => {
    const suggestion = await suggestPrice({
      listingType: "RENT",
      propertyType: "APARTMENT",
      county: "Nairobi",
      town: "Westlands",
      bedrooms: 2,
      bathrooms: 2,
    });
    expect(suggestion.suggestedPrice).toBeGreaterThan(0);
    expect(suggestion.minPrice).toBeLessThanOrEqual(suggestion.suggestedPrice);
    expect(suggestion.maxPrice).toBeGreaterThanOrEqual(suggestion.suggestedPrice);
  });
});
