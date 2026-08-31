"use client";

import { Coins } from "lucide-react";

import { useDisplayCurrency } from "@/components/currency/currency-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function CurrencySwitcher({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "hero";
}) {
  const { currency, setCurrency } = useDisplayCurrency();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Coins
        className={cn(
          "h-4 w-4 shrink-0",
          variant === "hero" ? "text-emerald-200" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <Select
        value={currency}
        onValueChange={(value) => setCurrency(value as SupportedCurrency)}
      >
        <SelectTrigger
          className={cn(
            "h-9 w-[148px] rounded-full text-sm",
            variant === "hero" &&
              "border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/15",
          )}
          aria-label="Display currency"
        >
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent align="end">
          {SUPPORTED_CURRENCIES.map((row) => (
            <SelectItem key={row.code} value={row.code}>
              {row.code} · {row.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
