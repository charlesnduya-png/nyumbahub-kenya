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
  variant?: "default" | "hero" | "header";
}) {
  const { currency, setCurrency } = useDisplayCurrency();
  const showIcon = variant !== "header";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon ? (
        <Coins
          className={cn(
            "h-4 w-4 shrink-0",
            variant === "hero" ? "text-emerald-200" : "text-muted-foreground",
          )}
          aria-hidden
        />
      ) : null}
      <Select
        value={currency}
        onValueChange={(value) => setCurrency(value as SupportedCurrency)}
      >
        <SelectTrigger
          className={cn(
            "h-9 rounded-full text-sm",
            variant === "default" && "w-[148px]",
            variant === "header" &&
              "h-9 w-[4.25rem] border-0 bg-transparent px-2 shadow-none hover:bg-accent focus:ring-0 focus:ring-offset-0",
            variant === "hero" &&
              "w-[148px] border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/15",
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
