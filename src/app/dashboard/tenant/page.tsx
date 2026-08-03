import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Heart,
  Home,
  MessageSquare,
  Search,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  tenantInquiries,
  tenantSavedHomes,
  tenantStats,
  tenantViewings,
} from "@/data/tenant";
import { formatPrice, formatRelativeDate, formatDate } from "@/lib/utils";

export default function TenantAccountPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold">Tenant account</h1>
            <Badge variant="secondary">Customer</Badge>
          </div>
          <p className="text-muted-foreground">
            Habari Amina — track saved homes, inquiries, and viewings. Free for
            tenants and buyers.
          </p>
        </div>
        <Button asChild>
          <Link href="/rent">
            <Search className="mr-2 h-4 w-4" />
            Find a home to rent
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Saved homes",
            value: tenantStats.savedHomes,
            icon: Heart,
            href: "/dashboard/tenant/saved",
          },
          {
            label: "Open inquiries",
            value: tenantStats.openInquiries,
            icon: MessageSquare,
            href: "/dashboard/tenant/inquiries",
          },
          {
            label: "Upcoming viewings",
            value: tenantStats.upcomingViewings,
            icon: Calendar,
            href: "/dashboard/tenant/viewings",
          },
          {
            label: "Recently viewed",
            value: tenantStats.recentlyViewed,
            icon: Home,
            href: "/dashboard/tenant/recent",
          },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="transition hover:border-primary/40 hover:shadow-md">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-3xl font-bold">{item.value}</p>
                </div>
                <item.icon className="h-8 w-8 text-primary/70" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Saved homes</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/tenant/saved">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenantSavedHomes.slice(0, 3).map((home) => (
              <Link
                key={home.id}
                href={`/properties/${home.slug}`}
                className="flex gap-3 rounded-xl border p-2 transition hover:bg-muted/40"
              >
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={home.image}
                    alt={home.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{home.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {home.town}, {home.county}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {formatPrice(home.price)}
                    {home.listingType === "RENT" ? "/mo" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming viewings</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/tenant/viewings">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenantViewings.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{v.propertyTitle}</p>
                  <Badge>{v.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(v.scheduledAt, "EEE, dd MMM · HH:mm")}
                </p>
                <p className="text-xs text-muted-foreground">
                  With {v.agentName} · {v.location}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your inquiries</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/tenant/inquiries">All inquiries</Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Property</th>
                <th className="pb-3 pr-4 font-medium">Message</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Sent</th>
              </tr>
            </thead>
            <tbody>
              {tenantInquiries.map((i) => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/properties/${i.propertySlug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {i.propertyTitle}
                    </Link>
                  </td>
                  <td className="max-w-[280px] py-3 pr-4 text-muted-foreground">
                    {i.message}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant="secondary">{i.status}</Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {formatRelativeDate(i.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            Account profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">Amina Hassan</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">buyer@nyumbahub.co.ke</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium">+254733445566</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Account type</p>
            <p className="font-medium">Tenant / Buyer (free)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
