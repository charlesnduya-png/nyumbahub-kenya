/** High-intent location URLs for sitemap and internal linking. */

import {
  AFRICA_CITY_MARKETS,
  AFRICA_COUNTRY_MARKETS,
  featuredAfricaCountrySlugs,
} from "@/lib/africa-markets";

export interface SeoLocationLanding {
  label: string;
  path: string;
  priority?: number;
}

export const SEO_COUNTY_LANDINGS: SeoLocationLanding[] = [
  { label: "Nairobi", path: "/property-for-sale/nairobi", priority: 0.92 },
  { label: "Mombasa", path: "/property-for-sale/mombasa", priority: 0.88 },
  { label: "Kisumu", path: "/property-for-sale/kisumu", priority: 0.84 },
  { label: "Nakuru", path: "/property-for-sale/nakuru", priority: 0.84 },
  { label: "Kiambu", path: "/property-for-sale/kiambu", priority: 0.9 },
  { label: "Kajiado", path: "/property-for-sale/kajiado", priority: 0.86 },
  { label: "Uasin Gishu", path: "/property-for-sale/uasin-gishu", priority: 0.8 },
];

export const SEO_RENT_AREA_LANDINGS: SeoLocationLanding[] = [
  { label: "Westlands rentals", path: "/rent/westlands", priority: 0.84 },
  { label: "Kilimani rentals", path: "/rent/kilimani", priority: 0.84 },
  { label: "Lavington rentals", path: "/rent/lavington", priority: 0.82 },
  { label: "Karen rentals", path: "/rent/karen", priority: 0.8 },
  { label: "Syokimau rentals", path: "/rent/syokimau", priority: 0.8 },
  { label: "Lagos rentals", path: "/rent/lagos", priority: 0.86 },
  { label: "Accra rentals", path: "/rent/accra", priority: 0.84 },
  { label: "Kampala rentals", path: "/rent/kampala", priority: 0.82 },
];

export const SEO_BUY_AREA_LANDINGS: SeoLocationLanding[] = [
  { label: "Houses for sale Nairobi", path: "/property-for-sale/nairobi", priority: 0.92 },
  { label: "Houses for sale Kiambu", path: "/property-for-sale/kiambu", priority: 0.88 },
  { label: "Houses for sale Lagos", path: "/property-for-sale/lagos", priority: 0.9 },
  { label: "Houses for sale Accra", path: "/property-for-sale/accra", priority: 0.86 },
  { label: "Houses for sale Cape Town", path: "/property-for-sale/cape-town", priority: 0.86 },
];

export const SEO_BNB_AREA_LANDINGS: SeoLocationLanding[] = [
  { label: "BnB Diani", path: "/bnb/diani", priority: 0.84 },
  { label: "BnB Zanzibar", path: "/bnb/zanzibar", priority: 0.86 },
  { label: "BnB Cape Town", path: "/bnb/cape-town", priority: 0.88 },
  { label: "BnB Marrakech", path: "/bnb/marrakech", priority: 0.84 },
  { label: "BnB Lagos", path: "/bnb/lagos", priority: 0.82 },
  { label: "BnB Kigali", path: "/bnb/kigali", priority: 0.8 },
];

export const SEO_CATEGORY_LANDINGS: SeoLocationLanding[] = [
  { label: "Land & plots Africa", path: "/properties?category=land-plots", priority: 0.85 },
  { label: "Commercial property Africa", path: "/properties?category=commercial", priority: 0.8 },
  { label: "Apartments Africa", path: "/properties?propertyType=APARTMENT", priority: 0.82 },
  { label: "Houses & villas Africa", path: "/properties?propertyType=HOUSE", priority: 0.82 },
  { label: "Africa real estate hub", path: "/africa", priority: 0.95 },
];

export const SEO_AFRICA_COUNTRY_LANDINGS: SeoLocationLanding[] =
  AFRICA_COUNTRY_MARKETS.filter((country) => country.name !== "Kenya").flatMap(
    (country) => {
      const featured = featuredAfricaCountrySlugs().includes(country.slug);
      const priority = featured ? 0.88 : 0.72;
      return [
        {
          label: `Property for sale ${country.name}`,
          path: `/property-for-sale/${country.slug}`,
          priority,
        },
        {
          label: `Rentals ${country.name}`,
          path: `/rent/${country.slug}`,
          priority: featured ? 0.84 : 0.68,
        },
        {
          label: `BnB ${country.name}`,
          path: `/bnb/${country.slug}`,
          priority: featured ? 0.82 : 0.66,
        },
      ];
    },
  );

export const SEO_AFRICA_CITY_LANDINGS: SeoLocationLanding[] =
  AFRICA_CITY_MARKETS.flatMap((city) => {
    const slug = city.slug;
    return [
      {
        label: `Property for sale ${city.name}`,
        path: `/property-for-sale/${slug}`,
        priority: 0.8,
      },
      {
        label: `Rentals ${city.name}`,
        path: `/rent/${slug}`,
        priority: 0.76,
      },
      {
        label: `BnB ${city.name}`,
        path: `/bnb/${slug}`,
        priority: 0.74,
      },
    ];
  });

export const ALL_SEO_LANDINGS: SeoLocationLanding[] = [
  ...SEO_CATEGORY_LANDINGS,
  ...SEO_COUNTY_LANDINGS,
  ...SEO_RENT_AREA_LANDINGS,
  ...SEO_BUY_AREA_LANDINGS,
  ...SEO_BNB_AREA_LANDINGS,
  ...SEO_AFRICA_COUNTRY_LANDINGS,
  ...SEO_AFRICA_CITY_LANDINGS,
];
