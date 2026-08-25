import { ListingsManager } from "@/components/professional/listings-manager";

export default function ProHotelsPage() {
  return (
    <ListingsManager
      listingType="HOTEL"
      hideHeader
      newHref="/dashboard/seller/properties/new?type=HOTEL"
      newLabel="Add hotel"
      emptyHint="No hotels yet. Add a hotel with nightly rates, photos, and facilities so guests can book from /hotels."
    />
  );
}
