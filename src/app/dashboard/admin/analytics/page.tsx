import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { AmountSeriesChart } from "@/components/dashboard/amount-series-chart";
import { AdminProfitTracker } from "@/components/dashboard/admin-profit-tracker";
import { AdminAccountsOverview } from "@/components/dashboard/admin-accounts-overview";
import { AdminGrowthTracker } from "@/components/dashboard/admin-growth-tracker";
import { getAdminRevenueSummary } from "@/lib/admin-revenue";
import { getAdminGrowthSummary } from "@/lib/admin-growth";

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const start30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const bucketCount = 8;

  const [
    mauApprox,
    newListings30d,
    newLeads30d,
    revenue30dAgg,
    listingsByCountyAgg,
    paymentsForCharts,
    revenueSummary,
    growthSummary,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: start30d } } }),
    prisma.property.count({
      where: { status: "ACTIVE", createdAt: { gte: start30d } },
    }),
    prisma.lead.count({ where: { createdAt: { gte: start30d } } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: start30d } },
      _sum: { amount: true },
    }),
    prisma.property.groupBy({
      by: ["county"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
    prisma.payment.findMany({
      where: { status: "COMPLETED", createdAt: { gte: start30d } },
      select: {
        amount: true,
        createdAt: true,
        user: { select: { role: true } },
      },
    }),
    getAdminRevenueSummary(prisma),
    getAdminGrowthSummary(prisma),
  ]);

  const revenue30dAmount = revenue30dAgg._sum.amount ?? 0;

  const totalCounty = listingsByCountyAgg.reduce(
    (acc, r) => acc + r._count._all,
    0,
  );

  const sortedCounties = listingsByCountyAgg
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 4);

  const listingsCountyItems =
    totalCounty > 0
      ? (() => {
          const items = sortedCounties.map((r) => ({
            county: r.county,
            pct: Math.round((r._count._all / totalCounty) * 100),
          }));
          const otherPct = 100 - items.reduce((acc, x) => acc + x.pct, 0);
          return otherPct > 0 ? [...items, { county: "Other", pct: otherPct }] : items;
        })()
      : [];

  // User registration trend: last 4 months
  const monthBuckets: Array<{ month: string; users: number }> = [];
  for (let i = 3; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const users = await prisma.user.count({
      where: { createdAt: { gte: from, lt: to } },
    });
    const label = from.toLocaleString("en-KE", {
      month: "short",
      year: "numeric",
    });
    monthBuckets.push({ month: label, users });
  }

  const maxTrend = Math.max(...monthBuckets.map((b) => b.users), 1);

  // Build payment series buckets for charts
  const bucketMs = (30 * 24 * 60 * 60 * 1000) / bucketCount;
  const paymentsBuckets = new Array(bucketCount).fill(0);
  const agentPaymentsBuckets = new Array(bucketCount).fill(0);

  for (const p of paymentsForCharts) {
    const idx = Math.floor((p.createdAt.getTime() - start30d.getTime()) / bucketMs);
    const safeIdx = Math.min(Math.max(idx, 0), bucketCount - 1);
    paymentsBuckets[safeIdx] += p.amount;
    if (p.user.role === "AGENT") {
      agentPaymentsBuckets[safeIdx] += p.amount;
    }
  }

  const paymentsChartData = paymentsBuckets.map((value, i) => ({
    label: new Date(start30d.getTime() + i * bucketMs).toLocaleString("en-KE", {
      month: "short",
      day: "numeric",
    }),
    value,
  }));

  const agentPaymentsChartData = agentPaymentsBuckets.map((value, i) => ({
    label: new Date(start30d.getTime() + i * bucketMs).toLocaleString("en-KE", {
      month: "short",
      day: "numeric",
    }),
    value,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform analytics</h1>
        <p className="text-muted-foreground">
          Growth, engagement, and revenue metrics for Your Home.
        </p>
      </div>

      <AdminAccountsOverview
        accounts={growthSummary.accounts}
        activeAccounts={growthSummary.activeAccounts}
      />

      <AdminGrowthTracker growth={growthSummary} />

      <AdminProfitTracker revenue={revenueSummary} />

      <div className="grid gap-6 md:grid-cols-4">
        {[
          {
            label: "Monthly active users (30d)",
            value: mauApprox.toLocaleString("en-KE"),
          },
          {
            label: "New listings (30d)",
            value: newListings30d.toLocaleString("en-KE"),
          },
          {
            label: "Lead enquiries (30d)",
            value: newLeads30d.toLocaleString("en-KE"),
          },
          {
            label: "Revenue (30d)",
            value: `KES ${revenue30dAmount.toLocaleString("en-KE")}`,
          },
          {
            label: "Revenue (today)",
            value: `KES ${revenueSummary.daily.toLocaleString("en-KE")}`,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-primary mt-1">Live metrics</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Listings by county</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {listingsCountyItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active listings yet.</p>
            ) : (
              listingsCountyItems.map((item) => (
                <div key={item.county} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.county}</span>
                    <span className="text-muted-foreground">{item.pct}%</span>
                  </div>
                  <Progress value={item.pct} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>User registration trend</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {monthBuckets.map((item) => (
              <div key={item.month} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.month}</span>
                  <span className="text-muted-foreground">{item.users} new users</span>
                </div>
                <Progress value={(item.users / maxTrend) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AmountSeriesChart
          title="Site payments (last 30d)"
          subtitle="Total completed payments across all products"
          data={paymentsChartData}
        />
        <AmountSeriesChart
          title="Agent payments (last 30d)"
          subtitle="Total completed payments where the payer role is AGENT"
          data={agentPaymentsChartData}
        />
      </div>
    </div>
  );
}
