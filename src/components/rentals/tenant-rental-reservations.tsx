"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

interface MyReservation {
  id: string;
  moveInDate: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  rentalRoom?: { id: string; label: string; status: string } | null;
  property: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    town: string;
    county: string;
    status: string;
  };
}

export function TenantRentalReservations() {
  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rental-reservations/mine");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load reservations");
        setReservations([]);
        return;
      }
      setReservations(json.data ?? []);
    } catch {
      toast.error("Could not load reservations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/rental-reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not cancel");
        return;
      }
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r)),
      );
      toast.success("Reservation cancelled");
    } catch {
      toast.error("Could not cancel");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My rental reservations</h1>
          <p className="text-muted-foreground">
            Rentals you have requested on Your Home.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservations ({reservations.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : reservations.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No rental reservations yet.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/rent">Browse rentals</Link>
              </Button>
            </div>
          ) : (
            reservations.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div>
                  <Link
                    href={`/properties/${r.property.slug}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.property.title}
                    {r.rentalRoom?.label ? ` · ${r.rentalRoom.label}` : ""}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {r.property.town}, {r.property.county}
                  </p>
                  <p className="font-semibold">
                    {formatPrice(r.property.price, {
                      currency: r.property.currency,
                    })}
                    /month
                  </p>
                  {r.moveInDate ? (
                    <p className="text-sm">
                      Move-in:{" "}
                      {new Date(r.moveInDate).toLocaleDateString("en-KE")}
                    </p>
                  ) : null}
                  {r.message ? <p className="text-sm">{r.message}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={
                      r.status === "RENTED"
                        ? "secondary"
                        : r.status === "PENDING"
                          ? "default"
                          : "outline"
                    }
                  >
                    {r.status}
                  </Badge>
                  {["PENDING", "APPROVED"].includes(r.status) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.id}
                      onClick={() => void cancel(r.id)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
