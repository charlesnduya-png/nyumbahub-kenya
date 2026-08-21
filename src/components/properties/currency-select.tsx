"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_LISTING_CURRENCY,
  LISTING_CURRENCIES,
  listingCurrencyLabel,
} from "@/lib/currencies";

interface CurrencySelectProps {
  id?: string;
  value?: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CurrencySelect({
  id,
  value,
  onValueChange,
  disabled,
}: CurrencySelectProps) {
  const selected = value || DEFAULT_LISTING_CURRENCY;

  return (
    <Select
      value={selected}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder="Currency">
          {listingCurrencyLabel(selected)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LISTING_CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.code} · {currency.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
