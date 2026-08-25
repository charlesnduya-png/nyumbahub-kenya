import { describe, expect, it } from "vitest";
import { isStayListing, stayLabel, stayPriceSuffix } from "@/lib/listing-kinds";

describe("listing kinds", () => {
  it("treats hotels and BnBs as nightly stays", () => {
    expect(isStayListing("HOTEL")).toBe(true);
    expect(isStayListing("HOLIDAY")).toBe(true);
    expect(isStayListing("RENT")).toBe(false);
    expect(stayPriceSuffix("HOTEL")).toBe("/night");
    expect(stayLabel("HOTEL")).toBe("Hotel");
  });
});
