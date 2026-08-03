import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { mockProperties } from "@/data/mock";
import { formatPrice } from "@/lib/utils";

export default function TenantRecentPage() {
  const recent = mockProperties.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recently viewed</h1>
        <p className="text-muted-foreground">
          Homes you opened recently on NyumbaHub.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((p) => (
          <Link key={p.id} href={`/properties/${p.slug}`}>
            <Card className="overflow-hidden transition hover:shadow-md">
              <div className="relative aspect-[16/10]">
                <Image
                  src={
                    p.primaryImage?.url ??
                    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={p.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
              <CardContent className="space-y-1 p-4">
                <p className="line-clamp-2 font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.town}, {p.county}
                </p>
                <p className="font-semibold text-primary">
                  {formatPrice(p.price)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
