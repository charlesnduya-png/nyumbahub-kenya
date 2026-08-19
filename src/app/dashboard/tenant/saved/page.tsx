import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function TenantSavedPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const favorites = userId
    ? await prisma.favorite.findMany({
        where: { userId },
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
              bedrooms: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved homes</h1>
        <p className="text-muted-foreground">
          Properties you liked while browsing Your Home.
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No saved homes yet. Tap the heart on any listing to add it here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/properties">Browse properties</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map(({ property: home }) => (
            <Card key={home.id} className="overflow-hidden">
              <div className="relative aspect-[16/10] bg-muted">
                {home.images[0]?.url ? (
                  <Image
                    src={home.images[0].url}
                    alt={home.title}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                ) : null}
                <Badge className="absolute left-3 top-3">{home.listingType}</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2 text-base">
                  {home.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {home.town}, {home.county}
                  {home.bedrooms ? ` · ${home.bedrooms} bed` : ""}
                </p>
                <p className="text-lg font-bold text-primary">
                  {formatPrice(home.price)}
                  {home.listingType === "RENT" ? "/mo" : ""}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" asChild>
                    <Link href={`/properties/${home.slug}`}>Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
