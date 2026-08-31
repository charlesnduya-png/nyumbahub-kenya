import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarRange,
  ClipboardList,
  Hotel,
  Package,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminHotelsDashboardData } from "@/lib/admin-hotels";
import { HOTEL_SERVICE_SECTIONS } from "@/lib/hotel-services";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

const BASE = "/dashboard/admin/hotels";

export function AdminHotelsDashboard({ data }: { data: AdminHotelsDashboardData }) {
  const { stats, planTiers, serviceCounts, recentBookings, recentRequests } = data;

  const statCards = [
    {
      label: "Hotel listings",
      value: stats.hotelListings,
      hint: `${stats.activeHotels} active · ${stats.pendingHotels} pending`,
      href: `${BASE}/listings`,
      icon: Building2,
    },
    {
      label: "Nightly bookings",
      value: stats.totalBookings,
      hint: `${stats.pendingBookings} pending · ${stats.approvedBookings} confirmed`,
      href: `${BASE}/bookings`,
      icon: CalendarRange,
    },
    {
      label: "Hotel packages",
      value: stats.totalPackages,
      hint: `${stats.activePackages} live across all operators`,
      href: `${BASE}/group-bookings`,
      icon: Package,
    },
    {
      label: "Service requests",
      value: stats.totalRequests,
      hint: `${stats.openRequests} open enquiries`,
      href: `${BASE}/event-requests`,
      icon: ClipboardList,
    },
    {
      label: "Paid hotel plans",
      value: stats.paidPlans,
      hint: formatPrice(stats.planRevenueKes, { currency: "KES" }) + " plan revenue",
      href: `${BASE}/plans`,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <p className="font-semibold">Site owner · Hotels command centre</p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Monitor every hotel listing, nightly booking, operator plan, published package,
              and group or event request across Your Home.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/properties?listingType=HOTEL">View public hotels</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group block">
              <Card className="h-full transition hover:border-primary/40 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-3xl font-bold">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Operator plans on site</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${BASE}/plans`}>All plans</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {planTiers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hotel plans assigned yet.</p>
            ) : (
              <ul className="space-y-2">
                {planTiers.map((row) => (
                  <li
                    key={row.tier}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{row.tier}</span>
                    <Badge variant="secondary">{row.count} operators</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Specialised hotel services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {serviceCounts.map((row) => {
              const section = HOTEL_SERVICE_SECTIONS.find((s) => s.key === row.key);
              return (
                <Link
                  key={row.key}
                  href={`${BASE}/${row.slug}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm transition hover:border-primary/40 hover:bg-muted/30"
                >
                  <span>{row.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.packages} packages · {row.requests} requests
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent hotel bookings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${BASE}/bookings`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hotel bookings yet.</p>
            ) : (
              recentBookings.map((b) => (
                <div key={b.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{b.propertyTitle}</p>
                    <Badge variant="outline">{b.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.guestName ?? "Guest"} · {b.ownerName ?? "Operator"} ·{" "}
                    {formatRelativeDate(b.createdAt)}
                  </p>
                  <p className="mt-1 text-xs font-medium">
                    {formatPrice(b.totalAmount, { currency: b.currency })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent service requests</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${BASE}/event-requests`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No service requests yet.</p>
            ) : (
              recentRequests.map((r) => (
                <div key={r.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{r.contactName}</p>
                    <Badge variant="outline">{r.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.category.replace(/_/g, " ")} · {r.ownerName ?? "Operator"} ·{" "}
                    {formatRelativeDate(r.createdAt)}
                  </p>
                  {r.organization ? (
                    <p className="mt-1 text-xs">{r.organization}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Hotel className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Quick admin links</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "All hotel listings", href: `${BASE}/listings` },
            { label: "Bookings inbox", href: `${BASE}/bookings` },
            { label: "Guest reviews", href: `${BASE}/reviews` },
            { label: "Operator plans", href: `${BASE}/plans` },
            { label: "Group bookings", href: `${BASE}/group-bookings` },
            { label: "Events & conferences", href: `${BASE}/events-conferences` },
            { label: "Sports packages", href: `${BASE}/sports-teams` },
            { label: "Hotel offers", href: `${BASE}/offers` },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border p-4 text-sm font-medium transition hover:border-primary/40 hover:bg-muted/30"
            >
              {item.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
