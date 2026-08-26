import { describe, expect, it } from "vitest";
import {
  AFRICA_SITE_HOST,
  AFRICA_SITE_URL,
  canonicalOrigin,
  canonicalUrl,
  isSiteHost,
  originForHost,
  PRIMARY_SITE_HOST,
  PRIMARY_SITE_URL,
} from "@/lib/site-domains";

describe("site domains", () => {
  it("treats both production hosts as the same site", () => {
    expect(isSiteHost(PRIMARY_SITE_HOST)).toBe(true);
    expect(isSiteHost(`www.${AFRICA_SITE_HOST}`)).toBe(true);
    expect(isSiteHost("other.example")).toBe(false);
  });

  it("maps each host to its https origin", () => {
    expect(originForHost("www.yourhome.africa")).toBe(AFRICA_SITE_URL);
    expect(originForHost(PRIMARY_SITE_HOST)).toBe(PRIMARY_SITE_URL);
  });

  it("keeps canonical URLs on yourhome.co.ke", () => {
    expect(canonicalOrigin()).toBe(PRIMARY_SITE_URL);
    expect(canonicalUrl("/")).toBe("https://yourhome.co.ke/");
    expect(canonicalUrl("/rent/lagos")).toBe(
      "https://yourhome.co.ke/rent/lagos",
    );
  });
});
