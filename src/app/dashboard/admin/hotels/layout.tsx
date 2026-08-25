import { HotelsSectionNav } from "@/components/professional/hotels-section-nav";

export default function AdminHotelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <HotelsSectionNav basePath="/dashboard/admin/hotels" />
      {children}
    </div>
  );
}
