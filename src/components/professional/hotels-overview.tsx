import Link from "next/link";
import {
  ArrowRight,
  Hotel,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HOTEL_SERVICE_SECTIONS } from "@/lib/hotel-services";
import { HotelPlansShowcase } from "@/components/professional/hotel-plans-showcase";
import type { HotelPlanProduct } from "@/lib/hotel-plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HotelsOverview({ plans }: { plans?: HotelPlanProduct[] }) {
  return (
    <div className="space-y-8">
      <HotelPlansShowcase plans={plans} />

      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">How hotel services work</h2>
            <p className="text-sm text-muted-foreground">
              Publish packages where applicable, receive guest requests, send
              quotes, and confirm — all from your dashboard.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {HOTEL_SERVICE_SECTIONS.map((section) => {
            const Icon = section.icon;
            const href = `/dashboard/pro/hotels/${section.slug}`;
            return (
              <Link key={section.key} href={href} className="group block">
                <Card className="h-full transition hover:border-primary/40 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-muted p-2 group-hover:bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{section.label}</CardTitle>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {section.headline}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {section.supportsPackages ? "Packages + requests" : "Requests only"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      How it works
                    </p>
                    <ol className="space-y-1.5 text-sm text-muted-foreground">
                      {section.howItWorks.map((step, i) => (
                        <li key={step} className="flex gap-2">
                          <span className="font-semibold text-primary">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                      Open {section.shortLabel.toLowerCase()} section
                      <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Standard hotel operations</h2>
            <p className="text-sm text-muted-foreground">
              Nightly rates, guest stays, and post-stay reviews.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Listings",
              desc: "Nightly rates, photos, facilities",
              href: "/dashboard/pro/hotels/listings",
            },
            {
              label: "Bookings",
              desc: "Guest stay requests & confirmations",
              href: "/dashboard/pro/hotels/bookings",
            },
            {
              label: "Reviews",
              desc: "Post-stay guest feedback",
              href: "/dashboard/pro/hotels/reviews",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border p-4 transition hover:border-primary/40 hover:bg-muted/30"
            >
              <p className="font-medium">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Hotel className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Quick workflow</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "1",
              title: "List your hotel",
              desc: "Add photos, nightly rates, and facilities",
              href: "/dashboard/pro/hotels/listings",
            },
            {
              step: "2",
              title: "Publish packages",
              desc: "Group, event, sports, co-op, or offer packages",
              href: "/dashboard/pro/hotels/group-bookings",
            },
            {
              step: "3",
              title: "Receive requests",
              desc: "Guests enquire from your hotel pages",
              href: "/dashboard/pro/hotels/event-requests",
            },
            {
              step: "4",
              title: "Quote & confirm",
              desc: "Send quotes and mark bookings confirmed",
              href: "/dashboard/pro/hotels/bookings",
            },
          ].map((item) => (
            <Link
              key={item.step}
              href={item.href}
              className="rounded-lg border p-4 transition hover:border-primary/40 hover:bg-muted/30"
            >
              <p className="text-xs font-bold text-primary">Step {item.step}</p>
              <p className="mt-1 font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
