"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import * as React from "react";

import { CountrySelect, ALL_COUNTRIES_VALUE } from "@/components/properties/country-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildHeroSearchParams,
  placesForHeroCountry,
} from "@/lib/hero-search";
import { getCountyTowns } from "@/lib/kenya";
import type { ListingType } from "@/types";

const SEARCH_TABS: { value: ListingType; label: string }[] = [
  { value: "BUY", label: "Buy" },
  { value: "RENT", label: "Rent" },
  { value: "HOLIDAY", label: "BnB" },
  { value: "HOTEL", label: "Hotels" },
  { value: "LAND", label: "Land" },
  { value: "COMMERCIAL", label: "Commercial" },
];

const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4", "5+"] as const;

export function HeroSearch() {
  const router = useRouter();
  const [listingType, setListingType] = React.useState<ListingType>("BUY");
  const [query, setQuery] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [county, setCounty] = React.useState("");
  const [town, setTown] = React.useState("");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [bedrooms, setBedrooms] = React.useState("Any");

  const kenya = country === "Kenya";
  const places = placesForHeroCountry(country);
  const towns = kenya && county ? getCountyTowns(county) : [];
  const placeValue = kenya ? county : town;
  const placeLabel = kenya ? "County" : "City";
  const placePlaceholder = country
    ? kenya
      ? "County"
      : places.length > 0
        ? "City"
        : "No cities listed"
    : "Select country first";

  React.useEffect(() => {
    setCounty("");
    setTown("");
  }, [country]);

  React.useEffect(() => {
    if (kenya) setTown("");
  }, [county, kenya]);

  function handleCountryChange(value: string) {
    setCountry(value === ALL_COUNTRIES_VALUE ? "" : value);
  }

  function handlePlaceChange(value: string) {
    if (kenya) {
      setCounty(value);
      return;
    }
    setTown(value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = buildHeroSearchParams({
      listingType,
      query,
      country,
      county,
      town,
      minPrice,
      maxPrice,
      bedrooms,
    });
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-4xl rounded-2xl border border-white/30 bg-white/85 p-3 shadow-2xl shadow-black/20 backdrop-blur-2xl dark:border-white/10 dark:bg-black/55 sm:rounded-3xl sm:p-6">
      <Tabs
        value={listingType}
        onValueChange={(v) => setListingType(v as ListingType)}
      >
        <TabsList
          className="mb-4 flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-2xl bg-muted/60 p-1.5 dark:bg-white/10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Property search type"
        >
          {SEARCH_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-all data-[state=inactive]:border-border/70 data-[state=inactive]:bg-muted data-[state=inactive]:text-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=inactive]:border-white/25 dark:data-[state=inactive]:bg-white/15 dark:data-[state=inactive]:text-white dark:data-[state=active]:border-primary dark:data-[state=active]:bg-primary dark:data-[state=active]:text-white sm:px-4"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SEARCH_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            <form onSubmit={handleSubmit} role="search" aria-label="Property search">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="search-query" className="sr-only">
                    Search location or keyword
                  </Label>
                  <Input
                    id="search-query"
                    type="search"
                    placeholder="Search by location, estate, or keyword..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-11 rounded-xl border-border/60 bg-background/80"
                  />
                </div>

                <div>
                  <Label htmlFor="search-country" className="sr-only">
                    Country
                  </Label>
                  <CountrySelect
                    id="search-country"
                    allowAll
                    value={country || ALL_COUNTRIES_VALUE}
                    onValueChange={handleCountryChange}
                    triggerClassName="h-11 rounded-xl border-border/60 bg-background/80"
                  />
                </div>

                <div>
                  <Label htmlFor="search-place" className="sr-only">
                    {placeLabel}
                  </Label>
                  <Select
                    key={country || "none"}
                    value={placeValue || undefined}
                    onValueChange={handlePlaceChange}
                    disabled={!country || places.length === 0}
                  >
                    <SelectTrigger
                      id="search-place"
                      className="h-11 rounded-xl border-border/60 bg-background/80"
                      aria-label={`Select ${placeLabel.toLowerCase()}`}
                    >
                      <SelectValue placeholder={placePlaceholder} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {places.map((place) => (
                        <SelectItem key={place} value={place}>
                          {place}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {kenya ? (
                  <div>
                    <Label htmlFor="search-town" className="sr-only">
                      Town
                    </Label>
                    <Select
                      value={town || undefined}
                      onValueChange={setTown}
                      disabled={!county || towns.length === 0}
                    >
                      <SelectTrigger
                        id="search-town"
                        className="h-11 rounded-xl border-border/60 bg-background/80"
                        aria-label="Select town"
                      >
                        <SelectValue
                          placeholder={
                            county ? "Town / Estate" : "Select county first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {towns.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div>
                  <Label htmlFor="search-bedrooms" className="sr-only">
                    Bedrooms
                  </Label>
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger
                      id="search-bedrooms"
                      className="h-11 rounded-xl border-border/60 bg-background/80"
                      aria-label="Number of bedrooms"
                    >
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      {BEDROOM_OPTIONS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b === "Any" ? "Any bedrooms" : `${b} bedroom${b === "1" ? "" : "s"}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="search-min-price" className="sr-only">
                    Minimum price
                  </Label>
                  <Input
                    id="search-min-price"
                    type="number"
                    placeholder="Min price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-11 rounded-xl border-border/60 bg-background/80"
                    min={0}
                  />
                </div>

                <div>
                  <Label htmlFor="search-max-price" className="sr-only">
                    Maximum price
                  </Label>
                  <Input
                    id="search-max-price"
                    type="number"
                    placeholder="Max price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-11 rounded-xl border-border/60 bg-background/80"
                    min={0}
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-4 w-full rounded-xl bg-primary text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 sm:w-auto sm:px-10"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Search properties
              </Button>
            </form>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
