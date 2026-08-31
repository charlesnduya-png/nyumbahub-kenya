import { describe, expect, it } from "vitest";

import { convertCurrency, normalizeCurrencyCode } from "@/lib/currency";

describe("currency conversion", () => {
  it("normalizes currency codes", () => {
    expect(normalizeCurrencyCode("usd")).toBe("USD");
    expect(normalizeCurrencyCode("unknown")).toBe("KES");
  });

  it("converts KES to USD approximately", () => {
    const usd = convertCurrency(12900, "KES", "USD");
    expect(usd).toBeGreaterThan(90);
    expect(usd).toBeLessThan(110);
  });

  it("converts USD to KES approximately", () => {
    const kes = convertCurrency(100, "USD", "KES");
    expect(kes).toBeGreaterThan(12000);
    expect(kes).toBeLessThan(14000);
  });

  it("keeps same currency unchanged", () => {
    expect(convertCurrency(5000, "KES", "KES")).toBe(5000);
  });
});
