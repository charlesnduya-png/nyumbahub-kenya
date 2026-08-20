/** High-intent location URLs for sitemap and internal linking (Kenya real estate). */

export interface SeoLocationLanding {
  label: string;
  path: string;
  priority?: number;
}

const enc = (value: string) => encodeURIComponent(value);

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
  { label: "Westlands rentals", path: `/properties?listingType=RENT&town=${enc("Westlands")}`, priority: 0.84 },
  { label: "Kilimani rentals", path: `/properties?listingType=RENT&town=${enc("Kilimani")}`, priority: 0.84 },
  { label: "Lavington rentals", path: `/properties?listingType=RENT&town=${enc("Lavington")}`, priority: 0.82 },
  { label: "Karen rentals", path: `/properties?listingType=RENT&town=${enc("Karen")}`, priority: 0.8 },
  { label: "Syokimau rentals", path: `/properties?listingType=RENT&town=${enc("Syokimau")}`, priority: 0.8 },
  { label: "Roysambu rentals", path: `/properties?listingType=RENT&town=${enc("Roysambu")}`, priority: 0.78 },
  { label: "Nyali rentals", path: `/properties?listingType=RENT&town=${enc("Nyali")}`, priority: 0.78 },
];

export const SEO_BUY_AREA_LANDINGS: SeoLocationLanding[] = [
  { label: "Houses for sale Nairobi", path: "/property-for-sale/nairobi", priority: 0.92 },
  { label: "Houses for sale Kiambu", path: "/property-for-sale/kiambu", priority: 0.88 },
  { label: "Houses for sale Mombasa", path: "/property-for-sale/mombasa", priority: 0.86 },
  { label: "Houses for sale Kajiado", path: "/property-for-sale/kajiado", priority: 0.86 },
];

export const SEO_CATEGORY_LANDINGS: SeoLocationLanding[] = [
  { label: "Land & plots Kenya", path: "/properties?category=land-plots", priority: 0.85 },
  { label: "Commercial property Kenya", path: "/properties?category=commercial", priority: 0.8 },
  { label: "Apartments Kenya", path: "/properties?propertyType=APARTMENT", priority: 0.82 },
  { label: "Houses & villas Kenya", path: "/properties?propertyType=HOUSE", priority: 0.82 },
  { label: "Maisonettes Kenya", path: "/properties?propertyType=MAISONETTE", priority: 0.75 },
];

export const ALL_SEO_LANDINGS: SeoLocationLanding[] = [
  ...SEO_CATEGORY_LANDINGS,
  ...SEO_COUNTY_LANDINGS,
  ...SEO_RENT_AREA_LANDINGS,
  ...SEO_BUY_AREA_LANDINGS,
];
