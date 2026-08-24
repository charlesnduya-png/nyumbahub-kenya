import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

import type { TopLocation } from "@/lib/marketing";

interface TopLocationsProps {
  locations: TopLocation[];
  title?: string;
  subtitle?: string;
}

export function TopLocations({
  locations,
  title = "Top Locations",
  subtitle = "Explore properties in Kenya's most sought-after cities",
}: TopLocationsProps) {
  if (locations.length === 0) {
    return null;
  }

  return (
    <section
      className="cv-auto gradient-mesh py-16 sm:py-20"
      aria-labelledby="locations-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2
            id="locations-heading"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location, index) => (
            <Link
              key={location.slug}
              href={`/property-for-sale/${location.slug}`}
              className="group relative overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div
                className={`relative ${index === 0 ? "aspect-[16/9] sm:col-span-2 lg:col-span-2 lg:row-span-2 lg:aspect-auto lg:min-h-[320px]" : "aspect-[16/10]"}`}
              >
                <Image
                  src={location.image}
                  alt={`Properties in ${location.name}`}
                  fill
                  sizes={
                    index === 0
                      ? "(max-width: 1024px) 100vw, 66vw"
                      : "(max-width: 640px) 100vw, 33vw"
                  }
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-2xl font-semibold text-white">
                    {location.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {location.county} County ·{" "}
                    {location.listingCount.toLocaleString()} listings
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
