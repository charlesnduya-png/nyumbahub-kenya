import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LocationMarketPage } from "@/components/seo/property-for-sale-location";
import {
  locationPlaceMetadata,
  locationPlacePageData,
  locationPlaceStaticParams,
} from "@/lib/location-place-route";

interface PageProps {
  params: Promise<{ place: string }>;
}

export function generateStaticParams() {
  return locationPlaceStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { place } = await params;
  return locationPlaceMetadata(place, "bnb");
}

export const revalidate = 3600;

export default async function BnbPlacePage({ params }: PageProps) {
  const { place: slug } = await params;
  const data = await locationPlacePageData(slug, "bnb");
  if (!data) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.jsonLd) }}
      />
      <LocationMarketPage
        place={data.place}
        intent="bnb"
        listings={data.result.data}
        total={data.result.total}
        minPrice={data.result.minPrice}
        maxPrice={data.result.maxPrice}
      />
    </>
  );
}
