import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PropertyForSaleLocationPage } from "@/components/seo/property-for-sale-location";
import { searchForSaleByLocation } from "@/lib/properties";
import {
  getAllPropertyForSalePlaces,
  getPropertyForSalePlace,
  propertyForSalePath,
  salePlaceDescription,
  salePlaceFaqs,
  salePlaceKeywords,
  salePlaceTitle,
} from "@/lib/property-for-sale";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqPageJsonLd,
  itemListJsonLd,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ place: string }>;
}

export function generateStaticParams() {
  return getAllPropertyForSalePlaces().map((place) => ({ place: place.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { place: slug } = await params;
  const place = getPropertyForSalePlace(slug);
  if (!place) {
    return { title: "Place not found", robots: { index: false } };
  }
  return buildPageMetadata({
    title: salePlaceTitle(place),
    description: salePlaceDescription(place),
    path: propertyForSalePath(place.slug),
    keywords: salePlaceKeywords(place),
  });
}

export const revalidate = 3600;

export default async function PropertyForSalePlacePage({ params }: PageProps) {
  const { place: slug } = await params;
  const place = getPropertyForSalePlace(slug);
  if (!place) notFound();

  const result = await searchForSaleByLocation({
    county: place.county,
    town: place.kind === "town" ? place.name : undefined,
    limit: 24,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Property for sale", path: "/property-for-sale" },
              {
                name: place.name,
                path: propertyForSalePath(place.slug),
              },
            ]),
            itemListJsonLd(
              salePlaceTitle(place),
              result.data.map((listing) => ({
                name: listing.title,
                path: `/properties/${listing.slug}`,
              })),
            ),
            faqPageJsonLd(salePlaceFaqs(place)),
          ]),
        }}
      />
      <PropertyForSaleLocationPage
        place={place}
        listings={result.data}
        total={result.total}
        minPrice={result.minPrice}
        maxPrice={result.maxPrice}
      />
    </>
  );
}
