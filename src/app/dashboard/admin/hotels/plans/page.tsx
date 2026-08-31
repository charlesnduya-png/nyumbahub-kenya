import { AdminHotelPlansTable } from "@/components/admin/admin-hotel-plans-table";
import { getAdminHotelPlans } from "@/lib/admin-hotels";

export default async function AdminHotelPlansPage() {
  const plans = await getAdminHotelPlans();
  return <AdminHotelPlansTable plans={plans} />;
}
