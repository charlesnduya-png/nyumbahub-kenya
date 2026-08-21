import { z } from "zod";

export const LISTING_CURRENCY_CODES = [
  "KES",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "UGX",
  "TZS",
  "CAD",
  "AUD",
  "ZAR",
] as const;

export const LISTING_CURRENCY_NAMES: Record<
  (typeof LISTING_CURRENCY_CODES)[number],
  string
> = {
  KES: "Kenyan Shilling",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AED: "UAE Dirham",
  UGX: "Ugandan Shilling",
  TZS: "Tanzanian Shilling",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  ZAR: "South African Rand",
};

export const LISTING_CURRENCIES = LISTING_CURRENCY_CODES.map((code) => ({
  code,
  name: LISTING_CURRENCY_NAMES[code],
}));

export const DEFAULT_LISTING_CURRENCY = "KES" as const;

export type ListingCurrency = (typeof LISTING_CURRENCY_CODES)[number];

export const listingCurrencySchema = z
  .enum(LISTING_CURRENCY_CODES)
  .default(DEFAULT_LISTING_CURRENCY);

export function isListingCurrency(value: string): value is ListingCurrency {
  return (LISTING_CURRENCY_CODES as readonly string[]).includes(value);
}

export function listingCurrencyLabel(code: string): string {
  if (!isListingCurrency(code)) return code;
  return `${code} · ${LISTING_CURRENCY_NAMES[code]}`;
}
