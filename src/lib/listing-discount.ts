/** Host-set percent off a listing's advertised price. */

export const MAX_LISTING_DISCOUNT_PERCENT = 70;

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function clampListingDiscountPercent(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(MAX_LISTING_DISCOUNT_PERCENT, n);
}

export function listingSalePrice(
  listPrice: number,
  discountPercent: unknown,
): number {
  const list = roundMoney(Math.max(0, listPrice));
  const pct = clampListingDiscountPercent(discountPercent);
  if (pct <= 0) return list;
  return roundMoney(list * (1 - pct / 100));
}

export function listingDiscountAmount(
  listPrice: number,
  discountPercent: unknown,
): number {
  return roundMoney(
    Math.max(0, listPrice) - listingSalePrice(listPrice, discountPercent),
  );
}

export function hasListingDiscount(discountPercent: unknown): boolean {
  return clampListingDiscountPercent(discountPercent) > 0;
}
