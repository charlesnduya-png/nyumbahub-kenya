import { ListingsManager } from "@/components/professional/listings-manager";

export default function AdminHotelListingsPage() {
  return (
    <ListingsManager
      listingType="HOTEL"
      hideHeader
      newHref="/dashboard/seller/properties/new?type=HOTEL"
      newLabel="Add hotel"
      emptyHint="No hotels in the system yet."
    />
  );
}
