import { HostReviewsManager } from "@/components/professional/host-reviews-manager";

export default function ProHotelReviewsPage() {
  return (
    <HostReviewsManager
      listingType="HOTEL"
      hideHeader
      emptyHint="No hotel reviews yet. Guests can review after you mark a stay complete."
    />
  );
}
