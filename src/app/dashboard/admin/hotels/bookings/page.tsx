import { StayBookingsManager } from "@/components/professional/stay-bookings-manager";

export default function AdminHotelBookingsPage() {
  return (
    <StayBookingsManager
      listingType="HOTEL"
      hideHeader
      emptyHint="No hotel bookings yet."
    />
  );
}
