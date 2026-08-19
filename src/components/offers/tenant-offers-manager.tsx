"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

interface MyOffer {
  id: string;
  amount: number;
  currency: string;
  message: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
  property: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    listingType: string;
    town: string;
    county: string;
  };
}

export function TenantOffersManager() {
  const [offers, setOffers] = useState<MyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offers/mine");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load offers");
        setOffers([]);
        return;
      }
      setOffers(json.data ?? []);
    } catch {
      toast.error("Could not load offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function withdraw(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WITHDRAWN" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not withdraw offer");
        return;
      }
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "WITHDRAWN" } : o)),
      );
      toast.success("Offer withdrawn");
    } catch {
      toast.error("Could not withdraw offer");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My offers</h1>
          <p className="text-muted-foreground">
            Track offers you have submitted on properties.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submitted offers ({offers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : offers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                You have not made any offers yet.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/properties">Browse properties</Link>
              </Button>
            </div>
          ) : (
            offers.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <Link
                    href={`/properties/${o.property.slug}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {o.property.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {o.property.town}, {o.property.county}
                  </p>
                  <p className="text-lg font-semibold">
                    Your offer: {formatPrice(o.amount, { currency: o.currency })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Listed at {formatPrice(o.property.price, { currency: o.property.currency })}
                  </p>
                  {o.message ? (
                    <p className="text-sm">{o.message}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(o.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={
                      o.status === "PENDING"
                        ? "default"
                        : o.status === "ACCEPTED"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {o.status}
                  </Badge>
                  {o.status === "PENDING" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === o.id}
                      onClick={() => void withdraw(o.id)}
                    >
                      Withdraw
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
