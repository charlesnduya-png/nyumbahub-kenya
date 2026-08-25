"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";

type BookingRow = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalAmount: number;
  currency: string;
  status: string;
  guestMessage?: string | null;
  ownerNote?: string | null;
  createdAt: string;
  property: {
    id: string;
    title: string;
    slug: string;
    town: string;
    county: string;
  };
  guest?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
};

function statusVariant(status: string) {
  if (status === "APPROVED") return "default" as const;
  if (status === "REJECTED" || status === "CANCELLED") return "destructive" as const;
  if (status === "COMPLETED") return "secondary" as const;
  return "outline" as const;
}

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
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

  async function updateStatus(
    id: string,
    status: "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED",
  ) {
    setActingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ownerNote: notes[id] || undefined,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Update failed");
        return;
      }
      toast.success(
        status === "APPROVED"
          ? "Booking approved"
          : status === "REJECTED"
            ? "Booking declined"
            : status === "COMPLETED"
              ? "Stay marked complete — earnings moved to your wallet"
              : "Booking cancelled",
      );
      await load();
    } catch {
      toast.error("Update failed");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stay bookings</h1>
        <p className="mt-1 text-muted-foreground">
          Guests book stays on Your Home. Review each request and approve or
          decline from here.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No booking requests yet. When guests book your hotel or BnB
            listings, they appear here for approval.
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
                  </p>
                </div>
                <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Check-in:</span>{" "}
                    {new Date(b.checkIn).toLocaleDateString("en-KE")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Check-out:</span>{" "}
                    {new Date(b.checkOut).toLocaleDateString("en-KE")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Guests:</span>{" "}
                    {b.guests}
                  </p>
                  <p>
                    <span className="text-muted-foreground">From:</span>{" "}
                    {b.guest?.name ?? "Guest"} · {b.guest?.email}
                    {b.guest?.phone ? ` · ${b.guest.phone}` : ""}
                  </p>
                </div>
                {b.guestMessage ? (
                  <p className="rounded-lg bg-muted/50 p-3 text-sm">
                    {b.guestMessage}
                  </p>
                ) : null}
                {b.status === "PENDING" ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Optional note to the guest…"
                      value={notes[b.id] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [b.id]: e.target.value }))
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      {b.guest?.id ? (
                        <Button variant="secondary" size="sm" asChild>
                          <Link
                            href={`/dashboard/pro/inbox?peer=${b.guest.id}&property=${b.property.id}`}
                          >
                            <MessageCircle className="mr-1 h-3.5 w-3.5" />
                            Chat with guest
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        disabled={actingId === b.id}
                        onClick={() => void updateStatus(b.id, "APPROVED")}
                      >
                        Approve booking
                      </Button>
                      <Button
                        variant="outline"
                        disabled={actingId === b.id}
                        onClick={() => void updateStatus(b.id, "REJECTED")}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ) : b.status === "APPROVED" ? (
                  <div className="flex flex-wrap gap-2">
                    {b.guest?.id ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/dashboard/pro/inbox?peer=${b.guest.id}&property=${b.property.id}`}
                        >
                          <MessageCircle className="mr-1 h-3.5 w-3.5" />
                          Chat with guest
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      disabled={actingId === b.id}
                      onClick={() => void updateStatus(b.id, "COMPLETED")}
                    >
                      Mark stay complete
                    </Button>
                    <Button
                      variant="outline"
                      disabled={actingId === b.id}
                      onClick={() => void updateStatus(b.id, "CANCELLED")}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : b.guest?.id ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/dashboard/pro/inbox?peer=${b.guest.id}&property=${b.property.id}`}
                    >
                      <MessageCircle className="mr-1 h-3.5 w-3.5" />
                      Chat with guest
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
