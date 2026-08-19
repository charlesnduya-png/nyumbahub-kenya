import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function TenantViewingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const viewings = userId
    ? await prisma.viewing.findMany({
        where: { buyerId: userId },
        orderBy: { scheduledAt: "desc" },
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
                  agencyName: true,
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My viewings</h1>
        <p className="text-muted-foreground">
          Scheduled property visits with sellers and agents.
        </p>
      </div>

      {viewings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No viewings scheduled yet. Contact a seller to arrange a visit.
            </p>
            <Button asChild className="mt-4">
              <Link href="/properties">Browse properties</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {viewings.map((v) => {
            const location =
              [v.property.estate, v.property.town, v.property.county]
                .filter(Boolean)
                .join(", ") || "Kenya";
            const agentName =
              v.property.agent?.user?.name ??
              v.property.agent?.agencyName ??
              "Host";

            return (
              <Card key={v.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">{v.property.title}</CardTitle>
                  <Badge>{v.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {formatDate(v.scheduledAt, "EEEE, dd MMM yyyy · HH:mm")}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {location}
                  </p>
                  <p className="text-sm">Host: {agentName}</p>
                  <Button size="sm" asChild>
                    <Link href={`/properties/${v.property.slug}`}>
                      View listing
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
