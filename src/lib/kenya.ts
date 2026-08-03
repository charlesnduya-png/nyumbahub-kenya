import type { ListingType, PropertyType } from "@/types";

export const KENYA_COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita-Taveta",
  "Garissa",
  "Wajir",
  "Mandera",
  "Marsabit",
  "Isiolo",
  "Meru",
  "Tharaka-Nithi",
  "Embu",
  "Kitui",
  "Machakos",
  "Makueni",
  "Nyandarua",
  "Nyeri",
  "Kirinyaga",
  "Murang'a",
  "Kiambu",
  "Turkana",
  "West Pokot",
  "Samburu",
  "Trans Nzoia",
  "Uasin Gishu",
  "Elgeyo-Marakwet",
  "Nandi",
  "Baringo",
  "Laikipia",
  "Nakuru",
  "Narok",
  "Kajiado",
  "Kericho",
  "Bomet",
  "Kakamega",
  "Vihiga",
  "Bungoma",
  "Busia",
  "Siaya",
  "Kisumu",
  "Homa Bay",
  "Migori",
  "Kisii",
  "Nyamira",
  "Nairobi",
] as const;

export type KenyaCounty = (typeof KENYA_COUNTIES)[number];

export const MAJOR_TOWNS: Record<
  "Nairobi" | "Mombasa" | "Kisumu" | "Nakuru" | "Kiambu",
  readonly string[]
> = {
  Nairobi: [
    "Nairobi CBD",
    "Westlands",
    "Kilimani",
    "Karen",
    "Lavington",
    "Runda",
    "Parklands",
    "South B",
    "South C",
    "Embakasi",
    "Donholm",
    "Langata",
    "Kasarani",
    "Roysambu",
    "Ruiru",
    "Syokimau",
    "Kitengela",
    "Ngong Road",
    "Upper Hill",
    "Hurlingham",
  ],
  Mombasa: [
    "Mombasa Island",
    "Nyali",
    "Bamburi",
    "Shanzu",
    "Diani",
    "Likoni",
    "Mtwapa",
    "Kisauni",
    "Changamwe",
    "Mariakani",
  ],
  Kisumu: [
    "Kisumu CBD",
    "Milimani",
    "Riat",
    "Mamboleo",
    "Dunga",
    "Ahero",
    "Maseno",
    "Kondele",
  ],
  Nakuru: [
    "Nakuru Town",
    "Naivasha",
    "Gilgil",
    "Molo",
    "Njoro",
    "Bahati",
    "Lanet",
    "Section 58",
  ],
  Kiambu: [
    "Thika",
    "Ruiru",
    "Kiambu Town",
    "Juja",
    "Limuru",
    "Kikuyu",
    "Githurai",
    "Rongai",
    "Tigoni",
    "Banana",
  ],
};

export const PROPERTY_CATEGORIES: Array<{
  value: PropertyType;
  label: string;
  group: "residential" | "commercial" | "land";
}> = [
  { value: "APARTMENT", label: "Apartment", group: "residential" },
  { value: "HOUSE", label: "House", group: "residential" },
  { value: "TOWNHOUSE", label: "Townhouse", group: "residential" },
  { value: "VILLA", label: "Villa", group: "residential" },
  { value: "STUDIO", label: "Studio", group: "residential" },
  { value: "BUNGALOW", label: "Bungalow", group: "residential" },
  { value: "MAISONETTE", label: "Maisonette", group: "residential" },
  { value: "PENTHOUSE", label: "Penthouse", group: "residential" },
  { value: "OFFICE", label: "Office", group: "commercial" },
  { value: "SHOP", label: "Shop / Retail", group: "commercial" },
  { value: "WAREHOUSE", label: "Warehouse", group: "commercial" },
  { value: "PLOT", label: "Plot / Land", group: "land" },
  { value: "FARM", label: "Farm", group: "land" },
  { value: "OTHER", label: "Other", group: "residential" },
];

export const LISTING_TYPES: Array<{
  value: ListingType;
  label: string;
  description: string;
}> = [
  {
    value: "BUY",
    label: "For Sale",
    description: "Properties available for purchase",
  },
  {
    value: "RENT",
    label: "For Rent",
    description: "Residential and commercial rentals",
  },
  {
    value: "LAND",
    label: "Land & Plots",
    description: "Vacant land and development plots",
  },
  {
    value: "COMMERCIAL",
    label: "Commercial",
    description: "Offices, shops, and business spaces",
  },
  {
    value: "HOLIDAY",
    label: "BnB / Holiday",
    description: "Short-stay BnB, Airbnb-style and vacation homes",
  },
];

export function getCountyTowns(county: string): readonly string[] {
  const key = county as keyof typeof MAJOR_TOWNS;
  return MAJOR_TOWNS[key] ?? [];
}

export function getListingTypeLabel(listingType: ListingType): string {
  return (
    LISTING_TYPES.find((item) => item.value === listingType)?.label ??
    listingType
  );
}

export function getPropertyTypeLabel(propertyType: PropertyType): string {
  return (
    PROPERTY_CATEGORIES.find((item) => item.value === propertyType)?.label ??
    propertyType
  );
}

export function isKenyaCounty(value: string): value is KenyaCounty {
  return (KENYA_COUNTIES as readonly string[]).includes(value);
}
