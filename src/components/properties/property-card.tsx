"use client";

import Link from "next/link";
import Image from "next/image";
import { Bath, Bed, MapPin, ParkingCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getListingTypeLabel, getPropertyTypeLabel } from "@/lib/kenya";
import { formatPrice } from "@/lib/utils";
import type { PropertyCard } from "@/types";

interface PropertyCardItemProps {
  property: PropertyCard;
}

export function PropertyCardItem({ property }: PropertyCardItemProps) {
  const imageUrl =
    property.primaryImage?.url ??
    property.images?.[0]?.url ??
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600";

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/properties/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge>{getListingTypeLabel(property.listingType)}</Badge>
            {property.isFeatured && (
              <Badge variant="secondary">Featured</Badge>
            )}
            {property.isVerified && (
              <Badge className="bg-primary">Verified</Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <p className="text-lg font-semibold text-primary">
            {formatPrice(property.price, { currency: property.currency })}
            {property.listingType === "RENT" && (
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / month
              </span>
            )}
            {property.listingType === "HOLIDAY" && (
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / night
              </span>
            )}
          </p>
          <h3 className="mt-1 line-clamp-2 font-medium">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[property.estate, property.town, property.county]
              .filter(Boolean)
              .join(", ")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{getPropertyTypeLabel(property.propertyType)}</span>
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                {property.bathrooms}
              </span>
            )}
            {property.parkingSpaces > 0 && (
              <span className="flex items-center gap-1">
                <ParkingCircle className="h-3.5 w-3.5" />
                {property.parkingSpaces}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
      <div className="px-4 pb-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/properties/${property.slug}`}>View details</Link>
        </Button>
      </div>
    </Card>
  );
}

export function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <CardContent className="space-y-3 p-4">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
