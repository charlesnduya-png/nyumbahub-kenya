import { describe, expect, it } from "vitest";
import {
  clampListingDiscountPercent,
  listingDiscountAmount,
  listingSalePrice,
} from "@/lib/listing-discount";

describe("listing discount", () => {
  it("clamps missing and oversized percents", () => {
    expect(clampListingDiscountPercent(undefined)).toBe(0);
    expect(clampListingDiscountPercent(-5)).toBe(0);
    expect(clampListingDiscountPercent(20)).toBe(20);
    expect(clampListingDiscountPercent(99)).toBe(70);
  });

  it("reduces the listed price by the host percent", () => {
    expect(listingSalePrice(10000, 20)).toBe(8000);
    expect(listingDiscountAmount(10000, 20)).toBe(2000);
    expect(listingSalePrice(10000, 0)).toBe(10000);
  });
});
