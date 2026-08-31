import { AdminPropertiesManager } from "@/components/admin/admin-properties-manager";

export default function AdminHotelListingsPage() {
  return (
    <AdminPropertiesManager
      listingType="HOTEL"
      hideHeader
      emptyHint="No hotels in the system yet."
    />
  );
}
