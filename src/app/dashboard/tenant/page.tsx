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
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatRelativeDate, formatDate } from "@/lib/utils";

export default async function TenantAccountPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const displayName = session?.user?.name ?? "Tenant";
  const displayEmail = session?.user?.email ?? "—";

  const empty = {
    savedHomes: [] as Array<{
      id: string;
      title: string;
      slug: string;
      price: number;
      town: string;
      county: string;
      listingType: string;
      image: string | null;
    }>,
    viewings: [] as Array<{
      id: string;
      scheduledAt: Date;
      status: string;
      propertyTitle: string;
      propertySlug: string;
      location: string;
      agentName: string;
    }>,
    inquiries: [] as Array<{
      id: string;
      message: string | null;
      status: string;
      createdAt: Date;
      propertyTitle: string;
      propertySlug: string;
    }>,
    savedCount: 0,
    inquiryCount: 0,
    viewingCount: 0,
    recentCount: 0,
    phone: null as string | null,
  };

  let data = empty;

  if (userId) {
    const [user, favorites, viewings, leads, savedCount, viewingCount, leadCount, recentCount] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { phone: true, name: true, email: true },
        }),
        prisma.favorite.findMany({
          where: { userId },
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                town: true,
                county: true,
                listingType: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        }),
        prisma.viewing.findMany({
          where: {
            buyerId: userId,
            status: "SCHEDULED",
            scheduledAt: { gte: new Date() },
          },
          take: 5,
          orderBy: { scheduledAt: "asc" },
          include: {
            property: {
              select: {
                title: true,
                slug: true,
                town: true,
                county: true,
                estate: true,
                agent: {
                  select: {
                    user: { select: { name: true } },
                    agencyName: true,
                  },
                },
              },
            },
          },
        }),
        prisma.lead.findMany({
          where: { buyerId: userId },
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            property: { select: { title: true, slug: true } },
          },
        }),
        prisma.favorite.count({ where: { userId } }),
        prisma.viewing.count({
          where: {
            buyerId: userId,
            status: "SCHEDULED",
            scheduledAt: { gte: new Date() },
          },
        }),
        prisma.lead.count({ where: { buyerId: userId } }),
        prisma.recentlyViewed.count({ where: { userId } }),
      ]);

    const inquiryCount = leadCount;

    data = {
      savedHomes: favorites.map((f) => ({
        id: f.property.id,
        title: f.property.title,
        slug: f.property.slug,
        price: f.property.price,
        town: f.property.town,
        county: f.property.county,
        listingType: f.property.listingType,
        image: f.property.images[0]?.url ?? null,
      })),
      viewings: viewings.map((v) => ({
        id: v.id,
        scheduledAt: v.scheduledAt,
        status: v.status,
        propertyTitle: v.property.title,
        propertySlug: v.property.slug,
        location:
          [v.property.estate, v.property.town, v.property.county]
            .filter(Boolean)
            .join(", ") || "Kenya",
        agentName:
          v.property.agent?.user?.name ??
          v.property.agent?.agencyName ??
          "Host",
      })),
      inquiries: leads.map((l) => ({
        id: l.id,
        message: l.message,
        status: l.status,
        createdAt: l.createdAt,
        propertyTitle: l.property.title,
        propertySlug: l.property.slug,
      })),
      savedCount,
      inquiryCount,
      viewingCount,
      recentCount,
      phone: user?.phone ?? null,
    };
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold">Tenant account</h1>
            <Badge variant="secondary">Customer</Badge>
          </div>
          <p className="text-muted-foreground">
            Habari {displayName.split(" ")[0]} — track saved homes, inquiries,
            and viewings.
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
            value: data.savedCount,
            icon: Heart,
            href: "/dashboard/tenant/saved",
          },
          {
            label: "Open inquiries",
            value: data.inquiryCount,
            icon: MessageSquare,
            href: "/dashboard/tenant/messages",
          },
          {
            label: "Upcoming viewings",
            value: data.viewingCount,
            icon: Calendar,
            href: "/dashboard/tenant/viewings",
          },
          {
            label: "Recently viewed",
            value: data.recentCount,
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
            {data.savedHomes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No saved homes yet. Tap the heart on a listing to save it.
              </p>
            ) : (
              data.savedHomes.map((home) => (
                <Link
                  key={home.id}
                  href={`/properties/${home.slug}`}
                  className="flex gap-3 rounded-xl border p-2 transition hover:bg-muted/40"
                >
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {home.image ? (
                      <Image
                        src={home.image}
                        alt={home.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : null}
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
              ))
            )}
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
            {data.viewings.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No viewings scheduled yet.
              </p>
            ) : (
              data.viewings.map((v) => (
                <div key={v.id} className="rounded-xl border p-3">
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
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your inquiries</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/tenant/messages">All messages</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.inquiries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No inquiries yet. Contact a seller from any listing to start a
              conversation.
            </p>
          ) : (
            <div className="overflow-x-auto">
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
                  {data.inquiries.map((i) => (
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
                        {i.message ?? "—"}
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
            </div>
          )}
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
            <p className="font-medium">{displayName}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">{displayEmail}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium">{data.phone || "—"}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Account type</p>
            <p className="font-medium">Tenant / Buyer</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
