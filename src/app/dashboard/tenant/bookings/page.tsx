"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestReviewForm } from "@/components/reviews/guest-review-form";
import { canReviewStay } from "@/lib/membership";
import { formatPrice } from "@/lib/utils";

type BookingRow = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalAmount: number;
  listAmount?: number;
  memberDiscountAmount?: number;
  currency: string;
  status: string;
  guestMessage?: string | null;
  ownerNote?: string | null;
  review?: { id: string } | null;
  property: {
    id: string;
    title: string;
    slug: string;
    town: string;
    county: string;
  };
  hostUserId?: string;
};

function statusVariant(status: string) {
  if (status === "APPROVED") return "default" as const;
  if (status === "REJECTED" || status === "CANCELLED") return "destructive" as const;
  return "outline" as const;
}

export default function GuestBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const json = (await res.json()) as {
        success?: boolean;
        data?: BookingRow[];
        error?: string;
      };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not load bookings");
        return;
      }
      setBookings(json.data ?? []);
    } catch {
      toast.error("Could not load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not cancel");
        return;
      }
      toast.success("Booking cancelled");
      await load();
    } catch {
      toast.error("Could not cancel");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My stay bookings</h1>
        <p className="mt-1 text-muted-foreground">
          Hotel and BnB stays you requested on Your Home. Hosts approve bookings
          from their side.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No bookings yet. Find a BnB and request dates on the listing page.
            </p>
            <Button asChild>
              <Link href="/bnb">Browse BnBs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-lg">
                    <Link
                      href={`/properties/${b.property.slug}`}
                      className="hover:text-primary hover:underline"
                    >
                      {b.property.title}
                    </Link>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {b.property.town}, {b.property.county} · {b.nights} night
                    {b.nights === 1 ? "" : "s"} ·{" "}
                    {formatPrice(b.totalAmount, { currency: b.currency })}
                    {b.memberDiscountAmount ? (
                      <span className="ml-1 text-emerald-700 dark:text-emerald-300">
                        (saved {formatPrice(b.memberDiscountAmount, { currency: b.currency })})
                      </span>
                    ) : null}
                  </p>
                </div>
                <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  {new Date(b.checkIn).toLocaleDateString("en-KE")} →{" "}
                  {new Date(b.checkOut).toLocaleDateString("en-KE")} ·{" "}
                  {b.guests} guest{b.guests === 1 ? "" : "s"}
                </p>
                {b.ownerNote ? (
                  <p className="rounded-lg bg-muted/50 p-3">
                    Host note: {b.ownerNote}
                  </p>
                ) : null}
                {b.review ? (
                  <p className="text-sm text-muted-foreground">
                    You reviewed this stay.{" "}
                    <Link
                      href="/dashboard/tenant/reviews"
                      className="text-primary hover:underline"
                    >
                      See your reviews
                    </Link>
                  </p>
                ) : canReviewStay({
                    status: b.status,
                    checkOut: b.checkOut,
                    hasReview: false,
                  }) ? (
                  <GuestReviewForm
                    bookingId={b.id}
                    propertyTitle={b.property.title}
                    onSaved={() => void load()}
                  />
                ) : null}
                {b.status === "PENDING" || b.status === "APPROVED" ? (
                  <div className="flex flex-wrap gap-2">
                    {b.hostUserId ? (
                      <Button variant="default" size="sm" asChild>
                        <Link
                          href={`/dashboard/tenant/messages?peer=${b.hostUserId}&property=${b.property.id}`}
                        >
                          <MessageCircle className="mr-1 h-3.5 w-3.5" />
                          Chat with host
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actingId === b.id}
                      onClick={() => void cancel(b.id)}
                    >
                      Cancel request
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
