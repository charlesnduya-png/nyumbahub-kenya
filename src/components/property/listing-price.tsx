"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { useDisplayCurrency } from "@/components/currency/currency-provider";
import {
  clampListingDiscountPercent,
  listingSalePrice,
} from "@/lib/listing-discount";
import { cn } from "@/lib/utils";

export function ListingDiscountBadge({
  discountPercent,
}: {
  discountPercent?: number | null;
}) {
  const pct = clampListingDiscountPercent(discountPercent);
  if (pct <= 0) return null;
  return (
    <Badge className="bg-rose-600 text-white hover:bg-rose-600">-{pct}%</Badge>
  );
}

export function ListingPrice({
  listPrice,
  discountPercent = 0,
  currency,
  suffix,
  className,
  size = "md",
}: {
  listPrice: number;
  discountPercent?: number | null;
  currency: string;
  suffix?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { formatConvertedPrice } = useDisplayCurrency();
  const pct = clampListingDiscountPercent(discountPercent);
  const sale = listingSalePrice(listPrice, pct);
  const sizeClass =
    size === "lg"
      ? "text-2xl font-bold tabular-nums sm:text-3xl"
      : size === "sm"
        ? "text-sm font-medium tabular-nums"
        : "font-display text-xl font-semibold tabular-nums";

  return (
    <p className={cn(sizeClass, "text-primary", className)}>
      {pct > 0 ? (
        <>
          <span
            className={cn(
              "mr-2 font-normal text-muted-foreground line-through",
              size === "lg" ? "text-base" : "text-sm",
            )}
          >
            {formatConvertedPrice(listPrice, currency)}
          </span>
          {formatConvertedPrice(sale, currency)}
        </>
      ) : (
        formatConvertedPrice(listPrice, currency)
      )}
      {suffix}
    </p>
  );
}
