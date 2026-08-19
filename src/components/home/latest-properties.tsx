import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PropertyCardComponent } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import type { PropertyCard } from "@/types";

interface LatestPropertiesProps {
  properties: PropertyCard[];
  title?: string;
  subtitle?: string;
}

export function LatestProperties({
  properties,
  title = "Latest Listings",
  subtitle = "Fresh properties added this week across Kenya",
}: LatestPropertiesProps) {
  if (properties.length === 0) {
    return null;
  }

  return (
    <section
      className="gradient-mesh py-16 sm:py-20"
      aria-labelledby="latest-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2
              id="latest-heading"
              className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>
          </div>
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/properties?sortBy=newest">
              Browse all listings
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property, index) => (
            <PropertyCardComponent
              key={property.id}
              property={property}
              priority={index < 4}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
