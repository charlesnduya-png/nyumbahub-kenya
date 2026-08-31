"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HotelPlanUsage } from "@/lib/hotel-plan-server";
import { isHotelSectionMuted, canCreateHotelPackages } from "@/lib/hotel-plans";

export function HotelPlanMutedBanner({
  usage,
  sectionKey,
  reason,
}: {
  usage: HotelPlanUsage | null;
  sectionKey?: string;
  reason?: string;
}) {
  if (!usage) return null;

  const mutedBySection =
    sectionKey && isHotelSectionMuted(usage.tier, sectionKey);
  const mutedPackages =
    sectionKey &&
    sectionKey !== "EVENT_BOOKING_REQUEST" &&
    !canCreateHotelPackages(usage.tier);

  const showBanner =
    Boolean(reason) ||
    Boolean(mutedBySection) ||
    (Boolean(mutedPackages) && usage.tier === "FREE");

  if (!showBanner) return null;

  const message =
    reason ??
    (sectionKey === "GROUP_BOOKING"
      ? "Group bookings are available on Starter, Pro, Business, and Enterprise."
      : sectionKey === "EVENT_BOOKING_REQUEST"
        ? "Event booking requests are available on paid plans — Starter (5/month), Pro, Business, and Enterprise (unlimited)."
        : "Hotel packages require a paid plan — Starter (3), Pro (10), Business (25), or Enterprise (unlimited).");

  return (
    <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium">Upgrade to unlock</p>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Current plan: <strong>{usage.planName}</strong>
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/pro/hotels/plans">View plans</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
