import { AdminPropertiesManager } from "@/components/admin/admin-properties-manager";

export default function AdminHotelsPage() {
  return (
    <AdminPropertiesManager
      listingType="HOTEL"
      hideHeader
      emptyHint="No hotel listings yet. Use Add hotel to publish a hotel with nightly rates."
    />
  );
}
