"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hotel, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addHotelPath } from "@/lib/hotel-listing";
import { HOTEL_CORE_TABS, HOTEL_SERVICE_SECTIONS } from "@/lib/hotel-services";
import { cn } from "@/lib/utils";

export function HotelsSectionNav({
  basePath = "/dashboard/pro/hotels",
}: {
  basePath?: string;
}) {
  const pathname = usePathname();

  const coreTabs = HOTEL_CORE_TABS.map((tab) => ({
    ...tab,
    href: tab.href.replace("/dashboard/pro/hotels", basePath),
  }));

  const serviceTabs = HOTEL_SERVICE_SECTIONS.map((section) => ({
    href: `${basePath}/${section.slug}`,
    label: section.shortLabel,
    match: "prefix" as const,
  }));

  const isActive = (href: string, match: "overview" | "listings" | "prefix") => {
    if (match === "overview") {
      return pathname === href;
    }
    if (match === "listings") {
      return pathname === href || pathname === `${basePath}/listings`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Hotel className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Hotels</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Listings, bookings, group stays, events, sports packages, cooperative rates, and offers
            — plans from Free through Enterprise for photos, packages, and analysis.
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
        {coreTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:px-4",
              isActive(tab.href, tab.match)
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex w-full gap-1 overflow-x-auto rounded-lg border bg-card p-1">
        {serviceTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm sm:px-4",
              isActive(tab.href, tab.match)
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
