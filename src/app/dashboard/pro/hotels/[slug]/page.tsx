import { notFound } from "next/navigation";
import { HotelServicesPanel } from "@/components/professional/hotel-services-panel";
import { HOTEL_SERVICE_SECTIONS, getHotelSection } from "@/lib/hotel-services";

export function generateStaticParams() {
  return HOTEL_SERVICE_SECTIONS.map((section) => ({ slug: section.slug }));
}

export default async function ProHotelServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const section = getHotelSection(slug);
  if (!section) notFound();

  return <HotelServicesPanel section={section} />;
}
