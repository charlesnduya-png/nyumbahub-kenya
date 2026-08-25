import { Check, ParkingCircle } from "lucide-react";

import {
  groupedListingFeatures,
  listingFeatureSlugsFromAmenities,
} from "@/lib/listing-features";

export function ListingFeaturesDisplay({
  amenities,
  parkingSpaces,
  listingType,
}: {
  amenities?: Array<{
    amenity?: { name?: string | null; icon?: string | null } | null;
  }> | null;
  parkingSpaces?: number | null;
  listingType?: string | null;
}) {
  const slugs = listingFeatureSlugsFromAmenities(amenities);
  const groups = groupedListingFeatures(slugs, listingType ?? undefined);
  const hasParkingCount = (parkingSpaces ?? 0) > 0;

  if (groups.length === 0 && !hasParkingCount) {
    return (
      <p className="text-sm text-muted-foreground">
        The seller has not added feature details yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="mb-3 text-sm font-semibold">{group.label}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {group.features.map((feature) => (
              <li key={feature.slug} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-primary" />
                {feature.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {hasParkingCount ? (
        <p className="flex items-center gap-2 text-sm">
          <ParkingCircle className="h-4 w-4 text-primary" />
          {parkingSpaces} parking space{parkingSpaces === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}
