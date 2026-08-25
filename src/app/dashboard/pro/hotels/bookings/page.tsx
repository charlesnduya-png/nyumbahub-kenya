import { StayBookingsManager } from "@/components/professional/stay-bookings-manager";

export default function ProHotelBookingsPage() {
  return (
    <StayBookingsManager
      listingType="HOTEL"
      hideHeader
      emptyHint="No hotel bookings yet. Guests book from your public hotel listings."
    />
  );
}
