import { describe, expect, it } from "vitest";
import {
  AFRICA_CITY_MARKETS,
  AFRICA_COUNTRY_MARKETS,
  AFRICA_REGIONS,
} from "@/lib/africa-markets";
import { AFRICAN_COUNTRIES } from "@/lib/african-countries";
import {
  getAllPropertyForSalePlaces,
  getAfricaCountryPlaces,
  getPropertyForSalePlace,
} from "@/lib/property-for-sale";

describe("Africa SEO markets", () => {
  it("covers every African country except Kenya as a sale landing", () => {
    const countries = getAfricaCountryPlaces();
    expect(countries).toHaveLength(AFRICAN_COUNTRIES.length - 1);
    expect(getPropertyForSalePlace("nigeria")?.kind).toBe("country");
    expect(getPropertyForSalePlace("ghana")?.name).toBe("Ghana");
    expect(getPropertyForSalePlace("south-africa")?.name).toBe("South Africa");
    expect(getPropertyForSalePlace("kenya")).toBeNull();
  });

  it("indexes major cities for sale, rent, and BnB slugs", () => {
    expect(getPropertyForSalePlace("lagos")?.kind).toBe("city");
    expect(getPropertyForSalePlace("accra")?.country).toBe("Ghana");
    expect(getPropertyForSalePlace("cape-town")?.country).toBe("South Africa");
    expect(getPropertyForSalePlace("kampala")?.country).toBe("Uganda");
    expect(getPropertyForSalePlace("zanzibar")?.country).toBe("Tanzania");
    expect(getPropertyForSalePlace("marrakech")?.country).toBe("Morocco");
  });

  it("does not collide with Kenya county or town slugs", () => {
    expect(getPropertyForSalePlace("nairobi")?.kind).toBe("county");
    expect(getPropertyForSalePlace("nairobi")?.country).toBe("Kenya");
  });

  it("keeps unique slugs across Kenya and Africa places", () => {
    const slugs = getAllPropertyForSalePlaces().map((place) => place.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("lists a city for every region", () => {
    for (const region of AFRICA_REGIONS) {
      const cities = AFRICA_CITY_MARKETS.filter((city) => city.region === region);
      expect(cities.length, region).toBeGreaterThan(0);
    }
    expect(AFRICA_COUNTRY_MARKETS).toHaveLength(54);
  });
});
