import { describe, expect, it } from "vitest";
import { isAdPlacement, normalizeAdLink } from "@/lib/ads";

describe("ads", () => {
  it("accepts site paths and http links", () => {
    expect(normalizeAdLink("/pricing")).toBe("/pricing");
    expect(normalizeAdLink("https://yourhome.co.ke/rent")).toBe(
      "https://yourhome.co.ke/rent",
    );
    expect(normalizeAdLink("https://yourhome.africa/rent")).toBe(
      "https://yourhome.africa/rent",
    );
    expect(normalizeAdLink("")).toBeNull();
    expect(normalizeAdLink("javascript:alert(1)")).toBe("__invalid__");
  });

  it("recognizes placements", () => {
    expect(isAdPlacement("HOME_BANNER")).toBe(true);
    expect(isAdPlacement("POPUP")).toBe(false);
  });
});
