"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  googleMapsUrl,
  hasValidCoordinates,
} from "@/lib/map-locations";

const LocationMapInner = dynamic(
  () =>
    import("@/components/maps/location-map-inner").then(
      (m) => m.LocationMapInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video items-center justify-center rounded-xl border bg-muted">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

interface PropertyLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  county?: string;
  town?: string;
  estate?: string | null;
  title?: string;
}

export function PropertyLocationMap({
  latitude,
  longitude,
  county,
  town,
  estate,
  title,
}: PropertyLocationMapProps) {
  const pinned = hasValidCoordinates(latitude, longitude);
  const label = [estate, town, county].filter(Boolean).join(", ");

  return (
    <div className="space-y-3">
      <div className="relative">
        <LocationMapInner
          mode="view"
          latitude={latitude}
          longitude={longitude}
          county={county}
          town={town}
          heightClassName="aspect-video min-h-[220px]"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {pinned
            ? `Exact location pinned${label ? ` · ${label}` : ""}`
            : label
              ? `Approximate area: ${label}`
              : "Location on map"}
          {title ? ` — ${title}` : null}
        </p>
        {pinned ? (
          <Button variant="outline" size="sm" asChild>
            <Link
              href={googleMapsUrl(latitude!, longitude!)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Open in Google Maps
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
