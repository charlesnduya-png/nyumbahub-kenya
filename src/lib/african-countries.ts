import { z } from "zod";

/** UN-recognised African countries. Kenya is first as the default listing country. */
export const AFRICAN_COUNTRIES = [
  { name: "Kenya", iso2: "ke" },
  { name: "Algeria", iso2: "dz" },
  { name: "Angola", iso2: "ao" },
  { name: "Benin", iso2: "bj" },
  { name: "Botswana", iso2: "bw" },
  { name: "Burkina Faso", iso2: "bf" },
  { name: "Burundi", iso2: "bi" },
  { name: "Cabo Verde", iso2: "cv" },
  { name: "Cameroon", iso2: "cm" },
  { name: "Central African Republic", iso2: "cf" },
  { name: "Chad", iso2: "td" },
  { name: "Comoros", iso2: "km" },
  { name: "Congo", iso2: "cg" },
  { name: "Côte d'Ivoire", iso2: "ci" },
  { name: "Democratic Republic of the Congo", iso2: "cd" },
  { name: "Djibouti", iso2: "dj" },
  { name: "Egypt", iso2: "eg" },
  { name: "Equatorial Guinea", iso2: "gq" },
  { name: "Eritrea", iso2: "er" },
  { name: "Eswatini", iso2: "sz" },
  { name: "Ethiopia", iso2: "et" },
  { name: "Gabon", iso2: "ga" },
  { name: "Gambia", iso2: "gm" },
  { name: "Ghana", iso2: "gh" },
  { name: "Guinea", iso2: "gn" },
  { name: "Guinea-Bissau", iso2: "gw" },
  { name: "Lesotho", iso2: "ls" },
  { name: "Liberia", iso2: "lr" },
  { name: "Libya", iso2: "ly" },
  { name: "Madagascar", iso2: "mg" },
  { name: "Malawi", iso2: "mw" },
  { name: "Mali", iso2: "ml" },
  { name: "Mauritania", iso2: "mr" },
  { name: "Mauritius", iso2: "mu" },
  { name: "Morocco", iso2: "ma" },
  { name: "Mozambique", iso2: "mz" },
  { name: "Namibia", iso2: "na" },
  { name: "Niger", iso2: "ne" },
  { name: "Nigeria", iso2: "ng" },
  { name: "Rwanda", iso2: "rw" },
  { name: "São Tomé and Príncipe", iso2: "st" },
  { name: "Senegal", iso2: "sn" },
  { name: "Seychelles", iso2: "sc" },
  { name: "Sierra Leone", iso2: "sl" },
  { name: "Somalia", iso2: "so" },
  { name: "South Africa", iso2: "za" },
  { name: "South Sudan", iso2: "ss" },
  { name: "Sudan", iso2: "sd" },
  { name: "Tanzania", iso2: "tz" },
  { name: "Togo", iso2: "tg" },
  { name: "Tunisia", iso2: "tn" },
  { name: "Uganda", iso2: "ug" },
  { name: "Zambia", iso2: "zm" },
  { name: "Zimbabwe", iso2: "zw" },
] as const;

export const AFRICAN_COUNTRY_NAMES = AFRICAN_COUNTRIES.map((c) => c.name) as [
  (typeof AFRICAN_COUNTRIES)[number]["name"],
  ...(typeof AFRICAN_COUNTRIES)[number]["name"][],
];

export const DEFAULT_LISTING_COUNTRY = "Kenya" as const;

export type AfricanCountry = (typeof AFRICAN_COUNTRIES)[number]["name"];

export const africanCountrySchema = z
  .enum(AFRICAN_COUNTRY_NAMES)
  .default(DEFAULT_LISTING_COUNTRY);

export function isAfricanCountry(value: string): value is AfricanCountry {
  return (AFRICAN_COUNTRY_NAMES as readonly string[]).includes(value);
}

export function isKenyaCountry(value?: string | null): boolean {
  return (value ?? DEFAULT_LISTING_COUNTRY) === "Kenya";
}

export function iso2ForCountry(name?: string | null): string {
  const match = AFRICAN_COUNTRIES.find((c) => c.name === name);
  return match?.iso2 ?? "ke";
}

export function formatListingLocation(parts: {
  estate?: string | null;
  town?: string | null;
  county?: string | null;
  country?: string | null;
}): string {
  return [parts.estate, parts.town, parts.county, parts.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
