import { HotelsSectionNav } from "@/components/professional/hotels-section-nav";

export default function ProHotelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <HotelsSectionNav />
      {children}
    </div>
  );
}
