import Link from "next/link";
import {
  Building2,
  HandCoins,
  Hotel,
  Inbox,
  MessageSquareWarning,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ProfilePhotoCard } from "@/components/professional/profile-photo-card";
import { VerifiedSellerBadgeCard } from "@/components/professional/verified-seller-badge-card";
import { ViewsChart } from "@/components/professional/views-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatRelativeDate } from "@/lib/utils";
import { listingSalePrice } from "@/lib/listing-discount";
import { getWalletSnapshot } from "@/lib/wallet";

export default async function ProfessionalAdminPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const ctx = await resolveProfessionalActingContext(userId);
  const ownerId = ctx.actingOwnerId;

  const [properties, messages, leads, pendingOffers, wallet, hotelListings] =
    await Promise.all([
    prisma.property.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        status: true,
        town: true,
        county: true,
        price: true,
        discountPercent: true,
        slug: true,
        views: true,
        listingType: true,
      },
    }),
    prisma.message.findMany({
      where: { receiverId: ownerId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        sender: { select: { name: true } },
      },
    }),
    prisma.lead.findMany({
      where: {
        OR: [{ agentId: ownerId }, { property: { ownerId } }],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        property: { select: { title: true } },
      },
    }),
    prisma.propertyOffer
      .count({
        where: {
          status: "PENDING",
          property: { ownerId },
        },
      })
      .catch(() => 0),
    (!ctx.isTeamMember ||
    ctx.permissions.manageTeam ||
    ctx.permissions.manageBookings ||
    ctx.permissions.manageListings)
      ? getWalletSnapshot(prisma, ownerId).catch(() => null)
      : Promise.resolve(null),
    prisma.property.count({
      where: {
        listingType: "HOTEL",
        OR: [{ ownerId }, { agent: { userId: ownerId } }],
      },
    }),
  ]);

  const activeListings = properties.filter((p) => p.status === "ACTIVE").length;
  const pendingListings = properties.filter((p) => p.status === "PENDING").length;
  const unread = messages.filter((m) => !m.isRead);
  const newInquiries = leads.filter((l) => l.status === "NEW");

  const viewsSeries = [
    { label: "Mon", views: properties.reduce((s, p) => s + p.views, 0), inquiries: 0 },
    { label: "Tue", views: 0, inquiries: 0 },
    { label: "Wed", views: 0, inquiries: 0 },
    { label: "Thu", views: 0, inquiries: 0 },
    { label: "Fri", views: 0, inquiries: 0 },
    { label: "Sat", views: 0, inquiries: 0 },
    { label: "Sun", views: 0, inquiries: 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold">Professional admin</h1>
            <Badge>
              {ctx.isTeamMember
                ? `${ctx.actingOwnerName}'s team`
                : "Workspace"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {ctx.isTeamMember
              ? `You are working in ${ctx.actingOwnerName}'s account with the roles assigned to you.`
              : "Manage listings, inbox, and buyer inquiries in one place."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(ctx.permissions.manageMessages ||
            ctx.teamMemberRoles.includes("READ")) && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/pro/inbox">
                <Inbox className="mr-2 h-4 w-4" />
                Inbox ({unread.length})
              </Link>
            </Button>
          )}
          {ctx.permissions.manageListings && (
            <Button asChild>
              <Link href="/dashboard/seller/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Add listing
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!ctx.isTeamMember ? (
        <div className="space-y-4">
          <ProfilePhotoCard compact />
          <VerifiedSellerBadgeCard />
        </div>
      ) : null}

      {wallet ? (
        <Link href="/dashboard/pro/wallet">
          <Card className="transition hover:border-primary/40 hover:shadow-md">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary/70" />
                <div>
                  <p className="text-sm text-muted-foreground">Available balance</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(wallet.summary.availableBalance, {
                      currency: wallet.summary.currency,
                    })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending payments</p>
                <p className="text-2xl font-bold">
                  {formatPrice(wallet.summary.pendingBalance, {
                    currency: wallet.summary.currency,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total earned</p>
                <p className="text-2xl font-bold">
                  {formatPrice(wallet.summary.lifetimeEarned, {
                    currency: wallet.summary.currency,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : null}

      <div className="space-y-4">
        <Link href="/dashboard/pro/hotels" className="block">
          <Card className="transition hover:border-primary/40 hover:shadow-md">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <Hotel className="h-8 w-8 text-primary/70" />
                <div>
                  <p className="text-sm text-muted-foreground">Hotels</p>
                  <p className="text-2xl font-bold">
                    {hotelListings} hotel{hotelListings === 1 ? "" : "s"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Listings, bookings, group stays, events, sports packages & offers
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium text-primary">Open hotels</span>
            </CardContent>
          </Card>
        </Link>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Group bookings", href: "/dashboard/pro/hotels/group-bookings" },
            { label: "Events & conferences", href: "/dashboard/pro/hotels/events-conferences" },
            { label: "Event requests", href: "/dashboard/pro/hotels/event-requests" },
            { label: "Sports team packages", href: "/dashboard/pro/hotels/sports-teams" },
            { label: "Cooperative packages", href: "/dashboard/pro/hotels/cooperative" },
            { label: "Hotel offers", href: "/dashboard/pro/hotels/offers" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border bg-card px-4 py-3 text-sm font-medium transition hover:border-primary/40 hover:bg-muted/30"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Active listings",
            value: activeListings,
            icon: Building2,
            href: "/dashboard/pro/listings",
          },
          {
            label: "Pending approval",
            value: pendingListings,
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
          {
            label: "Pending offers",
            value: pendingOffers,
            icon: HandCoins,
            href: "/dashboard/pro/offers",
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

      {properties.length > 0 ? (
        <ViewsChart data={viewsSeries} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your listings</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/pro/listings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {properties.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No listings yet. Add your first property to get started.
              </p>
            ) : (
              properties.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b pb-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.town}, {p.county} ·{" "}
                      {formatPrice(listingSalePrice(p.price, p.discountPercent))}
                      {p.discountPercent > 0 ? ` (${p.discountPercent}% off)` : ""}
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
              ))
            )}
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
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No messages yet. Buyer enquiries will appear here.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{m.sender.name ?? "Buyer"}</p>
                    {!m.isRead && <Badge>New</Badge>}
                  </div>
                  <p className="truncate text-sm">{m.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(m.createdAt)}
                  </p>
                </div>
              ))
            )}
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
          {leads.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No inquiries yet. When buyers contact you about a listing, they will show up here.
            </p>
          ) : (
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
                {leads.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{i.name}</p>
                      <p className="text-muted-foreground">{i.phone ?? i.email ?? "—"}</p>
                    </td>
                    <td className="py-3 pr-4">{i.property.title}</td>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
