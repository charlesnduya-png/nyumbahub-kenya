import Link from "next/link";
import { AdminStatsCards } from "@/components/dashboard/stats-cards";
import { AdminProfitTracker } from "@/components/dashboard/admin-profit-tracker";
import { AdminAccountsOverview } from "@/components/dashboard/admin-accounts-overview";
import { AdminGrowthTracker } from "@/components/dashboard/admin-growth-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getAdminRevenueSummary, getKenyaPeriodStarts } from "@/lib/admin-revenue";
import { getAdminGrowthSummary } from "@/lib/admin-growth";

const ADMIN_SECTIONS = [
  {
    title: "Accounts",
    description: "Tenants, agents, landlords, and admins",
    href: "/dashboard/admin/users",
  },
  {
    title: "Teams",
    description: "Account admins, member emails, and assigned roles",
    href: "/dashboard/admin/teams",
  },
  {
    title: "Properties",
    description: "View, update status, or delete any listing",
    href: "/dashboard/admin/properties",
  },
  {
    title: "Reported accounts",
    description: "Review customer reports about agents",
    href: "/dashboard/admin/reported-accounts",
  },
  {
    title: "Rental reservations",
    description: "Tenant requests — mark rented to hide listing",
    href: "/dashboard/admin/rental-reservations",
  },
  {
    title: "Verify accounts",
    description: "Approve agents and landlords for the Verified badge",
    href: "/dashboard/admin/verification",
  },
  {
    title: "Payments",
    description: "Listing fees, boosts, and subscriptions",
    href: "/dashboard/admin/payments",
  },
  {
    title: "Wallets",
    description: "Withdrawals, balances, and agent rankings",
    href: "/dashboard/admin/wallets",
  },
  {
    title: "Subscriptions",
    description: "Active and expired plans",
    href: "/dashboard/admin/subscriptions",
  },
  {
    title: "Ads",
    description: "Banners and sponsored campaigns",
    href: "/dashboard/admin/ads",
  },
  {
    title: "Blog",
    description: "Articles and market guides",
    href: "/dashboard/admin/blog",
  },
  {
    title: "Listing Approvals",
    description: "Approve or reject pending listings",
    href: "/dashboard/admin/moderation",
  },
  {
    title: "Featured agents",
    description: "Homepage featured agents and ratings",
    href: "/dashboard/admin/agents",
  },
  {
    title: "Site traffic",
    description: "Live visitors — week, month, and year tracking",
    href: "/dashboard/admin/traffic",
  },
  {
    title: "Analytics",
    description: "Graphs and site tracking",
    href: "/dashboard/admin/analytics",
  },
] as const;

export default async function AdminDashboardPage() {
  const [totalUsers, activeListings, pendingModeration, revenue, growth] =
    await Promise.all([
      prisma.user.count(),
      prisma.property.count({ where: { status: "ACTIVE" } }),
      prisma.property.count({ where: { status: "PENDING" } }),
      getAdminRevenueSummary(prisma),
      getAdminGrowthSummary(prisma),
    ]);

  const revenueMTD = revenue.monthly;
  const agentPaymentSum = await prisma.payment.aggregate({
    where: {
      status: "COMPLETED",
      createdAt: { gte: getKenyaPeriodStarts().monthStart },
      user: { role: "AGENT" },
    },
    _sum: { amount: true },
  });

  const agentRevenueMTD = agentPaymentSum._sum.amount ?? 0;

  const [pendingItems, recentPayments, pendingReports, pendingRentals] =
    await Promise.all([
    prisma.property.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, listingType: true },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { user: { select: { email: true } } },
    }),
    prisma.agentReport
      .findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          agent: { include: { user: { select: { name: true } } } },
          reporter: { select: { name: true } },
        },
      })
      .catch(() => []),
    prisma.rentalReservation
      .findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          property: { select: { title: true } },
          tenant: { select: { name: true } },
        },
      })
      .catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <p className="text-muted-foreground">
          Site owner control center for Your Home.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Site traffic</CardTitle>
          <Link
            href="/dashboard/admin/traffic"
            className="text-sm text-primary hover:underline"
          >
            Open live view →
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track visitors in real time and compare today, this week, this
            month, and this year.
          </p>
        </CardContent>
      </Card>

      <AdminStatsCards
        stats={{
          totalUsers,
          activeListings,
          pendingModeration,
          revenueMTD,
          agentRevenueMTD,
        }}
      />

      <AdminAccountsOverview
        accounts={growth.accounts}
        activeAccounts={growth.activeAccounts}
      />

      <AdminGrowthTracker growth={growth} />

      <AdminProfitTracker revenue={revenue} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Admin sections</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ADMIN_SECTIONS.map((section) => (
            <Link key={section.href} href={section.href} className="block">
              <Card className="h-full transition hover:border-primary/40 hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Reported accounts
              {pendingReports.length > 0 ? (
                <Badge className="ml-2">{pendingReports.length} pending</Badge>
              ) : null}
            </CardTitle>
            <Link
              href="/dashboard/admin/reported-accounts"
              className="text-sm text-primary hover:underline"
            >
              Open
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending agent reports.
              </p>
            ) : (
              pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 text-sm"
                >
                  <span>
                    {report.reporter.name ?? "Customer"} reported{" "}
                    {report.agent.user.name ?? "agent"}
                  </span>
                  <Badge variant="outline">{report.reason}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Rental reservations
              {pendingRentals.length > 0 ? (
                <Badge className="ml-2">{pendingRentals.length} pending</Badge>
              ) : null}
            </CardTitle>
            <Link
              href="/dashboard/admin/rental-reservations"
              className="text-sm text-primary hover:underline"
            >
              Open
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRentals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending rental reservations.
              </p>
            ) : (
              pendingRentals.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 text-sm"
                >
                  <span>
                    {res.tenant.name ?? "Tenant"} → {res.property.title}
                  </span>
                  <Badge variant="outline">Rent</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending moderation</CardTitle>
            <Link
              href="/dashboard/admin/moderation"
              className="text-sm text-primary hover:underline"
            >
              Open
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No listings waiting for approval.
              </p>
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <span className="text-sm">New listing: {item.title}</span>
                  <Badge variant="outline">Property</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent payments</CardTitle>
            <Link
              href="/dashboard/admin/payments"
              className="text-sm text-primary hover:underline"
            >
              Open
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            ) : (
              recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 text-sm"
                >
                  <span className="font-mono text-muted-foreground">
                    {p.reference ?? p.id}
                  </span>
                  <span>{`KES ${p.amount.toLocaleString("en-KE")}`}</span>
                  <Badge variant="secondary">
                    {p.method === "MPESA"
                      ? "M-Pesa"
                      : p.method === "CARD"
                        ? "Card"
                        : p.method}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
