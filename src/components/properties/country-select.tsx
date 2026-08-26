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

export const ALL_COUNTRIES_VALUE = "__all__";

interface CountrySelectProps {
  id?: string;
  value?: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  allowAll?: boolean;
  triggerClassName?: string;
}

export function CountrySelect({
  id,
  value,
  onValueChange,
  disabled,
  allowAll = false,
  triggerClassName,
}: CountrySelectProps) {
  const selected = allowAll
    ? value || ALL_COUNTRIES_VALUE
    : value || DEFAULT_LISTING_COUNTRY;

  return (
    <Select value={selected} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={triggerClassName}>
        <SelectValue placeholder="Country" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {allowAll ? (
          <SelectItem value={ALL_COUNTRIES_VALUE}>All countries</SelectItem>
        ) : null}
        {AFRICAN_COUNTRIES.map((country) => (
          <SelectItem key={country.iso2} value={country.name}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
