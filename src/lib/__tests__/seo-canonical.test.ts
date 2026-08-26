import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  buildPageMetadata,
  generatePropertyMetadata,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { CANONICAL_SITE_URL } from "@/lib/site-domains";

describe("canonical SEO origin", () => {
  it("points page metadata at www.yourhome.africa even for other hosts", () => {
    const metadata = buildPageMetadata({
      title: "Lagos rentals",
      description: "Apartments for rent in Lagos.",
      path: "/rent/lagos",
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://www.yourhome.africa/rent/lagos",
    );
    expect(metadata.openGraph?.url).toBe(
      "https://www.yourhome.africa/rent/lagos",
    );
  });

  it("keeps listing metadata on the canonical host", () => {
    const metadata = generatePropertyMetadata({
      title: "Westlands apartment",
      description: "A verified 2-bed apartment.",
      slug: "westlands-apartment",
      price: 85000,
      currency: "KES",
      county: "Nairobi",
      town: "Westlands",
      country: "Kenya",
      listingType: "RENT",
      propertyType: "APARTMENT",
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://www.yourhome.africa/properties/westlands-apartment",
    );
  });

  it("uses the canonical host for Open Graph and JSON-LD", () => {
    expect(absoluteUrl("/")).toBe(`${CANONICAL_SITE_URL}/`);
    expect(organizationJsonLd().url).toBe(`${CANONICAL_SITE_URL}/`);
    expect(organizationJsonLd()["@id"]).toBe(
      `${CANONICAL_SITE_URL}/#organization`,
    );
    expect(websiteJsonLd().url).toBe(`${CANONICAL_SITE_URL}/`);
    expect(organizationJsonLd().sameAs).toEqual([
      "https://www.yourhome.africa",
      "https://yourhome.co.ke",
      "https://yourhome.africa",
    ]);
  });
});
