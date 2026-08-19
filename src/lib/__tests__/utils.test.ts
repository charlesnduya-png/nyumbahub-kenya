import { describe, expect, it } from "vitest";
import { formatPrice, slugify, truncate, cn } from "@/lib/utils";

describe("utils", () => {
  it("formats Kenyan shilling prices", () => {
    expect(formatPrice(18500000)).toContain("18");
    expect(formatPrice(95000)).toMatch(/95/);
  });

  it("slugifies titles", () => {
    expect(slugify("Modern 3BR Apartment in Kilimani!")).toBe(
      "modern-3br-apartment-in-kilimani",
    );
  });

  it("truncates long text", () => {
    expect(truncate("Hello Your Home marketplace", 12)).toBe(
      "Hello Your…",
    );
  });

  it("merges class names", () => {
    expect(cn("p-2", false && "hidden", "text-sm")).toBe("p-2 text-sm");
  });
});
