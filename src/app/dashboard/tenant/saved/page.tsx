import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tenantSavedHomes } from "@/data/tenant";
import { formatPrice } from "@/lib/utils";

export default function TenantSavedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved homes</h1>
        <p className="text-muted-foreground">
          Properties you liked while browsing NyumbaHub.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tenantSavedHomes.map((home) => (
          <Card key={home.id} className="overflow-hidden">
            <div className="relative aspect-[16/10]">
              <Image
                src={home.image}
                alt={home.title}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 33vw"
              />
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
                <Button size="sm" variant="outline">
                  <Heart className="mr-1 h-3.5 w-3.5 fill-current" />
                  Saved
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
