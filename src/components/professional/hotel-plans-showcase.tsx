import Link from "next/link";
import {
  Briefcase,
  Building2,
  Check,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HOTEL_PLAN_COMPARISON_ROWS,
  HOTEL_PLANS,
  type HotelPlanProduct,
} from "@/lib/hotel-plans";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TIER_ICON = {
  FREE: Sparkles,
  STARTER: Zap,
  PRO: Crown,
  BUSINESS: Briefcase,
  ENTERPRISE: Building2,
} as const;

type HotelPlansShowcaseProps = {
  plans?: HotelPlanProduct[];
  manageHref?: string;
  planActionLabel?: string;
  showComparison?: boolean;
  showManageLink?: boolean;
  className?: string;
};

export function HotelPlansShowcase({
  plans: plansProp,
  manageHref = "/dashboard/pro/hotels/plans",
  planActionLabel = "Choose",
  showComparison = true,
  showManageLink = true,
  className,
}: HotelPlansShowcaseProps) {
  const plans = plansProp ?? HOTEL_PLANS;
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Hotel packages</h2>
          <p className="text-sm text-muted-foreground">
            Free through Enterprise — photos, group bookings, event requests,
            hotel packages, and booking analysis.
          </p>
        </div>
        {showManageLink ? (
          <Button asChild variant="outline" size="sm">
            <Link href={manageHref}>Manage plan</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {plans.map((plan) => {
          const Icon = TIER_ICON[plan.id] ?? Sparkles;
          return (
            <Card
              key={plan.id}
              className={cn(plan.popular && "border-primary/40 ring-1 ring-primary/20")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </div>
                <p className="text-xl font-bold">
                  {plan.price === 0
                    ? "Free"
                    : formatPrice(plan.price, { currency: plan.currency })}
                  {plan.price > 0 ? (
                    <span className="text-sm font-normal text-muted-foreground"> / mo</span>
                  ) : null}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                  <Link href={manageHref}>
                    {planActionLabel} {plan.name}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showComparison ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plan comparison</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="px-2 py-2 font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {HOTEL_PLAN_COMPARISON_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className="py-2.5 pr-4 font-medium">{row.label}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-2">
                        {row.value(plan.limits)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function HotelPlansNavStrip({
  basePath = "/dashboard/pro/hotels",
  plans: plansProp,
}: {
  basePath?: string;
  plans?: HotelPlanProduct[];
}) {
  const plans = plansProp ?? HOTEL_PLANS;
  const plansHref = `${basePath}/plans`;

  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Hotel packages
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {plans.map((plan) => (
          <Link
            key={plan.id}
            href={plansHref}
            className={cn(
              "shrink-0 rounded-md border px-3 py-2 transition hover:border-primary/40 hover:bg-muted/50",
              plan.popular && "border-primary/30 bg-primary/5",
            )}
          >
            <p className="text-sm font-semibold">{plan.name}</p>
            <p className="text-xs text-muted-foreground">
              {plan.price === 0
                ? "Free"
                : `${formatPrice(plan.price, { currency: plan.currency })}/mo`}
              {" · "}
              {plan.limits.maxImages} photos
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
