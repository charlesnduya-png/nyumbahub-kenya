import Link from "next/link";
import { BadgePercent } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomerMembership } from "@/lib/customer-membership";
import { MEMBERSHIP_LEVELS } from "@/lib/membership";

export function MembershipCard({
  membership,
  compact = false,
}: {
  membership: CustomerMembership;
  compact?: boolean;
}) {
  const progressMax = membership.next?.staysNeeded
    ? membership.stays + membership.next.staysNeeded
    : membership.stays || 1;
  const progressValue = membership.next
    ? (membership.stays / progressMax) * 100
    : 100;

  return (
    <Card className="overflow-hidden border-0 bg-primary text-primary-foreground shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-primary-foreground">
            <BadgePercent className="h-5 w-5" />
            Your Home membership
          </CardTitle>
          <Badge className="bg-white/15 text-white hover:bg-white/20">
            Level {membership.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-display text-2xl font-semibold">
            Sign in, save money
          </p>
          <p className="mt-1 text-sm text-primary-foreground/85">
            You save {Math.round(membership.discountRate * 100)}% or more on BnB
            stays with a free {membership.name} account.
          </p>
        </div>
        {!compact ? (
          <ul className="space-y-1 text-sm text-primary-foreground/90">
            {membership.perks.map((perk) => (
              <li key={perk}>• {perk}</li>
            ))}
          </ul>
        ) : null}
        {membership.next ? (
          <div>
            <div className="mb-1 flex justify-between text-xs text-primary-foreground/80">
              <span>
                {membership.stays} stay{membership.stays === 1 ? "" : "s"} completed
              </span>
              <span>
                {membership.next.staysNeeded} more to {membership.next.nextName} (
                {membership.next.nextDiscountPercent}% off)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-white"
                style={{ width: `${Math.min(100, progressValue)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-primary-foreground/80">
            You are on the highest member level.
          </p>
        )}
        {compact ? (
          <Button
            asChild
            variant="secondary"
            className="w-full rounded-xl bg-white text-primary hover:bg-white/90"
          >
            <Link href="/dashboard/tenant/membership">View membership</Link>
          </Button>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {MEMBERSHIP_LEVELS.map((level) => (
              <div
                key={level.level}
                className={`rounded-xl border p-3 text-sm ${
                  level.level === membership.level
                    ? "border-white bg-white/15"
                    : "border-white/20 bg-white/5"
                }`}
              >
                <p className="font-semibold">
                  Level {level.level} · {level.name}
                </p>
                <p className="mt-1 text-xs text-primary-foreground/80">
                  {Math.round(level.discountRate * 100)}% off BnBs
                  {level.minStays > 0 ? ` · ${level.minStays}+ stays` : " · free"}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
