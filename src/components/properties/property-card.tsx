"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bath, Bed, MapPin, ParkingCircle, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ListingHostRow } from "@/components/properties/listing-host-row";
import { PropertyMediaImage } from "@/components/property/property-media-image";
import { PropertyVideoPlayer } from "@/components/property/property-video-player";
import { getListingTypeLabel, getPropertyTypeLabel } from "@/lib/kenya";
import { isStayListing } from "@/lib/listing-kinds";
import { ListingDiscountBadge, ListingPrice } from "@/components/property/listing-price";
import type { PropertyCard } from "@/types";

interface PropertyCardItemProps {
  property: PropertyCard;
}

export function PropertyCardItem({ property }: PropertyCardItemProps) {
  const imageUrl =
    property.primaryImage?.url ??
    property.images?.[0]?.url ??
    null;

  const firstVideo = property.videos?.[0];
  const [videoOpen, setVideoOpen] = useState(false);

  const showVideo = Boolean(firstVideo?.url);
  const videoTitle = useMemo(
    () => firstVideo?.title ?? "Property video",
    [firstVideo?.title],
  );

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/properties/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <PropertyMediaImage
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
            <ListingDiscountBadge discountPercent={property.discountPercent} />
            {property.videos && property.videos.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <Video className="h-3.5 w-3.5" />
                Video
              </Badge>
            )}
          </div>

          {showVideo ? (
            <button
              type="button"
              aria-label="Play property video"
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white backdrop-blur hover:bg-black/80"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setVideoOpen(true);
              }}
            >
              <Video className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <CardContent className="p-4">
          <ListingPrice
            listPrice={property.price}
            discountPercent={property.discountPercent}
            currency={property.currency}
            size="sm"
            className="text-lg font-semibold"
            suffix={
              <>
                {property.listingType === "RENT" && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / month
                  </span>
                )}
                {isStayListing(property.listingType) && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / night
                  </span>
                )}
              </>
            }
          />
          <h3 className="mt-1 line-clamp-2 font-medium">{property.title}</h3>
          {property.listingType === "RENT" &&
          property.rentalRoomsTotal != null &&
          property.rentalRoomsTotal > 0 ? (
            <p className="mt-1 text-xs font-medium text-primary">
              {property.rentalRoomsAvailable ?? 0} of {property.rentalRoomsTotal}{" "}
              rooms available
            </p>
          ) : null}
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[property.estate, property.town, property.county, property.country]
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
          {property.host ? (
            <div className="relative z-20 mt-3 border-t pt-3">
              <ListingHostRow host={property.host} showLabel />
            </div>
          ) : null}
        </CardContent>
      </Link>
      <div className="px-4 pb-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/properties/${property.slug}`}>View details</Link>
        </Button>
      </div>

      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-3xl p-0">
          <div className="rounded-lg bg-background p-4">
            <h2 className="mb-3 text-base font-semibold">{videoTitle}</h2>
            {firstVideo ? (
              <PropertyVideoPlayer url={firstVideo.url} title={videoTitle} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
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
