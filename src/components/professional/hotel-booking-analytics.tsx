"use client";

import { useMemo } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { HotelPlanUsage } from "@/lib/hotel-plan-server";

type BookingRow = {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  nights: number;
  guests: number;
  createdAt: string;
  property: { title: string; town: string };
};

export function HotelBookingAnalytics({
  bookings,
  usage,
}: {
  bookings: BookingRow[];
  usage: HotelPlanUsage | null;
}) {
  const advanced = usage?.limits.bookingAnalytics === "advanced";

  const stats = useMemo(() => {
    const total = bookings.length;
    const approved = bookings.filter((b) => b.status === "APPROVED" || b.status === "COMPLETED");
    const pending = bookings.filter((b) => b.status === "PENDING");
    const revenue = approved.reduce((s, b) => s + b.totalAmount, 0);
    const currency = bookings[0]?.currency ?? "KES";
    const avgNights =
      approved.length > 0
        ? approved.reduce((s, b) => s + b.nights, 0) / approved.length
        : 0;
    const byProperty = new Map<string, { title: string; count: number; revenue: number }>();
    for (const b of approved) {
      const key = b.property.title;
      const cur = byProperty.get(key) ?? { title: key, count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += b.totalAmount;
      byProperty.set(key, cur);
    }
    const topHotels = [...byProperty.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const last30 = bookings.filter(
      (b) => Date.now() - new Date(b.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000,
    ).length;

    return { total, approved: approved.length, pending: pending.length, revenue, currency, avgNights, topHotels, last30 };
  }, [bookings]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">
          Booking analysis
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({advanced ? "Advanced" : "Basic"} — {usage?.planName ?? "Free"} plan)
          </span>
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total bookings</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Confirmed revenue</p>
            <p className="text-2xl font-bold">
              {formatPrice(stats.revenue, { currency: stats.currency })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        {advanced ? (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Last 30 days</p>
              <p className="text-2xl font-bold">{stats.last30}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed opacity-80">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Avg nights</p>
              <p className="text-2xl font-bold">{stats.avgNights.toFixed(1)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {advanced ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Top hotels by revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topHotels.length === 0 ? (
              <p className="text-sm text-muted-foreground">No confirmed bookings yet.</p>
            ) : (
              <ul className="space-y-2">
                {stats.topHotels.map((h) => (
                  <li
                    key={h.title}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{h.title}</span>
                    <span className="text-muted-foreground">
                      {h.count} stays · {formatPrice(h.revenue, { currency: stats.currency })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-xs text-muted-foreground">
          Upgrade to <strong>Pro</strong> or above for advanced analysis — top hotels, 30-day trends,
          and revenue breakdown.
        </p>
      )}
    </div>
  );
}
