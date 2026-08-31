import { notFound } from "next/navigation";
import { AdminHotelServicesPanel } from "@/components/admin/admin-hotel-services-panel";
import { HOTEL_SERVICE_SECTIONS, getHotelSection } from "@/lib/hotel-services";

export function generateStaticParams() {
  return HOTEL_SERVICE_SECTIONS.map((section) => ({ slug: section.slug }));
}

export default async function AdminHotelServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getHotelSection(slug)) notFound();

  return <AdminHotelServicesPanel slug={slug} />;
}
