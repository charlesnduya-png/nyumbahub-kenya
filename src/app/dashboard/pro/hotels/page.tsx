import { HotelsOverview } from "@/components/professional/hotels-overview";
import { getEffectiveHotelPlans } from "@/lib/hotel-plan-pricing";

export default async function ProHotelsPage() {
  const hotelPlans = await getEffectiveHotelPlans();
  return <HotelsOverview plans={hotelPlans} />;
}
