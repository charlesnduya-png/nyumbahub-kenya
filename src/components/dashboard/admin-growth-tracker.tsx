import {
  Building2,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AmountSeriesChart } from "@/components/dashboard/amount-series-chart";
import { Badge } from "@/components/ui/badge";
import {
  ACCOUNT_TYPE_LABELS,
  type AdminGrowthSummary,
} from "@/lib/admin-growth";
import type { Role } from "@prisma/client";

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-xs text-muted-foreground">No prior month</span>
    );
  }
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${up ? "text-emerald-600" : "text-red-600"}`}
    >
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}
      {value}% vs last month
    </span>
  );
}

const ROLE_ORDER: Role[] = ["BUYER", "AGENT", "SELLER", "ADMIN"];

export function AdminGrowthTracker({ growth }: { growth: AdminGrowthSummary }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Site growth</h2>
        <p className="text-sm text-muted-foreground">
          New signups, listings, and engagement — Kenya time (EAT).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New today
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {growth.newToday.toLocaleString("en-KE")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              accounts registered today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New this week
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {growth.newThisWeek.toLocaleString("en-KE")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              signups since Monday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New this month
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {growth.newThisMonth.toLocaleString("en-KE")}
            </p>
            <div className="mt-2">
              <ChangeBadge value={growth.newVsLastMonth} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active listings
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {growth.activeListings.toLocaleString("en-KE")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              +{growth.newListingsThisMonth} new this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New signups by account type (14 days)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ROLE_ORDER.map((role) => (
            <Badge key={role} variant="secondary" className="px-3 py-1">
              {ACCOUNT_TYPE_LABELS[role].label}:{" "}
              {growth.signupsByRole14Days[role].toLocaleString("en-KE")}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <AmountSeriesChart
          title="Daily signups (last 14 days)"
          subtitle="New accounts registered each day"
          data={growth.signupsLast14Days.map((d) => ({
            label: d.label,
            value: d.total,
          }))}
        />
        <AmountSeriesChart
          title="Monthly signups (last 6 months)"
          subtitle="Total new accounts per month"
          data={growth.monthlySignups.map((m) => ({
            label: m.label,
            value: m.total,
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AmountSeriesChart
          title="New listings (last 6 months)"
          subtitle="Properties submitted per month"
          data={growth.monthlyListings.map((m) => ({
            label: m.label,
            value: m.count,
          }))}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Lead enquiries</p>
                  <p className="text-sm text-muted-foreground">All time</p>
                </div>
              </div>
              <p className="text-xl font-bold tabular-nums">
                {growth.totalLeads.toLocaleString("en-KE")}
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Enquiries this month</p>
                <p className="text-sm text-muted-foreground">
                  Tenant & buyer interest
                </p>
              </div>
              <p className="text-xl font-bold tabular-nums">
                {growth.newLeadsThisMonth.toLocaleString("en-KE")}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              Monthly signup breakdown (this month):{" "}
              {ROLE_ORDER.map((role, i) => (
                <span key={role}>
                  {i > 0 ? " · " : ""}
                  {ACCOUNT_TYPE_LABELS[role].label}{" "}
                  {growth.monthlySignups.at(-1)?.byRole[role] ?? 0}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
