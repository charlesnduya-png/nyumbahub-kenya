/** High-intent location URLs for sitemap and internal linking (Kenya real estate). */

export interface SeoLocationLanding {
  label: string;
  path: string;
  priority?: number;
}

const enc = (value: string) => encodeURIComponent(value);

export const SEO_COUNTY_LANDINGS: SeoLocationLanding[] = [
  { label: "Nairobi", path: `/properties?county=${enc("Nairobi")}`, priority: 0.88 },
  { label: "Mombasa", path: `/properties?county=${enc("Mombasa")}`, priority: 0.85 },
  { label: "Kisumu", path: `/properties?county=${enc("Kisumu")}`, priority: 0.82 },
  { label: "Nakuru", path: `/properties?county=${enc("Nakuru")}`, priority: 0.8 },
  { label: "Kiambu", path: `/properties?county=${enc("Kiambu")}`, priority: 0.8 },
  { label: "Kajiado", path: `/properties?county=${enc("Kajiado")}`, priority: 0.78 },
  { label: "Uasin Gishu", path: `/properties?county=${enc("Uasin Gishu")}`, priority: 0.75 },
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
  { label: "Houses for sale Nairobi", path: `/properties?listingType=BUY&county=${enc("Nairobi")}`, priority: 0.86 },
  { label: "Houses for sale Kiambu", path: `/properties?listingType=BUY&county=${enc("Kiambu")}`, priority: 0.82 },
  { label: "Houses for sale Mombasa", path: `/properties?listingType=BUY&county=${enc("Mombasa")}`, priority: 0.82 },
  { label: "Apartments for sale Nairobi", path: `/properties?listingType=BUY&propertyType=APARTMENT&county=${enc("Nairobi")}`, priority: 0.84 },
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
