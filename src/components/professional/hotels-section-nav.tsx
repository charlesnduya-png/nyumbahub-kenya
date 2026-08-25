"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hotel, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addHotelPath } from "@/lib/hotel-listing";
import { cn } from "@/lib/utils";

export function HotelsSectionNav({
  basePath = "/dashboard/pro/hotels",
}: {
  basePath?: string;
}) {
  const pathname = usePathname();
  const tabs = [
    { href: basePath, label: "Listings", match: "exact" as const },
    {
      href: `${basePath}/bookings`,
      label: "Bookings",
      match: "prefix" as const,
    },
    {
      href: `${basePath}/reviews`,
      label: "Reviews",
      match: "prefix" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Hotel className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Hotels</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Nightly hotel listings, guest bookings, and reviews — separate from
            houses and BnBs.
          </p>
        </div>
        <Button asChild>
          <Link href={addHotelPath()}>
            <Plus className="mr-2 h-4 w-4" />
            Add hotel
          </Link>
        </Button>
      </div>

      <div className="flex w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {tabs.map((tab) => {
          const active =
            tab.match === "exact"
              ? pathname === tab.href || pathname === `${basePath}/listings`
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
