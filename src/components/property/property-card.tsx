import Link from "next/link";
import { Bath, BedDouble, MapPin, ShieldCheck, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingHostRow } from "@/components/properties/listing-host-row";
import { FavoriteToggle } from "@/components/property/favorite-toggle";
import { PropertyMediaImage } from "@/components/property/property-media-image";
import { ListingDiscountBadge, ListingPrice } from "@/components/property/listing-price";
import { cn } from "@/lib/utils";
import { getListingTypeLabel, getPropertyTypeLabel } from "@/lib/kenya";
import { isStayListing } from "@/lib/listing-kinds";
import type { PropertyCard } from "@/types";

interface PropertyCardProps {
  property: PropertyCard;
  className?: string;
  priority?: boolean;
}

export function PropertyCardComponent({
  property,
  className,
  priority = false,
}: PropertyCardProps) {
  const imageUrl = property.primaryImage?.url ?? property.images?.[0]?.url ?? null;
  const location = [property.estate, property.town, property.county, property.country]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-[0_10px_40px_-20px_rgba(11,110,79,0.35)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-[0_20px_50px_-18px_rgba(11,110,79,0.45)]",
        className,
      )}
    >
      <Link
        href={`/properties/${property.slug}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`View ${property.title}`}
      >
        <span className="sr-only">View {property.title}</span>
      </Link>

      <div className="relative z-[1] aspect-[4/3] overflow-hidden">
        <PropertyMediaImage
          src={imageUrl}
          alt={property.primaryImage?.alt ?? property.title}
          fill
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {property.isFeatured && (
            <Badge className="gap-1 bg-primary/90 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              Featured
            </Badge>
          )}
            {property.isVerified && (
              <Badge
                variant="secondary"
                className="gap-1 bg-white/90 text-foreground backdrop-blur-sm dark:bg-black/70 dark:text-white"
              >
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Verified
              </Badge>
            )}
          <ListingDiscountBadge discountPercent={property.discountPercent} />
        </div>

        <FavoriteToggle />

        <div className="absolute bottom-3 left-3">
          <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm dark:bg-black/80 dark:text-white">
            {getListingTypeLabel(property.listingType)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <ListingPrice
            listPrice={property.price}
            discountPercent={property.discountPercent}
            currency={property.currency}
            suffix={
              <>
                {property.listingType === "RENT" && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                )}
                {isStayListing(property.listingType) && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /night
                  </span>
                )}
              </>
            }
          />
          <span className="shrink-0 text-xs text-muted-foreground">
            {getPropertyTypeLabel(property.propertyType)}
          </span>
        </div>

        {property.listingType === "RENT" &&
        property.rentalRoomsTotal != null &&
        property.rentalRoomsTotal > 0 ? (
          <p className="mt-1 text-xs font-medium text-primary">
            {property.rentalRoomsAvailable ?? 0} of {property.rentalRoomsTotal}{" "}
            rooms available
          </p>
        ) : null}

        <h3 className="mt-1 line-clamp-1 font-medium text-foreground">
          {property.title}
        </h3>

        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">{location}</span>
        </p>

        {(property.bedrooms != null || property.bathrooms != null) && (
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" aria-hidden="true" />
                {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4" aria-hidden="true" />
                {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {property.host ? (
          <div className="relative z-20 mt-3 border-t border-border/60 pt-3">
            <ListingHostRow host={property.host} showLabel />
          </div>
        ) : null}

        {property.listingType === "RENT" && (
          <div className="relative z-20 mt-4">
            <Button className="w-full" size="sm" asChild>
              <Link href={`/properties/${property.slug}`}>
                Reserve rental
              </Link>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
      aria-hidden="true"
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
