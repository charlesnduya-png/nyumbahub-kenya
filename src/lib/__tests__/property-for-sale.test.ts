import { describe, expect, it } from "vitest";
import { KENYA_COUNTIES } from "@/lib/kenya";
import { slugify } from "@/lib/utils";
import {
  getAllPropertyForSalePlaces,
  getPropertyForSaleCounties,
  getPropertyForSalePlace,
} from "@/lib/property-for-sale";

describe("property-for-sale locations", () => {
  it("covers all 47 Kenyan counties", () => {
    const counties = getPropertyForSaleCounties();
    expect(counties).toHaveLength(47);
    for (const name of KENYA_COUNTIES) {
      const place = getPropertyForSalePlace(slugify(name));
      expect(place?.name).toBe(name);
      expect(place?.kind).toBe("county");
    }
  });

  it("uses unique slugs", () => {
    const slugs = getAllPropertyForSalePlaces().map((place) => place.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves the example sale URLs", () => {
    expect(getPropertyForSalePlace("nairobi")?.name).toBe("Nairobi");
    expect(getPropertyForSalePlace("kiambu")?.name).toBe("Kiambu");
    expect(getPropertyForSalePlace("kajiado")?.name).toBe("Kajiado");
    expect(getPropertyForSalePlace("nakuru")?.name).toBe("Nakuru");
    expect(getPropertyForSalePlace("mombasa")?.name).toBe("Mombasa");
    expect(getPropertyForSalePlace("westlands")?.kind).toBe("town");
  });

  it("only points nearby links at real pages", () => {
    for (const place of getAllPropertyForSalePlaces()) {
      for (const slug of place.nearbySlugs) {
        expect(getPropertyForSalePlace(slug), slug).toBeTruthy();
      }
    }
  });
});
