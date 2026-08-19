import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PropertyCardComponent } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import type { PropertyCard } from "@/types";

interface FeaturedPropertiesProps {
  properties: PropertyCard[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function FeaturedProperties({
  properties,
  title = "Featured Properties",
  subtitle = "Hand-picked listings verified by our team",
  viewAllHref = "/properties?isFeatured=true",
  viewAllLabel = "View all featured",
}: FeaturedPropertiesProps) {
  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20" aria-labelledby="featured-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2
              id="featured-heading"
              className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>
          </div>
          <Button variant="outline" asChild className="rounded-xl">
            <Link href={viewAllHref}>
              {viewAllLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="scrollbar-thin -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property, index) => (
            <div
              key={property.id}
              className="w-[min(280px,85vw)] shrink-0 snap-start sm:w-auto sm:shrink"
            >
              <PropertyCardComponent
                property={property}
                priority={index < 2}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
