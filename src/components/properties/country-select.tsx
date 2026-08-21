"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AFRICAN_COUNTRIES,
  DEFAULT_LISTING_COUNTRY,
} from "@/lib/african-countries";

interface CountrySelectProps {
  id?: string;
  value?: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CountrySelect({
  id,
  value,
  onValueChange,
  disabled,
}: CountrySelectProps) {
  const selected = value || DEFAULT_LISTING_COUNTRY;

  return (
    <Select value={selected} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Country" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {AFRICAN_COUNTRIES.map((country) => (
          <SelectItem key={country.iso2} value={country.name}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
