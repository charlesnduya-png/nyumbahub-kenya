import type { Prisma } from "@prisma/client";
import {
  flagsFromListingFeatures,
  listingFeatureBySlug,
  sanitizeListingFeatureSlugs,
} from "@/lib/listing-features";

type AmenityTx = Pick<Prisma.TransactionClient, "amenity" | "propertyAmenity">;

export async function syncPropertyListingFeatures(
  tx: AmenityTx,
  propertyId: string,
  slugs: string[] | undefined,
) {
  const features = sanitizeListingFeatureSlugs(slugs);
  const amenities = [];

  for (const slug of features) {
    const feature = listingFeatureBySlug(slug);
    if (!feature) continue;
    const row = await tx.amenity.upsert({
      where: { name: feature.name },
      create: {
        name: feature.name,
        icon: feature.slug,
        category: feature.groupLabel,
      },
      update: {
        icon: feature.slug,
        category: feature.groupLabel,
      },
    });
    amenities.push(row);
  }

  await tx.propertyAmenity.deleteMany({ where: { propertyId } });
  if (amenities.length > 0) {
    await tx.propertyAmenity.createMany({
      data: amenities.map((amenity) => ({
        propertyId,
        amenityId: amenity.id,
      })),
    });
  }

  return flagsFromListingFeatures(features);
}
