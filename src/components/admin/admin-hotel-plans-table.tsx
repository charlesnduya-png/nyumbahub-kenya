import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HOTEL_PLANS, type HotelPlanProduct } from "@/lib/hotel-plans";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

type PlanRow = {
  id: string;
  tier: string;
  startDate: Date;
  endDate: Date | null;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};

const tierName = Object.fromEntries(HOTEL_PLANS.map((p) => [p.id, p.name]));

export function AdminHotelPlansTable({
  plans,
  hotelPlans = HOTEL_PLANS,
}: {
  plans: PlanRow[];
  hotelPlans?: HotelPlanProduct[];
}) {
  const tierSummary = hotelPlans.map((plan) => ({
    ...plan,
    count: plans.filter((row) => row.tier === plan.id).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tierSummary.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{plan.name}</p>
              <p className="text-2xl font-bold">{plan.count}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.price === 0
                  ? "Free"
                  : `${formatPrice(plan.price, { currency: plan.currency })}/mo`}
                {" · "}
                {plan.count === 1 ? "1 operator" : `${plan.count} operators`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All hotel operator plans</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hotel plans recorded yet. Operators default to Free until they pay for a
              paid tier.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Operator</th>
                  <th className="pb-2 pr-4">Plan</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">Started</th>
                  <th className="pb-2 pr-4">Expires</th>
                  <th className="pb-2">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plans.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{row.user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{row.user.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={row.tier === "FREE" ? "secondary" : "default"}>
                        {tierName[row.tier] ?? row.tier}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.user.role}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatRelativeDate(row.startDate.toISOString())}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {row.endDate
                        ? formatRelativeDate(row.endDate.toISOString())
                        : row.tier === "FREE"
                          ? "—"
                          : "Open"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {formatRelativeDate(row.updatedAt.toISOString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
