import { describe, expect, it } from "vitest";
import { AFRICA_COUNTRY_MARKETS, AFRICA_CITY_MARKETS } from "@/lib/africa-markets";
import { getAfricaSitemapEntries, renderSitemapXml } from "@/lib/sitemap";
import { getPropertyForSalePlace } from "@/lib/property-for-sale";

describe("Africa sitemap for Google Search Console", () => {
  const urls = getAfricaSitemapEntries().map((entry) => entry.url);

  it("includes the Africa hub and sale/rent/BnB homes", () => {
    expect(urls.some((url) => url.endsWith("/africa"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/property-for-sale"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/rent"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/bnb"))).toBe(true);
  });

  it("lists every African country except the Kenya hub slug", () => {
    for (const country of AFRICA_COUNTRY_MARKETS) {
      if (country.name === "Kenya") continue;
      expect(
        urls.some((url) => url.includes(`/property-for-sale/${country.slug}`)),
        country.slug,
      ).toBe(true);
      expect(urls.some((url) => url.includes(`/rent/${country.slug}`))).toBe(
        true,
      );
      expect(urls.some((url) => url.includes(`/bnb/${country.slug}`))).toBe(
        true,
      );
    }
  });

  it("lists African cities that have landing pages", () => {
    const cityPages = AFRICA_CITY_MARKETS.filter((city) =>
      Boolean(getPropertyForSalePlace(city.slug)),
    );
    expect(cityPages.length).toBeGreaterThan(80);
    for (const city of cityPages) {
      expect(
        urls.some((url) => url.includes(`/property-for-sale/${city.slug}`)),
        city.slug,
      ).toBe(true);
    }
  });

  it("includes high-traffic markets", () => {
    for (const slug of [
      "nairobi",
      "lagos",
      "accra",
      "cape-town",
      "kampala",
      "kigali",
      "cairo",
      "marrakech",
    ]) {
      expect(urls.some((url) => url.includes(`/property-for-sale/${slug}`))).toBe(
        true,
      );
    }
  });

  it("renders a urlset Google Search Console accepts", () => {
    const xml = renderSitemapXml(getAfricaSitemapEntries());
    expect(xml).toContain("<urlset");
    expect(xml).not.toContain("<sitemapindex");
    expect(xml).toContain("https://yourhome.co.ke/property-for-sale/lagos");
  });
});
