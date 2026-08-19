"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Phone,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

interface ReceivedOffer {
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
  };
  buyer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export function PropertyOffersManager() {
  const [offers, setOffers] = useState<ReceivedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offers/received");
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

  const filtered = useMemo(() => {
    if (filter === "ALL") return offers;
    return offers.filter((o) => o.status === filter);
  }, [offers, filter]);

  const pendingCount = offers.filter((o) => o.status === "PENDING").length;

  async function respond(id: string, status: "ACCEPTED" | "REJECTED") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Update failed");
        return;
      }
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
      toast.success(
        status === "ACCEPTED" ? "Offer accepted" : "Offer declined",
      );
    } catch {
      toast.error("Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Property offers</h1>
          <p className="text-muted-foreground">
            Offers from buyers on your listings — accept, decline, or follow up.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <Badge>{pendingCount} pending</Badge>
          ) : null}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incoming offers ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading offers…
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No offers yet. When a buyer submits an offer on your listing, it
              will appear here.
            </p>
          ) : (
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Buyer</th>
                  <th className="pb-3 pr-4 font-medium">Listing</th>
                  <th className="pb-3 pr-4 font-medium">Offer</th>
                  <th className="pb-3 pr-4 font-medium">Listed</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">When</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b align-top last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{o.buyer.name}</p>
                      <p className="text-muted-foreground">{o.buyer.email}</p>
                      {o.buyer.phone ? (
                        <a
                          href={`tel:${o.buyer.phone}`}
                          className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {o.buyer.phone}
                        </a>
                      ) : null}
                    </td>
                    <td className="max-w-[180px] py-3 pr-4">
                      <Link
                        href={`/properties/${o.property.slug}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {o.property.title}
                      </Link>
                      {o.message ? (
                        <p className="mt-1 text-muted-foreground">
                          {o.message}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 font-semibold">
                      {formatPrice(o.amount, { currency: o.currency })}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatPrice(o.property.price, { currency: o.property.currency })}
                    </td>
                    <td className="py-3 pr-4">
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
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatRelativeDate(o.createdAt)}
                    </td>
                    <td className="py-3">
                      {o.status === "PENDING" ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={busyId === o.id}
                            onClick={() => void respond(o.id, "ACCEPTED")}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === o.id}
                            onClick={() => void respond(o.id, "REJECTED")}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
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
