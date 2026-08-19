"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Phone, MessageSquare } from "lucide-react";
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

type ViewingStatus = "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

interface ViewingRow {
  id: string;
  scheduledAt: string;
  status: ViewingStatus;
  notes: string | null;
  property: {
    id: string;
    title: string;
    slug: string;
    town: string;
    county: string;
    listingType: string;
  };
  buyer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

const STATUS_FILTERS = ["ALL", "SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

function formatViewingWhen(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ViewingsManager() {
  const [viewings, setViewings] = useState<ViewingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/viewings");
      const json = (await res.json()) as {
        success?: boolean;
        data?: ViewingRow[];
        error?: string;
      };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not load viewings");
        return;
      }
      setViewings(json.data ?? []);
    } catch {
      toast.error("Could not load viewings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return viewings;
    return viewings.filter((v) => v.status === filter);
  }, [viewings, filter]);

  const pendingCount = viewings.filter((v) => v.status === "SCHEDULED").length;

  async function updateStatus(id: string, status: ViewingStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/viewings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Update failed");
        return;
      }
      toast.success(`Viewing ${status.toLowerCase()}`);
      await load();
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Viewing requests</h1>
          <p className="text-muted-foreground">
            Buyers who book property viewings appear here — confirm times and follow up.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={pendingCount > 0 ? "default" : "secondary"}>
            {pendingCount} pending
          </Badge>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "ALL" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading viewings…
        </p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No viewing requests yet. When tenants book a visit on your listings,
              they will show up here and in Inquiries.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled viewings ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Property</th>
                  <th className="pb-3 pr-4 font-medium">Buyer</th>
                  <th className="pb-3 pr-4 font-medium">When</th>
                  <th className="pb-3 pr-4 font-medium">Notes</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b last:border-0 align-top">
                    <td className="py-3 pr-4 max-w-[200px]">
                      <Link
                        href={`/properties/${v.property.slug}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {v.property.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {v.property.town}, {v.property.county}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{v.buyer.name ?? "Buyer"}</p>
                      {v.buyer.email ? (
                        <p className="text-muted-foreground">{v.buyer.email}</p>
                      ) : null}
                      {v.buyer.phone ? (
                        <p className="text-muted-foreground">{v.buyer.phone}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatViewingWhen(v.scheduledAt)}
                      <p className="text-xs text-muted-foreground">
                        {v.property.listingType.replace(/_/g, " ")}
                      </p>
                    </td>
                    <td className="py-3 pr-4 max-w-[200px] text-muted-foreground">
                      {v.notes || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={
                          v.status === "CONFIRMED"
                            ? "default"
                            : v.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {v.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {v.buyer.phone ? (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={`tel:${v.buyer.phone}`}>
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" asChild>
                          <Link
                            href={`/dashboard/pro/inbox?peer=${v.buyer.id}&property=${v.property.id}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        {v.status === "SCHEDULED" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={updatingId === v.id}
                              onClick={() => updateStatus(v.id, "CONFIRMED")}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === v.id}
                              onClick={() => updateStatus(v.id, "CANCELLED")}
                            >
                              Decline
                            </Button>
                          </>
                        ) : v.status === "CONFIRMED" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === v.id}
                            onClick={() => updateStatus(v.id, "COMPLETED")}
                          >
                            Mark done
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
