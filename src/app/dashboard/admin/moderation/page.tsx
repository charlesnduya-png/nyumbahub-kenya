"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";

interface PendingListing {
  id: string;
  title: string;
  description: string;
  listingType: string;
  propertyType: string;
  price: number;
  currency?: string;
  county: string;
  town: string;
  estate?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  status: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  images?: Array<{ url: string; isPrimary?: boolean; alt?: string | null }>;
  owner?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string;
  } | null;
  createdAt: string;
}

export default function AdminModerationPage() {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [source, setSource] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/listings/pending");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load pending listings");
        setListings([]);
        return;
      }
      setListings(json.data ?? []);
      setSource(json.source ?? "");
    } catch {
      toast.error("Could not load pending listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "reject" ? rejectReasons[id] : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Review failed");
        return;
      }
      toast.success(
        action === "approve"
          ? "Listing approved and now live"
          : "Listing rejected",
      );
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch {
      toast.error("Review failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Listing approvals</h1>
          <p className="text-muted-foreground">
            Review professional listings before they appear on NyumbaHub.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {source === "demo" && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Demo mode: Postgres is offline, so approvals use the local demo queue.
          Connect your database to manage real submissions.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending approval ({listings.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading queue…
            </div>
          ) : listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No listings waiting for approval.
            </p>
          ) : (
            listings.map((item) => {
              const ownerName =
                item.owner?.name ?? item.ownerName ?? "Professional seller";
              const ownerEmail =
                item.owner?.email ?? item.ownerEmail ?? "—";

              return (
                <div
                  key={item.id}
                  className="space-y-3 rounded-2xl border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge>Pending</Badge>
                        <Badge variant="outline">{item.listingType}</Badge>
                        <Badge variant="secondary">{item.propertyType}</Badge>
                      </div>
                      <h2 className="text-lg font-semibold">{item.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {item.town}, {item.county}
                        {item.estate ? ` · ${item.estate}` : ""}
                      </p>
                      <p className="mt-1 font-medium text-primary">
                        {formatPrice(item.price, {
                          currency: item.currency ?? "KES",
                        })}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Submitted by {ownerName} ({ownerEmail})
                        {item.owner?.role ? ` · ${item.owner.role}` : ""}
                      </p>
                    </div>
                  </div>

                  {item.images && item.images.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {item.images.slice(0, 6).map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${item.id}-img-${i}`}
                          src={img.url}
                          alt={img.alt ?? item.title}
                          className="h-20 w-28 shrink-0 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  ) : null}

                  <Textarea
                    placeholder="Rejection reason (optional)"
                    value={rejectReasons[item.id] ?? ""}
                    onChange={(e) =>
                      setRejectReasons((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    className="min-h-[72px]"
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === item.id}
                      onClick={() => void review(item.id, "approve")}
                    >
                      {busyId === item.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Approve & publish
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === item.id}
                      onClick={() => void review(item.id, "reject")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/properties/${item.id}`}>Preview</Link>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
