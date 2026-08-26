"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { PropertyCardItem } from "@/components/properties/property-card";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CountrySelect, ALL_COUNTRIES_VALUE } from "@/components/properties/country-select";
import { KENYA_COUNTIES, LISTING_TYPES } from "@/lib/kenya";
import type { PropertyCard } from "@/types";

interface SearchResult {
  data: PropertyCard[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  fallback?: boolean;
}

export function PropertySearchClient({
  initialData,
}: {
  initialData: SearchResult;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialData.page);

  const fetchProperties = useCallback(
    async (pageNum: number, append = false) => {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(pageNum));
      params.set("limit", "12");

      try {
        const res = await fetch(`/api/properties?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setResults((prev) =>
            append
              ? {
                  ...json,
                  data: [...prev.data, ...json.data],
                }
              : json,
          );
          setPage(pageNum);
        }
      } finally {
        setLoading(false);
      }
    },
    [searchParams],
  );

  useEffect(() => {
    setResults(initialData);
    setPage(initialData.page);
  }, [initialData]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/properties?${params.toString()}`);
  }

  const filterForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Listing type</Label>
        <Select
          value={searchParams.get("listingType") ?? "all"}
          onValueChange={(v) => updateFilter("listingType", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {LISTING_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Country</Label>
        <CountrySelect
          allowAll
          value={searchParams.get("country") || ALL_COUNTRIES_VALUE}
          onValueChange={(v) => {
            const params = new URLSearchParams(searchParams.toString());
            if (!v || v === ALL_COUNTRIES_VALUE) {
              params.delete("country");
            } else {
              params.set("country", v);
            }
            if (v !== "Kenya") params.delete("county");
            params.delete("page");
            router.push(`/properties?${params.toString()}`);
          }}
        />
      </div>
      {searchParams.get("country") === "Kenya" ? (
        <div className="space-y-2">
          <Label>County</Label>
          <Select
            value={searchParams.get("county") ?? "all"}
            onValueChange={(v) => updateFilter("county", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All counties</SelectItem>
              {KENYA_COUNTIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label>Min price</Label>
        <Input
          type="number"
          placeholder="e.g. 5000000"
          defaultValue={searchParams.get("minPrice") ?? ""}
          onBlur={(e) => updateFilter("minPrice", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Max price</Label>
        <Input
          type="number"
          placeholder="e.g. 20000000"
          defaultValue={searchParams.get("maxPrice") ?? ""}
          onBlur={(e) => updateFilter("maxPrice", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Min bedrooms</Label>
        <Select
          value={searchParams.get("bedrooms") ?? "all"}
          onValueChange={(v) => updateFilter("bedrooms", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}+ beds
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24 rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Filters</h2>
          {filterForm}
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-muted-foreground">
            {results.total} propert{results.total === 1 ? "y" : "ies"} found
          </p>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{filterForm}</div>
            </SheetContent>
          </Sheet>
        </div>

        {results.data.length === 0 ? (
          <div className="rounded-lg border bg-muted/50 py-16 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No properties match your search</h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or browse all listings across Africa.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.data.map((property) => (
                <PropertyCardItem key={property.id} property={property} />
              ))}
            </div>
            {results.hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => fetchProperties(page + 1, true)}
                >
                  {loading ? "Loading…" : "Load more properties"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
