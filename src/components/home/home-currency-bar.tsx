"use client";

import { CurrencySwitcher } from "@/components/currency/currency-switcher";

export function HomeCurrencyBar() {
  return (
    <div className="border-b border-border/60 bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium">Browse prices in your currency</p>
          <p className="text-xs text-muted-foreground">
            Approximate conversion from each listing&apos;s original currency.
          </p>
        </div>
        <CurrencySwitcher />
      </div>
    </div>
  );
}
