import { describe, expect, it } from "vitest";

import { isListingBoostProduct } from "@/lib/listing-boost";

describe("listing-boost", () => {
  it("recognises paid boost products", () => {
    expect(isListingBoostProduct("featured_boost")).toBe(true);
    expect(isListingBoostProduct("promote_pro")).toBe(true);
    expect(isListingBoostProduct("verified_badge")).toBe(false);
    expect(isListingBoostProduct("tenant_access_24h")).toBe(false);
  });
});
