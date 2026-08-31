import { getAgencyFreeMaxListings } from "@/lib/agency-plans";

/**
 * Launch / monetization switches.
 * Set to false only for a temporary free-launch period.
 */
export const PAYMENTS_REQUIRED = true;

/** When true (or payments off), professionals list without paying. */
export const LISTINGS_ARE_FREE = !PAYMENTS_REQUIRED;

/** Hide paid pricing CTAs while launch is free. */
export const PRICING_MUTED = !PAYMENTS_REQUIRED;

/** Max active listings for free accounts — matches agency Free tier (ignored for admins). */
export const FREE_TIER_MAX_LISTINGS = getAgencyFreeMaxListings();

/** When false, tenants chat / reserve / call without the 24h pass. */
export const TENANT_ACCESS_REQUIRED = PAYMENTS_REQUIRED;
