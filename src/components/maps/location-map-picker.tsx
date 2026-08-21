"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MapCoordinates } from "@/components/maps/location-map-inner";
import { centerForCounty, hasValidCoordinates } from "@/lib/map-locations";

const LocationMapInner = dynamic(
  () =>
    import("@/components/maps/location-map-inner").then(
      (m) => m.LocationMapInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-xl border bg-muted sm:h-[320px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

interface LocationSearchResult {
  displayName: string;
  latitude: number;
  longitude: number;
  town?: string;
  county?: string;
}

interface LocationMapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  county?: string | null;
  town?: string | null;
  /** ISO 3166-1 alpha-2, lowercase (e.g. ke, ng, za). */
  countryIso?: string | null;
  onChange: (coords: MapCoordinates) => void;
  /** Optional: fill town/county from a search result */
  onPlaceSelect?: (place: {
    latitude: number;
    longitude: number;
    town?: string;
    county?: string;
    displayName: string;
  }) => void;
}

async function searchPlaces(
  query: string,
  countryIso = "ke",
): Promise<LocationSearchResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", countryIso);
  url.searchParams.set("limit", "6");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    address?: {
      suburb?: string;
      neighbourhood?: string;
      village?: string;
      town?: string;
      city?: string;
      county?: string;
      state?: string;
    };
  }>;

  return data.map((item) => {
    const addr = item.address ?? {};
    const town =
      addr.suburb ||
      addr.neighbourhood ||
      addr.village ||
      addr.town ||
      addr.city ||
      undefined;
    const county = addr.county || addr.state || undefined;

    return {
      displayName: item.display_name,
      latitude: Number(Number(item.lat).toFixed(6)),
      longitude: Number(Number(item.lon).toFixed(6)),
      town,
      county,
    };
  });
}

export function LocationMapPicker({
  latitude,
  longitude,
  county,
  town,
  countryIso = "ke",
  onChange,
  onPlaceSelect,
}: LocationMapPickerProps) {
  const pinned = hasValidCoordinates(latitude, longitude);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [openResults, setOpenResults] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpenResults(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const found = await searchPlaces(trimmed, countryIso);
          setResults(found);
          setOpenResults(true);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 400);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, countryIso]);

  function centerOnCounty() {
    const { lat, lng } = centerForCounty(county);
    onChange({ latitude: lat, longitude: lng });
  }

  function clearPin() {
    onChange({ latitude: null, longitude: null });
  }

  function pickResult(place: LocationSearchResult) {
    onChange({ latitude: place.latitude, longitude: place.longitude });
    onPlaceSelect?.({
      latitude: place.latitude,
      longitude: place.longitude,
      town: place.town,
      county: place.county,
      displayName: place.displayName,
    });
    setQuery(place.displayName.split(",")[0] ?? place.displayName);
    setOpenResults(false);
    setResults([]);
  }

  return (
    <div className="space-y-3">
      <div ref={wrapRef} className="relative">
        <LabelRow />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setOpenResults(true);
            }}
            placeholder={
              countryIso === "ke"
                ? "Search location e.g. Kilimani, Nairobi or Syokimau"
                : "Search town, suburb, or area"
            }
            className="h-11 pl-9 pr-9"
            aria-label="Search property location"
          />
          {query ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => {
                setQuery("");
                setResults([]);
                setOpenResults(false);
              }}
              aria-label="Clear location search"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          ) : searching ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        {openResults && results.length > 0 ? (
          <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
            {results.map((place) => (
              <li key={`${place.latitude}-${place.longitude}-${place.displayName}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => pickResult(place)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="line-clamp-2">{place.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {openResults && !searching && query.trim().length >= 3 && results.length === 0 ? (
          <div className="absolute z-30 mt-1 w-full rounded-lg border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg">
            No places found in Kenya. Try a town, estate, or landmark.
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Search above, or tap the map / drag the pin to mark the property.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={centerOnCounty}>
            <MapPin className="mr-1.5 h-3.5 w-3.5" />
            Use {county || "area"} centre
          </Button>
          {pinned ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearPin}>
              Clear pin
            </Button>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <LocationMapInner
          mode="pick"
          latitude={latitude}
          longitude={longitude}
          county={county}
          town={town}
          onChange={onChange}
        />
      </div>

      {pinned ? (
        <p className="text-xs text-muted-foreground">
          Pinned at{" "}
          <span className="font-mono text-foreground">
            {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
          </span>
          {[town, county].filter(Boolean).length > 0
            ? ` · ${[town, county].filter(Boolean).join(", ")}`
            : null}
        </p>
      ) : (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          No pin yet — buyers will see approximate location from town/county only.
        </p>
      )}
    </div>
  );
}

function LabelRow() {
  return (
    <p className="mb-1.5 text-sm font-medium text-foreground">
      Search location
    </p>
  );
}
