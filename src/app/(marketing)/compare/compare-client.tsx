"use client";

import Link from "next/link";
import { GitCompare } from "lucide-react";
import { PropertyCardItem } from "@/components/properties/property-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { getListingTypeLabel, getPropertyTypeLabel } from "@/lib/kenya";
import type { PropertyCard } from "@/types";

interface ComparePageClientProps {
  compared: PropertyCard[];
}

export default function ComparePageClient({ compared }: ComparePageClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Your Home
          </Link>
          <Link href="/properties">Browse more</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <GitCompare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Compare properties</h1>
            <p className="text-muted-foreground">
              Side-by-side comparison of up to 4 listings
            </p>
          </div>
        </div>

        {compared.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No properties selected. Browse listings and add them to compare.
              </p>
              <Button asChild className="mt-4">
                <Link href="/properties">Find properties</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">Feature</th>
                    {compared.map((p) => (
                      <th key={p.id} className="p-3 text-left font-medium min-w-[180px]">
                        <Link
                          href={`/properties/${p.slug}`}
                          className="hover:text-primary line-clamp-2"
                        >
                          {p.title}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: "Price",
                      values: compared.map((p) =>
                        formatPrice(p.price, { currency: p.currency }),
                      ),
                    },
                    {
                      label: "Type",
                      values: compared.map((p) =>
                        getPropertyTypeLabel(p.propertyType),
                      ),
                    },
                    {
                      label: "Listing",
                      values: compared.map((p) =>
                        getListingTypeLabel(p.listingType),
                      ),
                    },
                    {
                      label: "Location",
                      values: compared.map(
                        (p) => `${p.town}, ${p.county}`,
                      ),
                    },
                    {
                      label: "Bedrooms",
                      values: compared.map((p) => p.bedrooms ?? "—"),
                    },
                    {
                      label: "Bathrooms",
                      values: compared.map((p) => p.bathrooms ?? "—"),
                    },
                    {
                      label: "Parking",
                      values: compared.map((p) => p.parkingSpaces || "—"),
                    },
                    {
                      label: "Furnished",
                      values: compared.map((p) => (p.furnished ? "Yes" : "No")),
                    },
                    {
                      label: "Pool",
                      values: compared.map((p) =>
                        p.swimmingPool ? "Yes" : "No",
                      ),
                    },
                    {
                      label: "Verified",
                      values: compared.map((p) =>
                        p.isVerified ? "Yes" : "No",
                      ),
                    },
                  ].map((row) => (
                    <tr key={row.label} className="border-b">
                      <td className="p-3 font-medium text-muted-foreground">
                        {row.label}
                      </td>
                      {row.values.map((val, i) => (
                        <td key={i} className="p-3">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {compared.map((p) => (
                <PropertyCardItem key={p.id} property={p} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
