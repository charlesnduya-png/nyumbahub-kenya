"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import * as React from "react";

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
import { KENYA_COUNTIES, getCountyTowns } from "@/lib/kenya";
import type { ListingType } from "@/types";

const SEARCH_TABS: { value: ListingType; label: string }[] = [
  { value: "BUY", label: "Buy" },
  { value: "RENT", label: "Rent" },
  { value: "HOLIDAY", label: "BnB" },
  { value: "LAND", label: "Land" },
  { value: "COMMERCIAL", label: "Commercial" },
];

const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4", "5+"] as const;

export function HeroSearch() {
  const router = useRouter();
  const [listingType, setListingType] = React.useState<ListingType>("BUY");
  const [query, setQuery] = React.useState("");
  const [county, setCounty] = React.useState("");
  const [town, setTown] = React.useState("");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [bedrooms, setBedrooms] = React.useState("Any");

  const towns = county ? getCountyTowns(county) : [];

  React.useEffect(() => {
    setTown("");
  }, [county]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    params.set("listingType", listingType);
    if (county) params.set("county", county);
    if (town) params.set("town", town);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms !== "Any") params.set("bedrooms", bedrooms.replace("+", ""));
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-4xl rounded-3xl border border-white/30 bg-white/85 p-4 shadow-2xl shadow-black/20 backdrop-blur-2xl dark:border-white/10 dark:bg-black/55 sm:p-6">
      <Tabs
        value={listingType}
        onValueChange={(v) => setListingType(v as ListingType)}
      >
        <TabsList
          className="mb-4 h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0"
          aria-label="Property search type"
        >
          {SEARCH_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-full border border-transparent px-4 py-2 text-foreground/80 transition-all data-[state=active]:border-primary/20 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
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
                  <Label htmlFor="search-county" className="sr-only">
                    County
                  </Label>
                  <Select value={county} onValueChange={setCounty}>
                    <SelectTrigger
                      id="search-county"
                      className="h-11 rounded-xl border-border/60 bg-background/80"
                      aria-label="Select county"
                    >
                      <SelectValue placeholder="County" />
                    </SelectTrigger>
                    <SelectContent>
                      {KENYA_COUNTIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="search-town" className="sr-only">
                    Town
                  </Label>
                  <Select
                    value={town}
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
                    <SelectContent>
                      {towns.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                    placeholder="Min price (KES)"
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
                    placeholder="Max price (KES)"
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
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#0d8a62] shadow-lg shadow-primary/30 transition hover:brightness-110 sm:w-auto sm:px-10"
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
