"use client";

import { useState } from "react";
import { ViewsChart } from "@/components/professional/views-chart";
import { SellerStatsCards } from "@/components/dashboard/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listingViewsBreakdown,
  portfolioViewsSeries,
} from "@/data/analytics";
import { mockSellerStats } from "@/data/mock";

export default function SellerAnalyticsPage() {
  const [selectedListing, setSelectedListing] = useState(
    listingViewsBreakdown[0]?.id ?? "",
  );

  const selected =
    listingViewsBreakdown.find((l) => l.id === selectedListing) ??
    listingViewsBreakdown[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Listing analytics</h1>
        <p className="text-muted-foreground">
          See how many people viewed your listings and which ones convert best.
        </p>
      </div>

      <SellerStatsCards stats={mockSellerStats} />

      <ViewsChart
        data={portfolioViewsSeries}
        title="All listings — views this week"
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Views by listing</CardTitle>
          <Select value={selectedListing} onValueChange={setSelectedListing}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Choose listing" />
            </SelectTrigger>
            <SelectContent>
              {listingViewsBreakdown.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {selected && (
            <ViewsChart
              data={selected.series}
              title={`${selected.title} — daily views`}
              height={180}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top performing listings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {listingViewsBreakdown.map((listing) => (
              <div key={listing.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="line-clamp-1 font-medium">
                    {listing.title}
                  </span>
                  <span className="ml-2 shrink-0 text-muted-foreground">
                    {listing.totalViews.toLocaleString()} views
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    100,
                    (listing.totalViews /
                      Math.max(
                        ...listingViewsBreakdown.map((l) => l.totalViews),
                      )) *
                      100,
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { source: "NyumbaHub search", pct: 45 },
              { source: "Google organic", pct: 28 },
              { source: "WhatsApp shares", pct: 15 },
              { source: "Featured placement", pct: 12 },
            ].map((item) => (
              <div key={item.source} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.source}</span>
                  <span className="text-muted-foreground">{item.pct}%</span>
                </div>
                <Progress value={item.pct} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
