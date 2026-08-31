import { AdminHotelsDashboard } from "@/components/admin/admin-hotels-dashboard";
import { getAdminHotelsDashboard } from "@/lib/admin-hotels";

export default async function AdminHotelsPage() {
  const data = await getAdminHotelsDashboard();
  return <AdminHotelsDashboard data={data} />;
}
