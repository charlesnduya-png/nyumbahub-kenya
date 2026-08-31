"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  Check,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import {
  HOTEL_PLAN_COMPARISON_ROWS,
  HOTEL_PLANS,
  formatHotelPackageCap,
  type HotelPlanProduct,
  type HotelPlanTierId,
} from "@/lib/hotel-plans";
import type { HotelPlanUsage } from "@/lib/hotel-plan-server";
import { cn } from "@/lib/utils";

const TIER_ICON = {
  FREE: Sparkles,
  STARTER: Zap,
  PRO: Crown,
  BUSINESS: Briefcase,
  ENTERPRISE: Building2,
} as const;

function tierIcon(id: HotelPlanTierId) {
  return TIER_ICON[id] ?? Sparkles;
}

export function HotelPlansPanel() {
  const [usage, setUsage] = useState<HotelPlanUsage | null>(null);
  const [plans, setPlans] = useState<HotelPlanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<HotelPlanTierId | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hotel-plans/mine");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { usage: HotelPlanUsage; plans: HotelPlanProduct[] };
      };
      if (json.success && json.data) {
        setUsage(json.data.usage);
        setPlans(json.data.plans);
      }
    } catch {
      toast.error("Could not load hotel plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upgrade = async (tier: HotelPlanTierId) => {
    if (tier === usage?.tier) return;
    setUpgrading(tier);
    try {
      const res = await fetch("/api/hotel-plans/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not change plan");
        return;
      }
      toast.success(tier === "FREE" ? "Switched to Free plan" : `${tier} plan activated`);
      void load();
    } catch {
      toast.error("Could not change plan");
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading hotel plans…</p>;
  }

  const comparisonPlans = plans.length > 0 ? plans : HOTEL_PLANS;

  return (
    <div className="space-y-6">
      {usage ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="text-xl font-bold">{usage.planName}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Photos: up to {usage.limits.maxImages} / listing</span>
              <span>
                Packages: {usage.packagesUsed} /{" "}
                {formatHotelPackageCap(usage.limits.maxHotelPackages)}
              </span>
              {usage.limits.eventRequestsPerMonth !== 0 && (
                <span>
                  Event requests this month: {usage.eventRequestsThisMonth}
                  {usage.limits.eventRequestsPerMonth != null
                    ? ` / ${usage.limits.eventRequestsPerMonth}`
                    : " (unlimited)"}
                </span>
              )}
              <span>
                Analysis: {usage.limits.bookingAnalytics === "advanced" ? "Advanced" : "Basic"}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {(plans.length > 0 ? plans : HOTEL_PLANS).map((plan) => {
          const Icon = tierIcon(plan.id);
          const active = usage?.tier === plan.id;
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                active && "border-primary ring-1 ring-primary",
                plan.popular && !active && "border-primary/40",
              )}
            >
              {plan.popular ? (
                <Badge className="absolute -top-2.5 right-4">Popular</Badge>
              ) : null}
              <CardHeader className="pb-3">
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
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-4 flex-1 space-y-1.5 text-xs">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={active ? "secondary" : "default"}
                  size="sm"
                  disabled={active || upgrading !== null}
                  onClick={() => void upgrade(plan.id)}
                  className="w-full"
                >
                  {active
                    ? "Current plan"
                    : upgrading === plan.id
                      ? "Updating…"
                      : plan.price === 0
                        ? "Use Free"
                        : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan comparison</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Feature</th>
                {comparisonPlans.map((plan) => (
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
                  {comparisonPlans.map((plan) => (
                    <td
                      key={plan.id}
                      className={cn(
                        "px-2",
                        plan.id === "FREE" && "text-muted-foreground",
                      )}
                    >
                      {row.value(plan.limits)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Need M-Pesa checkout for paid plans?{" "}
        <Link href="/dashboard/agent/subscription" className="text-primary underline">
          Contact support
        </Link>{" "}
        — plan switches above apply immediately for testing.
      </p>
    </div>
  );
}

