"use client";

import { Globe2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_LISTING_COUNTRY } from "@/lib/african-countries";
import type { CountryListingsReport } from "@/lib/admin-country-report";
import { cn } from "@/lib/utils";

interface CountryListingsReportPanelProps {
  report: CountryListingsReport;
}

export function CountryListingsReportPanel({
  report,
}: CountryListingsReportPanelProps) {
  const maxCountry = Math.max(...report.byCountry.map((c) => c.listings), 1);
  const maxWeek = Math.max(...report.weekly.map((w) => w.total), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Countries with listings",
            value: report.countriesLive.toLocaleString("en-KE"),
            hint: "African countries live on the site",
          },
          {
            label: "Kenya listings",
            value: report.kenya.toLocaleString("en-KE"),
            hint: `${report.total ? Math.round((report.kenya / report.total) * 100) : 0}% of inventory`,
          },
          {
            label: "Rest of Africa",
            value: report.restOfAfrica.toLocaleString("en-KE"),
            hint: "Listings outside Kenya",
          },
          {
            label: "Listing views",
            value: report.views.toLocaleString("en-KE"),
            hint: `${report.active} active · ${report.pending} pending`,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe2 className="h-4 w-4 text-primary" />
              Listings by country
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.byCountry.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No listings yet. New African listings will appear here.
              </p>
            ) : (
              <ul className="space-y-3">
                {report.byCountry.slice(0, 12).map((row) => (
                  <li key={row.country}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{row.country}</span>
                      <span className="text-muted-foreground">
                        {row.listings} · {row.active} live
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          row.country === DEFAULT_LISTING_COUNTRY
                            ? "bg-primary"
                            : "bg-sky-500",
                        )}
                        style={{
                          width: `${Math.max(6, (row.listings / maxCountry) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              New listings trend (12 weeks)
            </CardTitle>
            <p className="text-sm font-normal text-muted-foreground">
              Kenya vs the rest of Africa, week by week
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm bg-primary" />
                Kenya
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm bg-sky-500" />
                Rest of Africa
              </span>
            </div>
            <div className="flex h-48 items-end gap-1">
              {report.weekly.map((week) => (
                <div
                  key={week.start}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end"
                  title={`${week.label}: ${week.kenya} Kenya, ${week.restOfAfrica} rest of Africa`}
                >
                  <div className="flex w-full max-w-[28px] flex-col justify-end overflow-hidden rounded-t-md">
                    <div
                      className="w-full bg-sky-500"
                      style={{
                        height: `${Math.max(week.restOfAfrica ? 4 : 0, (week.restOfAfrica / maxWeek) * 160)}px`,
                      }}
                    />
                    <div
                      className="w-full bg-primary"
                      style={{
                        height: `${Math.max(week.kenya ? 4 : 0, (week.kenya / maxWeek) * 160)}px`,
                      }}
                    />
                  </div>
                  <p className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">
                    {week.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Country report</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {report.byCountry.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No country data yet.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Country</th>
                  <th className="pb-3 pr-4 font-medium">Listings</th>
                  <th className="pb-3 pr-4 font-medium">Active</th>
                  <th className="pb-3 pr-4 font-medium">Pending</th>
                  <th className="pb-3 pr-4 font-medium">For sale</th>
                  <th className="pb-3 pr-4 font-medium">To let / BnB</th>
                  <th className="pb-3 font-medium">Views</th>
                </tr>
              </thead>
              <tbody>
                {report.byCountry.map((row) => (
                  <tr key={row.country} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium">
                      {row.country}
                      {row.country === DEFAULT_LISTING_COUNTRY ? (
                        <Badge variant="secondary" className="ml-2">
                          Home market
                        </Badge>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-4">{row.listings}</td>
                    <td className="py-2.5 pr-4">{row.active}</td>
                    <td className="py-2.5 pr-4">{row.pending}</td>
                    <td className="py-2.5 pr-4">{row.buy}</td>
                    <td className="py-2.5 pr-4">{row.rent}</td>
                    <td className="py-2.5">{row.views.toLocaleString("en-KE")}</td>
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
