import Link from "next/link";
import {
  Building2,
  Inbox,
  MessageSquareWarning,
  Plus,
  TrendingUp,
} from "lucide-react";
import { ViewsChart } from "@/components/professional/views-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { portfolioViewsSeries } from "@/data/analytics";
import {
  mockInboxMessages,
  mockProfessionalInquiries,
  mockProfessionalStats,
} from "@/data/professional";
import { getPendingDemoListings } from "@/lib/listings-store";
import { mockProperties } from "@/data/mock";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

export default function ProfessionalAdminPage() {
  const pending = getPendingDemoListings();
  const listings = [
    ...pending.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      town: p.town,
      county: p.county,
      price: p.price,
      slug: p.slug,
    })),
    ...mockProperties.slice(0, 4).map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      town: p.town,
      county: p.county,
      price: p.price,
      slug: p.slug,
    })),
  ];

  const unread = mockInboxMessages.filter((m) => m.status === "UNREAD");
  const newInquiries = mockProfessionalInquiries.filter((i) => i.status === "NEW");
  const stats = mockProfessionalStats;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold">Professional admin</h1>
            <Badge>Workspace</Badge>
          </div>
          <p className="text-muted-foreground">
            Manage listings, inbox, and buyer inquiries in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/pro/inbox">
              <Inbox className="mr-2 h-4 w-4" />
              Inbox ({unread.length})
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/seller/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add listing
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Active listings",
            value: stats.activeListings,
            icon: Building2,
            href: "/dashboard/pro/listings",
          },
          {
            label: "Pending approval",
            value: stats.pendingListings,
            icon: TrendingUp,
            href: "/dashboard/pro/listings",
          },
          {
            label: "Unread messages",
            value: unread.length,
            icon: Inbox,
            href: "/dashboard/pro/inbox",
          },
          {
            label: "New inquiries",
            value: newInquiries.length,
            icon: MessageSquareWarning,
            href: "/dashboard/pro/inquiries",
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

      <ViewsChart data={portfolioViewsSeries} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your listings</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/pro/listings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {listings.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 border-b pb-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.town}, {p.county} · {formatPrice(p.price)}
                  </p>
                </div>
                <Badge
                  variant={
                    p.status === "ACTIVE"
                      ? "default"
                      : p.status === "PENDING"
                        ? "outline"
                        : "secondary"
                  }
                >
                  {p.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest inbox</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/pro/inbox">Open inbox</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockInboxMessages.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{m.fromName}</p>
                  {m.status === "UNREAD" && <Badge>New</Badge>}
                </div>
                <p className="truncate text-sm">{m.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeDate(m.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent inquiries</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/pro/inquiries">Manage inquiries</Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Buyer</th>
                <th className="pb-3 pr-4 font-medium">Listing</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {mockProfessionalInquiries.slice(0, 5).map((i) => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{i.name}</p>
                    <p className="text-muted-foreground">{i.phone}</p>
                  </td>
                  <td className="py-3 pr-4">{i.propertyTitle}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="secondary">
                      {i.status.replace(/_/g, " ")}
                    </Badge>
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
    </div>
  );
}
