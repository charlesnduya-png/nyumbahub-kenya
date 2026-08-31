import { AdminHotelPlanPricing } from "@/components/admin/admin-hotel-plan-pricing";
import { AdminHotelPlansTable } from "@/components/admin/admin-hotel-plans-table";
import { getAdminHotelPlans } from "@/lib/admin-hotels";
import { getEffectiveHotelPlans } from "@/lib/hotel-plan-pricing";

export default async function AdminHotelPlansPage() {
  const [operatorPlans, hotelPlans] = await Promise.all([
    getAdminHotelPlans(),
    getEffectiveHotelPlans(),
  ]);

  return (
    <div className="space-y-6">
      <AdminHotelPlanPricing initialPlans={hotelPlans} />
      <AdminHotelPlansTable plans={operatorPlans} hotelPlans={hotelPlans} />
    </div>
  );
}
