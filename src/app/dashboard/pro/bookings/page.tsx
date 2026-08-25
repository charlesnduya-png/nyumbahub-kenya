import { StayBookingsManager } from "@/components/professional/stay-bookings-manager";

export default function OwnerBookingsPage() {
  return (
    <StayBookingsManager
      listingType="HOLIDAY"
      title="BnB bookings"
      subtitle="Stay requests for your holiday homes and BnBs. Hotel bookings are under Hotels."
      emptyHint="No BnB bookings yet. Hotel stays appear in Hotels → Bookings."
    />
  );
}
