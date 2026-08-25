import { HostReviewsManager } from "@/components/professional/host-reviews-manager";

export default function AdminHotelReviewsPage() {
  return (
    <HostReviewsManager
      listingType="HOTEL"
      hideHeader
      emptyHint="No hotel reviews yet."
    />
  );
}
